import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { isIpValid } from './utils/ipUtils';
import { deleteSensor, exists, findAllSensors, saveSensor } from './utils/sensorUtils';
import { API_KEY_FIELD, SENSOR_IP_FIELD, SENSOR_PORT_FIELD } from '../../model/v0/headers/sensorHeaders';
import dotenv from 'dotenv';
import { fromBody, fromHeaders } from './utils/requestUtils';
import Logger from "js-logger";

Logger.useDefaults();

dotenv.config();

const SECRET_API_KEY = String(process.env.SECRET_API_KEY);
const MAX_PORT = 65_535;

function isAuthorized(key: string): boolean {
    return key !== '' && key === SECRET_API_KEY;
}

const registerSensor = async (request: Request, response: Response) => {
    const modelData = request.body;
    if (modelData) {
        const apikey = fromHeaders(request.headers, API_KEY_FIELD.toLowerCase(), '');
        Logger.info('Received a request for saving a new sensor');
        if (isAuthorized(apikey)) {
            const ip = fromBody(modelData, SENSOR_IP_FIELD, '');
            const port = fromBody(modelData, SENSOR_PORT_FIELD, -1);
            if (port >= 0 && port <= MAX_PORT && ip != '' && isIpValid(ip)) {
                if (!(await exists(ip, port))) {
                    Logger.info('The sensor does not exists, saving it');
                    await saveSensor(ip, port);
                    response.status(HttpStatus.CREATED);
                } else {
                    response.status(HttpStatus.CONFLICT);
                }
            } else {
                response.status(HttpStatus.NOT_ACCEPTABLE);
            }
        } else {
            response.status(HttpStatus.UNAUTHORIZED);
        }
    } else {
        response.status(HttpStatus.BAD_REQUEST);
    }
    response.end();
};

const allSensors = async (request: Request, response: Response) => {
    const apikey = fromHeaders(request.headers, API_KEY_FIELD.toLowerCase(), '');
    Logger.info('Received a request for returing all the sensors');
    if (apikey !== '' && isAuthorized(apikey)) {
        response.send({ sensors: await findAllSensors() });
    } else {
        response.status(HttpStatus.UNAUTHORIZED);
    }
    response.end();
};

const shutOff = async (request: Request, response: Response) => {
    const modelData = request.body;
    if (modelData) {
        const apikey = fromHeaders(request.headers, API_KEY_FIELD.toLowerCase(), '');
        if (apikey !== '' && isAuthorized(apikey)) {
            Logger.info('Received a request for shutting of a sensor');
            const ip = fromBody(modelData, SENSOR_IP_FIELD, '');
            const port = fromBody(modelData, SENSOR_PORT_FIELD, -1);
            if ((await exists(ip, port)) && (await deleteSensor(ip, port))) {
                response.status(HttpStatus.OK);
            } else {
                response.status(HttpStatus.NOT_FOUND);
            }
        } else {
            response.status(HttpStatus.UNAUTHORIZED);
        }
    } else {
        response.status(HttpStatus.BAD_REQUEST);
    }
    response.end();
};

export { registerSensor, allSensors, shutOff };
