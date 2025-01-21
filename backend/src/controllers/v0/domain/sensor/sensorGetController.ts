import { Request, Response } from 'express';
import { removeServiceFromUrl } from '../../utils/api/urlUtils';
import { SENSOR_REGISTRY_ENDPOINT } from '../../../../models/v0/serviceModels';
import { sensorService } from './sensorConfig';
import { fromAxiosToResponse, handleAxiosError } from '../../utils/api/responseUtils';
import { AxiosError, HttpStatusCode } from 'axios';
import Logger from 'js-logger';
import { USER_JWT_TOKEN_BODY } from '../../../../models/v0/authentication/headers/authenticationHeaders';
import { API_KEY_HEADER } from '../../../../models/v0/sensor/headers/sensorHeaders';

Logger.useDefaults();
const SECRET = String(process.env.SECRET_API_KEY);


const sensorGetHandler = async (request: Request, response: Response) => {
    const endpointPath = removeServiceFromUrl(SENSOR_REGISTRY_ENDPOINT, request.url);
    try {
        Logger.info('Requested to get all the sensors');
        const jwtToken = String(request.headers[USER_JWT_TOKEN_BODY.toLowerCase()]);
        if (jwtToken === null || !await sensorService.authenticationClient.isAdmin(jwtToken)) {
            response.status(HttpStatusCode.Unauthorized);
            return;
        }
        request.headers[API_KEY_HEADER.toLowerCase()] = SECRET;
        const axiosResponse = await sensorService.getAllSensorsOperation(endpointPath, request.headers, request.body);
        response = fromAxiosToResponse(axiosResponse, response);
        response.send(axiosResponse.data);
    } catch (error) {
        Logger.info('Error while trying to return all the different sensors');
        if (error instanceof AxiosError) {
            response = handleAxiosError(error, response);
        } else if (error instanceof Error) {
            response.status(HttpStatusCode.BadRequest).send(error.message);
        }
    } finally {
        response.end();
    }
};

export { sensorGetHandler };
