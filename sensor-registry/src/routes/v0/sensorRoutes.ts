import express from "express"
import { allSensors, registerSensor, shutOff } from "../../controllers/v0/sensorController";
import { ALL_PATH, REGISTER_PATH, SHUT_OFF_PATH } from "./paths/sensorPaths";

const sensorRouter = express.Router();

sensorRouter.route(REGISTER_PATH)
    .post(registerSensor);

sensorRouter.route(ALL_PATH)
    .get(allSensors)

sensorRouter.route(SHUT_OFF_PATH)
    .delete(shutOff);

export { sensorRouter }