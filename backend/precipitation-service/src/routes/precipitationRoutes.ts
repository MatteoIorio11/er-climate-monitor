import express from "express";
import { getLatestX } from "../controllers/precipitationController";
const API_TOKEN = "api";
const version = "v0";
const defaultPath = `/${API_TOKEN}/${version}`;
const LATEST_VALUES = `/${defaultPath}/get-latest`
const LATEST_X_VALUES = `/${LATEST_VALUES}/:x`


const router = express.Router();

router.route(LATEST_X_VALUES)
    .get(getLatestX)