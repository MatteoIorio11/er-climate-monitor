import { Request, Response } from 'express';
import { sensorService } from './sensorConfig';
import {
    USER_JWT_TOKEN_BODY,
    USER_TOKEN_HEADER,
} from '../../../../models/v0/authentication/headers/authenticationHeaders';
import { API_KEY_HEADER } from '../../../../models/v0/sensor/headers/sensorHeaders';
import Logger from 'js-logger';
import HttpStatus from 'http-status-codes';
import { SENSOR_REGISTRY_ENDPOINT } from '../../../../models/v0/serviceModels';
import { removeServiceFromUrl } from '../../utils/api/urlUtils';
import { fromHttpResponseToExpressResponse } from '../../utils/api/responseUtils';
Logger.useDefaults();

const SECRET = String(process.env.SECRET_API_KEY);

/**
 * @param {Request} request - The input user's request.
 * @param {Response} response - The server's response.
 * @returns {Promise<void>} Handle the input user's request regarding a DELETE to the Sensor Registry.
 */
const sensorDeleteHandler = async (request: Request, response: Response) => {
    try {
        Logger.info('Received a request for deleting a sensor');
        const endpointPath = removeServiceFromUrl(SENSOR_REGISTRY_ENDPOINT, request.url);
        const jwtToken = String(request.headers[USER_TOKEN_HEADER.toLowerCase()]);
        const authorized = await sensorService.authenticationClient.isAdminAndNotExpired(jwtToken);
        if (jwtToken === null || !authorized) {
            response.status(HttpStatus.UNAUTHORIZED);
            return;
        }
        Logger.info('The user is an admin, we can procede');
        request.headers[API_KEY_HEADER.toLowerCase()] = SECRET;
        const httpResponse = await sensorService.deleteOperation(endpointPath, request.headers);
        response = fromHttpResponseToExpressResponse(httpResponse, response);
        response.send(httpResponse.data);
    } catch (error) {
        Logger.error('Something went wrong while trying for deleting a sensor');
        if (error instanceof Error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    } finally {
        response.end();
    }
};

export { sensorDeleteHandler };
