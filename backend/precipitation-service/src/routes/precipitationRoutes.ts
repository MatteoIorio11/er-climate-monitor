import express from "express";
import { controller } from "../controllers/precipitationController";
const API_TOKEN = "api";
const version = "v0";
const defaultPath = `/${API_TOKEN}/${version}`;


const router = express.Router();

router.route("")