import { Request, Response } from 'express';
import { removeServiceFromUrl } from '../../utils/api/urlUtils';
import { DETECTION_ENDPOINT } from '../../../../models/v0/serviceModels';
import Logger from 'js-logger';
import HttpStatus from 'http-status-codes';
import { fromHttpResponseToExpressResponse } from '../../utils/api/responseUtils';
import { detectionService } from './detectionConfig';

Logger.useDefaults();

const detectionGetHandler = async (request: Request, response: Response) => {
    let endpointPath = removeServiceFromUrl(DETECTION_ENDPOINT, request.url);
            try {
                const httpResponse = await detectionService.getDetectionsOperation(
                    endpointPath,
                    request.headers,
                    request.body,
                );
                response = fromHttpResponseToExpressResponse(httpResponse, response);
                response.send(httpResponse.data);
            } catch (error) {
                Logger.error("Error during getting detections " + error);
                if (error instanceof Error) {
                    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
                }
            } finally {
                response.end();
            }
            return;
    }

export { detectionGetHandler };
