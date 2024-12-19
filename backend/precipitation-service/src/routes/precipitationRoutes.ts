import express from "express";
import { getLatestX, postNewData } from "../controllers/precipitationController";

const API_TOKEN = "api";
const version = "v0";
const defaultPath = `/${API_TOKEN}/${version}/precipitation`;

function buildEndpoint(endpoint: String): String {
    return defaultPath + endpoint;
}




const router = express.Router();


router.route(LATEST_X_VALUES)
    .get(getLatestX);

router.route(POST_DATA)
    .post(postNewData);