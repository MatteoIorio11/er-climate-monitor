import request from 'supertest';
import { createTestServer, dropTestDatabase } from '../../../appUtils';
import { describe, it, afterEach } from 'mocha';
import { fail, ok } from 'node:assert';
import HttpStatus from 'http-status-codes';
import { USER_EMAIL_FIELD, USER_PASSWORD_FIELD, API_KEY_FIELD } from '../../../models/v0/headers/userHeaders';
import { Application } from 'express';
import { createBodyUser, deleteAdmin, deleteUser } from './utils/userUtils';
import {
    REGISTER_ADMIN_ROUTE,
    REGISTER_USER_ROUTE,
    DELETE_ADMIN_ROUTE,
    DELETE_USER_ROUTE,
    LOGIN_ADMIN_ROUTE,
    LOGIN_USER_ROUTE,
} from './routes/globalRoutes.v0';
import dotenv from 'dotenv';
import { REGISTER, LOGIN, DELETE } from '../../../controllers/v0/utils/userActions';

dotenv.config();

const email = 'testemail10@gmail.com';
const password = 'AVeryStrongPassword1010';
const api_key = process.env.SECRET_API_KEY || '';

const userInformation = {
    [USER_EMAIL_FIELD]: email,
    [USER_PASSWORD_FIELD]: password,
};

const adminInformation = {
    [USER_EMAIL_FIELD]: email,
    [USER_PASSWORD_FIELD]: password,
    [API_KEY_FIELD]: api_key,
};

const maliciousEmails: Array<String> = [
    '{"$ne": null}',
    'notanemail`DROP DATABASE *`@gmail.com',
    '{"$gt": ""}',
    '{"$regex": ".*", "$options": "i"}',
];

const app: Application = createTestServer();

describe('User Authentication', () => {
    beforeEach(async () => {
        await deleteUser(app, userInformation);
        await deleteAdmin(app, adminInformation);
    });
    it('should return OK if the email does not exists inside the Database', async () => {
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(createBodyUser(REGISTER, userInformation))
            .expect(HttpStatus.CREATED)
            .expect((response) => {
                const responseEmail = response.body[USER_EMAIL_FIELD];
                if (responseEmail !== email) {
                    fail();
                }
            });
    });
    it('should return an error if I try to create a new user with an email already registered', async () => {
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(createBodyUser(REGISTER, userInformation))
            .expect(HttpStatus.CREATED);
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(createBodyUser(REGISTER, userInformation))
            .expect(HttpStatus.CONFLICT);
    });
    it('Should return an error if the input email is not well formatted during the registration, login and delete even if the user is not registered', async () => {
        for (const maliciousEmail in maliciousEmails) {
            const badInformation = {
                [USER_EMAIL_FIELD]: maliciousEmail,
                [USER_PASSWORD_FIELD]: password,
            };
            await request(app)
                .post(REGISTER_USER_ROUTE)
                .send(createBodyUser(REGISTER, badInformation))
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .post(LOGIN_USER_ROUTE)
                .send(createBodyUser(LOGIN, badInformation))
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .delete(DELETE_USER_ROUTE)
                .send(createBodyUser(DELETE, badInformation))
                .expect(HttpStatus.UNAUTHORIZED);
        }
    });
    it('Should return an error if the input email is not well formatted during the registration, login and delete of an Admin, even if the user is not registered', async () => {
        for (const maliciousEmail in maliciousEmails) {
            const badInformation = {
                [USER_EMAIL_FIELD]: maliciousEmail,
                [USER_PASSWORD_FIELD]: password,
                [API_KEY_FIELD]: api_key,
            };
            await request(app)
                .post(REGISTER_ADMIN_ROUTE)
                .send(createBodyUser(REGISTER, badInformation))
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .post(LOGIN_ADMIN_ROUTE)
                .send(createBodyUser(LOGIN, badInformation))
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .delete(DELETE_ADMIN_ROUTE)
                .send(createBodyUser(DELETE, badInformation))
                .expect(HttpStatus.UNAUTHORIZED);
        }
    });
    it('should return OK if I register an Admin using the correct API key and using an email that does not exist', async () => {
        await request(app)
            .post(REGISTER_ADMIN_ROUTE)
            .send(createBodyUser(REGISTER, adminInformation))
            .expect(HttpStatus.CREATED)
            .expect((response) => {
                const responseEmail = response.body[USER_EMAIL_FIELD];
                if (responseEmail !== email) {
                    fail();
                }
            });
    });
    it('Should return and error if I try to create a new Admin without speciifying the API key', async () => {
        await request(app)
            .post(REGISTER_ADMIN_ROUTE)
            .send(createBodyUser(REGISTER, userInformation))
            .expect(HttpStatus.UNAUTHORIZED);
    });
    it('After user registration, It should be possible to use the same credentials for the login', async () => {
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(createBodyUser(REGISTER, userInformation))
            .expect(HttpStatus.CREATED)
            .expect((response) => {
                const responseEmail = response.body[USER_EMAIL_FIELD];
                if (responseEmail !== email) {
                    fail();
                }
            });
        await request(app)
            .post(LOGIN_USER_ROUTE)
            .send(createBodyUser(LOGIN, userInformation))
            .expect(HttpStatus.OK)
            .expect((response) => {
                const responseEmail = response.body[USER_EMAIL_FIELD];
                if (responseEmail !== email) {
                    fail();
                }
            });
    });
    it('After admin registration, It should be possible to use the same credentials for the login', async () => {
        await request(app)
            .post(REGISTER_ADMIN_ROUTE)
            .send(createBodyUser(REGISTER, adminInformation))
            .expect(HttpStatus.CREATED)
            .expect((response) => {
                const responseEmail = response.body[USER_EMAIL_FIELD];
                if (responseEmail !== email) {
                    fail();
                }
            });
        await request(app).post(LOGIN_ADMIN_ROUTE).send(createBodyUser(LOGIN, adminInformation)).expect(HttpStatus.OK);
    });
    after(async () => {
        await dropTestDatabase();
    })
});