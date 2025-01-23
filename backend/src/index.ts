import express from 'express';
import dotenv from 'dotenv';
import { BASE_PATH_V0 } from './routes/v0/paths/gatewayPaths';
import { gatewayRouter } from './routes/v0/gatewayRouter';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketProxy } from './service/v0/notification/WebSocketProxy';
import Logger from 'js-logger';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get(BASE_PATH_V0, (_, res) => {
    res.send(`Running in ${process.env.NODE_ENV} mode`);
});

app.use(BASE_PATH_V0, gatewayRouter);
const wsProxy = new WebSocketProxy(httpServer);

httpServer.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));

process.on('SIGINT', () => {
    Logger.info('Shutting down server...');
    wsProxy.close();
    httpServer.close(() => {
        Logger.info('HTTP server closed successfully, bye.');
        process.exit(0);
    });
});
