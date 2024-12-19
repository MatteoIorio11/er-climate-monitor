import express from "express";
import { getLatestX, postNewData } from "../controllers/precipitationController";

const API_TOKEN = "api";
const version = "v0";
const defaultPath = `/${API_TOKEN}/${version}/precipitation`;

function buildEndpoint(endpoint: string): string {
    return defaultPath + endpoint;
}

const router = express.Router();


router.route(buildEndpoint(LATEST_X_VALUES))
    .get(getLatestX);

router.route(buildEndpoint(ADD_DATA))
    .post(postNewData);