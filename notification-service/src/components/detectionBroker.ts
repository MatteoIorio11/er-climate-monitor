import Logger from 'js-logger';
import { Connection, Channel, connect, ConsumeMessage } from 'amqplib';

Logger.useDefaults();

interface Subscription {
    userIds: Set<string>;
    patterns: Set<string>;
}

interface SubscriptionTopic {
    topic: string;
    sensorName?: string;
    query?: string;
}

interface DetectionEvent {
    sensorName: string;
    type: string;
    value: number;
    unit: string;
    timestamp: number;
    // TODO: If DetectionService cheks for queries leave this as is: in case this
    // service must check, make this field an array of queries and check them.
    // This will also mean that each detection must be sent to this service :(.
    query: { value: number; name: string };
}

type NotificationCallback<T> = (_userIds: Set<string>, _topic: SubscriptionTopic, _mesasge: T) => Promise<void>;

class DetectionBroker<T> {
    private connection: Connection | undefined;
    private channel: Channel | undefined;
    private connected: boolean = false;
    notificationCallback: NotificationCallback<T> | undefined;

    private readonly EXCHANGE_NAME = process.env.EXCHANGE_NAME ?? 'sensor.notifications';
    private readonly QUEUE_NAME: string;
    private readonly connectionUrl: string;

    private subscriptions: Map<string, Subscription>;
    private userSubscriptions: Map<string, Set<string>>;

    constructor(
        connectionUrl: string = process.env.AMQP_URL ?? 'amqp://localhost',
        instanceId: string | undefined = process.env.INSTANCE_ID
    ) {
        if (!instanceId) {
            instanceId = 'default';
        }
        this.connectionUrl = connectionUrl;
        this.QUEUE_NAME = `notifications.${instanceId}`;
        this.subscriptions = new Map();
        this.userSubscriptions = new Map();
    }

    async connect(): Promise<void> {
        if (this.connected) return;
        try {
            Logger.info('⏳ Connecting to Rabbit-MQ Server ...');
            this.connection = await connect(this.connectionUrl);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });

            const { queue } = await this.channel.assertQueue(this.QUEUE_NAME, {
                durable: true,
                arguments: {
                    'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours TTL
                },
            });

            await this.channel.consume(queue, (msg) => this.handleMessage(msg));

            this.connection.on('error', (err) => {
                Logger.error('Connection error: ', err);
                this.connected = false;
                this.reconnect();
            });

            this.connected = true;
            Logger.info('✅ Succesfully connected to broker!');
        } catch (error) {
            Logger.error(`❌ An error occurred when attempting to connect to ${this.connectionUrl}: ` + error);
            this.reconnect();
        }
    }

    private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
        if (!msg || !this.channel) return;
        try {
            const content = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            for (const [pattern, subscription] of this.subscriptions.entries()) {
                if (this.matchesPattern(routingKey, pattern) && this.notificationCallback) {
                    const topic = this.routingKeyToTopic(routingKey);
                    Logger.info('Invoking notificationCallback with the following details:', {
                        pattern,
                        subscription,
                        userIds: subscription.userIds,
                        topic,
                        content,
                    });
                    this.notificationCallback(subscription.userIds, parseSubscription(pattern), content);
                }
            }
            this.channel.ack(msg);
        } catch (error) {
            Logger.error('Error processing message: ', error);
            this.channel.nack(msg, false, false);
        }
    }

    async subscribeUser(userId: string, topic: SubscriptionTopic): Promise<boolean> {
        if (!this.ensureConnection()) return false;
        try {
            const routingPattern = this.getRoutingPattern(topic);
            let subscription = this.subscriptions.get(routingPattern);
            if (!subscription) {
                subscription = {
                    userIds: new Set(),
                    patterns: new Set([routingPattern]),
                };
                this.subscriptions.set(routingPattern, subscription);

                await this.channel!.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, routingPattern);
            }

            subscription.userIds.add(userId);
            let userPatterns = this.userSubscriptions.get(userId);
            if (!userPatterns) {
                userPatterns = new Set();
                this.userSubscriptions.set(userId, userPatterns);
            }

            userPatterns.add(routingPattern);
            Logger.info(`User ${userId} subscribed to pattern: ${routingPattern}`);
            return true;
        } catch (error) {
            Logger.error(`Failed to subscribe user ${userId} to topic ${JSON.stringify(topic)}: `, error);
            return false;
        }
    }

    async unsubscribeUser(userId: string, topic: SubscriptionTopic): Promise<boolean> {
        const topicKey = this.getRoutingPattern(topic);
        const sub = this.subscriptions.get(topicKey);
        if (!sub) {
            Logger.warn(`User ${userId} was not subscried to: ${topicKey}`);
            return false;
        }
        return sub.userIds.delete(userId);
    }

    retrieveUserSubscriptions(userId: string): Set<string> {
        return this.userSubscriptions.get(userId) || new Set();
    }

    private getRoutingPattern(topic: SubscriptionTopic): string {
        return stringifySubscription(topic);
    }

    private matchesPattern(routingKey: string, pattern: string): boolean {
        const routingParts = routingKey.split('.');
        return pattern.split('.').every((part, i) => part === '#' || part === '*' || part === routingParts[i]);
    }

    private routingKeyToTopic(routingKey: string): SubscriptionTopic {
        const [topic, sensorName, query] = routingKey.split('.');
        return { topic, sensorName, query };
    }

    private ensureConnection(): boolean {
        if (!this.connected || !this.connection) {
            Logger.error(`Connection to broker has not been established yet. Have you used 'connect' before?`);
            return false;
        }
        return true;
    }

    private async reconnect(attempt: number = 1) {
        const maxAttempts = 5;
        const delay = Math.min(1000 * attempt, 5000); // Exponential backoff :)

        if (attempt > maxAttempts) {
            Logger.error('Max reconnections attempts reached!');
            return;
        }

        try {
            await new Promise((resolve) => setTimeout(resolve, delay));
            await this.connect();
        } catch (error) {
            Logger.error(`Reconnection attempt ${attempt} failed: `, error);
            await this.reconnect(attempt + 1);
        }
    }

    async close(): Promise<void> {
        try {
            await this.channel?.close();
            await this.connection?.close();
            this.connected = false;
        } catch (_) {
            this.connected = false;
        }
    }
}

function stringifySubscription(sub: SubscriptionTopic): string {
    const topicName = `${sub.topic}`;

    if (!sub.sensorName) {
        if (!sub.query) {
            return `${topicName}.#`;
        }
        return `${topicName}.*.${sub.query}`;
    }

    if (!sub.query) {
        return `${topicName}.${sub.sensorName}.#`;
    }
    return `${topicName}.${sub.sensorName}.${sub.query}`;
}

function parseSubscription(sub: string, prefix: string | null = null): SubscriptionTopic {
    if (prefix && sub.startsWith(`${prefix}.`)) {
        sub = sub.substring(prefix.length + 1);
    }

    const parts = sub.split('.');
    const subscription: SubscriptionTopic = { topic: parts[0] };

    if (parts.length === 2 && parts[1] == '#') {
        return subscription;
    } else if (parts.length === 3 && parts[1] === '*') {
        subscription.query = parts[2];
    } else if (parts.length === 3 && parts[2] === '#') {
        subscription.sensorName = parts[1];
    } else if (parts.length === 3) {
        subscription.sensorName = parts[1];
        subscription.query = parts[2];
    }
    return subscription;
}

const detectionAlertBroker = new DetectionBroker<DetectionEvent>();

export {
    DetectionBroker,
    NotificationCallback,
    DetectionEvent,
    SubscriptionTopic,
    detectionAlertBroker,
    stringifySubscription,
    parseSubscription,
};