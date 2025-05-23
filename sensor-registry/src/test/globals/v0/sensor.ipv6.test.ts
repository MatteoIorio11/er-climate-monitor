import request from 'supertest';
import { createServer, dropTestDatabase } from '../../../appUtils';
import dotenv from 'dotenv';
import HttpStatus from 'http-status-codes';
import { shutDownSensor, createSensor } from './utils/sensorUtils';
import { fail } from 'assert';
import { ISensor } from '../../../model/v0/sensorModel';
import randomIpv6 from 'random-ipv6';
import {
    SENSOR_IP_FIELD,
    SENSOR_PORT_FIELD,
    SENSOR_NAME,
    SENSOR_QUERIES,
    API_KEY_HEADER,
} from '../../../model/v0/headers/sensorHeaders';
import { ALL_ROUTE, REGISTER_ROUTE } from '../../../routes/v0/paths/sensorPaths';
import { before, it, describe, after, beforeEach } from 'mocha';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Application } from 'express';

dotenv.config();

const REGISTER_SENSOR_PATH = REGISTER_ROUTE;
const ALL_SENSORS = ALL_ROUTE;

let createdSensors: Array<unknown> = [];

const SECRET_API_KEY = String(process.env.SECRET_API_KEY);
const MAX_PORT = 65_535;

const sensorIp = '2001:db8:3333:4444:5555:6666:7777:8888';
const sensorPort = 1926;
const sensorName = 'napoli-sensor';
const sensorQueries = ['25%-threshold', '50%-threshold', '75%-threshold', '100%-threshold'];

const sensorInfomration = {
    [SENSOR_IP_FIELD]: sensorIp,
    [SENSOR_PORT_FIELD]: sensorPort,
    [SENSOR_NAME]: sensorName,
    [SENSOR_QUERIES]: sensorQueries,
};

let app: Application;
let mongoServer: MongoMemoryServer;

describe('Registering a new Sensor using IPv6', () => {
    before(async () => {
        mongoServer = await MongoMemoryServer.create();
        app = createServer(mongoServer.getUri());
    });
    beforeEach(async () => {
        await shutDownSensor(app, sensorInfomration);
        for (const sensor of createdSensors) {
            await shutDownSensor(app, sensor);
        }
        createdSensors = [];
    });
    it('Registering a new Sensor using an IPv6 and using a PORT that are not used should be OK', async () => {
        createdSensors.push(sensorInfomration);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(sensorInfomration)
            .expect(HttpStatus.CREATED);
    });
    it('Registering a sensor with same IPv6 and different port should be ok', async () => {
        const other = createSensor(sensorIp, 1000, sensorName, sensorQueries);
        createdSensors.push(other);
        createdSensors.push(sensorInfomration);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(sensorInfomration)
            .expect(HttpStatus.CREATED);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(other)
            .expect(HttpStatus.CREATED);
    });
    it('Registering a sensor with different IPv6 and same port should be ok.', async () => {
        const other = createSensor(randomIpv6(), sensorPort, sensorName, sensorQueries);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(sensorInfomration)
            .expect(HttpStatus.CREATED);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(other)
            .expect(HttpStatus.CREATED);
        createdSensors.push(other);
        createdSensors.push(sensorInfomration);
    });
    it('Registering a sensor with different types of IPv6 should be ok.', async () => {
        const ips = Array<string>();
        ips.push(randomIpv6('{token}::1', { padded: true, token: { min: 0, max: 65535 } }));
        ips.push(randomIpv6('{token}:0:0:0:0:1:0:0', { compressed: true, token: { min: 0, max: 65535 } }));
        for (const ip of ips) {
            const sensor = createSensor(ip, sensorPort, sensorName, sensorQueries);
            await request(app)
                .post(REGISTER_SENSOR_PATH)
                .set(API_KEY_HEADER, SECRET_API_KEY)
                .send(sensor)
                .expect(HttpStatus.CREATED);
            createdSensors.push(sensor);
        }
    });
    it('Registering a sensor with a wrong IPv6 should raise an error.', async () => {
        const baseIP = '2c56:9a76:aee6:3552:855a:f757:3611:255a';
        const sensors = [];
        sensors.push(createSensor('fe80:2030:31:24', sensorPort, sensorName, sensorQueries));
        for (let i = 0; i < 8; i += 1) {
            const ip = baseIP.split(':');
            ip[i] = 'ABCG';
            const newIp = ip.join(':');
            sensors.push(createSensor(newIp, sensorPort, sensorName, sensorQueries));
        }
        for (const sensor of sensors) {
            await request(app)
                .post(REGISTER_SENSOR_PATH)
                .set(API_KEY_HEADER, SECRET_API_KEY)
                .send(sensor)
                .expect(HttpStatus.NOT_ACCEPTABLE);
        }
    });
    it('Registering a sensor with a wrong PORT value should return an error', async () => {
        const sensors = [];
        sensors.push(createSensor(sensorIp, MAX_PORT + 1, sensorName, sensorQueries));
        sensors.push(createSensor(sensorIp, -1, sensorName, sensorQueries));
        for (const sensor of sensors) {
            await request(app)
                .post(REGISTER_SENSOR_PATH)
                .set(API_KEY_HEADER, SECRET_API_KEY)
                .send(sensor)
                .expect(HttpStatus.NOT_ACCEPTABLE);
        }
    });
    it('After registering a new sensor It should be possible to see It saved.', async () => {
        createdSensors.push(sensorInfomration);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(sensorInfomration)
            .expect(HttpStatus.CREATED);
        await request(app)
            .get(ALL_SENSORS)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .expect((res) => {
                const sensors: Array<ISensor> = res.body['sensors'];
                const saved = sensors.find((sensor) => sensor.ip == sensorIp && sensor.port == sensorPort);
                if (!saved) {
                    fail('The input sensor is not saved.');
                }
            });
    });
    it('Registering a sensor with same Ip and same Port of another sensor should return a conflict', async () => {
        createdSensors.push(sensorInfomration);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(sensorInfomration)
            .expect(HttpStatus.CREATED);
        await request(app)
            .post(REGISTER_SENSOR_PATH)
            .set(API_KEY_HEADER, SECRET_API_KEY)
            .send(sensorInfomration)
            .expect(HttpStatus.CONFLICT);
    });
    after(async () => {
        await dropTestDatabase(mongoServer.getUri());
        await mongoServer.stop();
    });
});
