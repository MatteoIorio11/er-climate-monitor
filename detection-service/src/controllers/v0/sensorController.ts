import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { getModelForSensorType } from '../../models/v0/detectionModel';
import {
    handleGetDetectionsFromSensor,
    handleSaveDetection,
    handleGetSensorLocationsByType,
    handleAlertPropagation,
} from './utils/handlers';
import { sensorIdParameter } from '../../routes/v0/paths/detection.paths';
import { checkSensorID } from './utils/detectionUtils';
import validateDetectionData from './utils/validation';
import { ERROR_TAG, SUCCESS_TAG, SENSOR_ID_HEADER, SENSOR_DETECTION_TIMESTAMP_HEADER } from '../../config/Costants';
import { Alert } from 'src/models/v0/alertModel';
import Logger from 'js-logger';
import { sendMessageToSubscribers } from '../../sockets/socket';

Logger.useDefaults();

async function saveDetection(req: Request, res: Response) {
    const modelData = req.body;
    const { sensorType, [sensorIdParameter]: sensorId } = req.params;

    if (!Object.keys(modelData).length) {
        res.status(HttpStatus.BAD_REQUEST).send({
            [ERROR_TAG]: 'Missing detection data in the request body.',
        });
        return;
    }

    modelData[SENSOR_ID_HEADER] = sensorId;

    modelData[SENSOR_DETECTION_TIMESTAMP_HEADER] = Number(modelData[SENSOR_DETECTION_TIMESTAMP_HEADER]) as number;
    const validationError = validateDetectionData(modelData);
    if (validationError) {
        Logger.error(validationError);
        res.status(HttpStatus.BAD_REQUEST).send({
            [ERROR_TAG]: validationError,
        });
        return;
    }

    handleSaveDetection(getModelForSensorType(sensorType), modelData)
        .then((detection) => {
            res.status(HttpStatus.CREATED).send({
                [SUCCESS_TAG]: 'Detection saved successfully.',
            });
            sendMessageToSubscribers(detection.sensorId, detection);
        })
        .catch((e) =>
            res.status(HttpStatus.BAD_REQUEST).send({
                [ERROR_TAG]: e.message || 'Failed to save detection.',
            }),
        )
        .finally(() => res.end());
}

async function getDetectionsFromSensor(req: Request, res: Response) {
    const { sensorType, [sensorIdParameter]: sensorId } = req.params;

    try {
        if (!(await checkSensorID(getModelForSensorType(sensorType), sensorId))) {
            res.status(HttpStatus.NOT_FOUND).send({
                [ERROR_TAG]: 'The input sensor ID does not exist.',
            });
            return;
        }

        const result = await handleGetDetectionsFromSensor(sensorType, sensorId, req);
        res.status(HttpStatus.OK).send(result);
    } catch (error) {
        res.status(HttpStatus.BAD_REQUEST).send({
            [ERROR_TAG]: error instanceof Error ? error.message : 'An error occurred.',
        });
    } finally {
        res.end();
    }
}

async function getSensorLocationsByType(req: Request, res: Response) {
    const { sensorType } = req.params;

    try {
        const result = await handleGetSensorLocationsByType(getModelForSensorType(sensorType));
        if (!result || result.length === 0) {
            res.status(HttpStatus.NOT_FOUND).send({
                [ERROR_TAG]: `No locations found for sensor type "${sensorType}".`,
            });
            return;
        }

        res.status(HttpStatus.OK).send(result);
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            [ERROR_TAG]: error instanceof Error ? error.message : 'An error occurred.',
        });
    } finally {
        res.end();
    }
}

function forwardAlert(req: Request, res: Response) {
    try {
        const alert: Alert = req.body;
        Logger.info('Alert arrived: ', JSON.stringify(alert));
        if (handleAlertPropagation(alert)) res.status(HttpStatus.OK).send();
        else res.status(HttpStatus.INTERNAL_SERVER_ERROR).send();
    } catch (error) {
        Logger.error('An error occurred', error);
        res.status(HttpStatus.BAD_REQUEST).json({ error: (error as Error).message });
    }
}

export { saveDetection, getDetectionsFromSensor, getSensorLocationsByType, forwardAlert };
