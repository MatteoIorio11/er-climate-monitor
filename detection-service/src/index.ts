import express, { Application } from 'express';
import dotenv from 'dotenv';
import mongoose from "mongoose"
// import SwaggerUi  from "swagger-ui-express";
import fs  from "fs";
import { detectionRouter } from './routes/v0/detectionRouter';
// import YAML from "yaml";


dotenv.config();

const PORT = process.env.PORT || 3000;

export default function createServer(): Application {
    const app = express();
    const URL: string = process.env.DB_URL || "";
    mongoose.connect(URL, { dbName: "temperature-database", autoIndex: false });

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // if (!process.env.CI || (process.env.CI == "False")) {
    //     const file: string = fs.readFileSync("src/doc/openapi/swagger.yaml", "utf8");
    //     const swaggerDocument = YAML.parse(file);
    //     app.use("/api-docs", SwaggerUi.serve, SwaggerUi.setup(swaggerDocument));
    // }

    app.use("/v0/sensor", detectionRouter);
    return app;
}

const app = createServer();

app.listen(PORT, () => {
    console.log("listening", PORT);
})