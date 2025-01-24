import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';
import { DetectionBroker, DetectionEvent, parseSubscription, SubscriptionTopic } from '../components/detectionBroker';
import { SocketManager } from '../components/socketManager';
import { parse } from 'path';

type Subscription = {
    userId: string;
    topic: SubscriptionTopic;
};

let messageBroker: DetectionBroker<DetectionEvent> | undefined;
let socketManager: SocketManager | undefined;

function setMessageBroker(mb: DetectionBroker<DetectionEvent>) {
    messageBroker = mb;
}

function setSocketManger(sm: SocketManager) {
    socketManager = sm;
}

/**
 * By now crud operations are just manipulating in-memory data structures.
 * Refactor the following functions in order to handle MongoDB when
 * persistency is implemented.
 */

const subscribeUser = async (request: Request, response: Response) => {
    subUser(request.body)
        ?.then((subInfo) => {
            if (subInfo) response.status(HttpStatusCode.Ok).json(subInfo);
            else throw new Error('Something went wrong during subscription');
        })
        .catch((err) => response.status(HttpStatusCode.BadRequest).json({ error: `something went wrong: ${err}` }));
};

async function subUser(sub: Subscription): Promise<{ uid: string; topicAddr: string } | null | undefined> {
    return messageBroker?.subscribeUser(sub.userId, sub.topic)?.then((success) => {
        if (success) return socketManager?.registerUser(sub.userId, sub.topic);
        else return null;
    });
}

const deleteUserSubscription = async (request: Request, response: Response) => {
    const userId = request.query['userId'] as string | undefined;
    const topicAddr = request.query['topicAddr'] as string | undefined;

    if (!userId || !topicAddr) {
        response
            .status(HttpStatusCode.BadRequest)
            .json({ error: `Invalid parameters, got: userId: ${userId}, topicAddr: ${topicAddr}` });
        return;
    }

    try {
        const sub = parseSubscription(topicAddr, socketManager!.topicPrefix);
        let success = await messageBroker?.unsubscribeUser(userId, sub);
        if (!success) {
            response.status(HttpStatusCode.NotFound).json({
                error: `something went wrong... are you really sure ${userId} was subscribed to ${topicAddr}?`,
            });
            return;
        }

        success = socketManager?.unregisterUser(userId, sub);
        if (!success) {
            response.status(HttpStatusCode.NotFound).json({
                error: `something went wrong during socket closing... are you really sure ${userId} was subscribed to ${topicAddr}?`,
            });
            return;
        }

        response.status(HttpStatusCode.Ok).send();
    } catch (err) {
        response.status(HttpStatusCode.InternalServerError).json({ error: (err as Error).message });
    }
};

const getUserSubscriptions = async (request: Request, response: Response) => {
    const userId: string | undefined = request.query['userId'] as string | undefined;
    if (!userId) {
        response.status(HttpStatusCode.BadRequest).json({ error: `Invalid provided userId (${userId})` });
    }

    try {
        const subs = messageBroker?.retrieveUserSubscriptions(userId!);
        response.status(HttpStatusCode.Ok).json(subs);
    } catch (err) {
        response.status(HttpStatusCode.InternalServerError).json({ error: (err as Error).message });
    }
};

export { subscribeUser, deleteUserSubscription, getUserSubscriptions, setSocketManger, setMessageBroker };