import express, { Application } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
// import SwaggerUi  from "swagger-ui-express";
import sensorRouter from './routes/v0/sensorRoutes';
import { API_ROUTES } from './routes/v0/paths/detection.paths';
// import YAML from "yaml";
dotenv.config();

const PORT = process.env.PORT || 3000;

export default function createServer(): Application {
    const app = express();
    const URL: string = process.env.DB_URL || '';
    mongoose.connect(URL, { dbName: 'detections-database', autoIndex: false });

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // if (!process.env.CI || (process.env.CI == "False")) {
    //     const file: string = fs.readFileSync("src/doc/openapi/swagger.yaml", "utf8");
    //     const swaggerDocument = YAML.parse(file);
    //     app.use("/api-docs", SwaggerUi.serve, SwaggerUi.setup(swaggerDocument));
    // }

    app.use(API_ROUTES.SENSOR.ROOT, sensorRouter);
    
    return app;
}

const app = createServer();

app.listen(PORT, () => {
    console.log('Server listening on port', PORT);
});
