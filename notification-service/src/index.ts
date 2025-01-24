import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { router } from './notificationRoutes';
import Logger from 'js-logger';
import { SocketManager, createSocketNotificationCallback } from './components/socketManager';
import { config } from 'dotenv';
import { DetectionBroker, DetectionEvent } from './components/detectionBroker';
import { setMessageBroker, setSocketManger } from './handlers/notificationHttpHandler';

config();
Logger.useDefaults();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 4444;
const host = process.env.HOST || 'localhost';

const messageBroker = new DetectionBroker<DetectionEvent>();
const socketManager = new SocketManager(server);

messageBroker.connect();

messageBroker.notificationCallback = createSocketNotificationCallback(socketManager);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

setMessageBroker(messageBroker);
setSocketManger(socketManager);

app.use('/v0/alert', router);
server.listen(4444, () => Logger.log(`Server listening on http://${host}:${port}`));