import request from "supertest"
import createServer from "../..";
import { describe, it, afterEach } from "mocha";
import HttpStatus from "http-status-codes";
import { USER_EMAIL_HEADER, USER_PASSWORD_HEADER } from "../../controllers/userController";
import { Application } from "express";
import { deleteAdmin, deleteUser } from "./utils/userUtils";

const email = "testemail1@gmail.com";
const password = "AVeryStrongPassword1010";
const api_key = process.env.SECRET_API_KEY || "";
const API_KEY_HEADER = String(process.env.API_KEY_HEADER)

const REGISTER_USER_ROUTE = "/user/register";
const REGISTER_ADMIN_ROUTE = "/user/admin/register";
const LOGIN_USER_ROUTE = "/user/login";
const LOGIN_ADMIN_ROUTE = "/user/admin/login";
const DELETE_USER_ROUTE = "/user/delete";
const DELETE_ADMIN_ROUTE = "/user/admin/delete";


const userInformation = {
    [USER_EMAIL_HEADER]: email,
    [USER_PASSWORD_HEADER]: password,
};

const adminInformation = {
    [USER_EMAIL_HEADER]: email,
    [USER_PASSWORD_HEADER]: password,
    [API_KEY_HEADER]: api_key
};

const maliciousEmails: Array<String> = ['{"$ne": null}', "notanemail`DROP DATABASE *`@gmail.com", '{"$gt": ""}', '{"$regex": ".*", "$options": "i"}']

const app: Application = createServer();

describe("User Authentication", () => {
    before(async () => {
        await deleteUser(app, userInformation);
        await deleteAdmin(app, adminInformation);
    })
    it("should return OK if the email does not exists inside the Database", async () => {
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(userInformation)
            .expect(HttpStatus.CREATED)
            .expect(USER_EMAIL_HEADER.toLowerCase(), email)
    });
    it("should return an error if I try to create a new user with an email already registered", async () => {
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(userInformation)
            .expect(HttpStatus.CREATED);
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(userInformation)
            .expect(HttpStatus.CONFLICT);
    });
    it("Should return an error if the input email is not well formatted during the registration, login and delete even if the user is not registered", async () => {
        for (const maliciousEmail in maliciousEmails) {
            const badInformation = {
                [USER_EMAIL_HEADER]: maliciousEmail,
                [USER_PASSWORD_HEADER]: password
            };
            await request(app)
                .post(REGISTER_USER_ROUTE)
                .send(badInformation)
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .post(LOGIN_USER_ROUTE)
                .send(badInformation)
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .delete(DELETE_USER_ROUTE)
                .send(badInformation)
                .expect(HttpStatus.NOT_ACCEPTABLE);
        }
    });
    it("Should return an error if the input email is not well formatted during the registration, login and delete of an Admin, even if the user is not registered", async () => {
        for (const maliciousEmail in maliciousEmails) {
            const badInformation = {
                [USER_EMAIL_HEADER]: maliciousEmail,
                [USER_PASSWORD_HEADER]: password,
                [API_KEY_HEADER]: api_key
            };
            await request(app)
                .post(REGISTER_ADMIN_ROUTE)
                .send(badInformation)
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .post(LOGIN_ADMIN_ROUTE )
                .send(badInformation)
                .expect(HttpStatus.NOT_ACCEPTABLE);
            await request(app)
                .delete(DELETE_ADMIN_ROUTE)
                .send(badInformation)
                .expect(HttpStatus.NOT_ACCEPTABLE);
        }
    });
    it("should return OK if I register an Admin using the correct API key and using an email that does not exist", async () => {
        await request(app)
            .post(REGISTER_ADMIN_ROUTE)
            .send(adminInformation)
            .expect(HttpStatus.CREATED)
            .expect(USER_EMAIL_HEADER.toLowerCase(), email);
    });
    it("Should return and error if I try to create a new Admin without speciifying the API key", async () => {
        await request(app)
            .post(REGISTER_ADMIN_ROUTE) 
            .send(userInformation)
            .expect(HttpStatus.UNAUTHORIZED);
    });
    it("After user registration, It should be possible to use the same credentials for the login", async () => {
        await request(app)
            .post(REGISTER_USER_ROUTE)
            .send(userInformation)
            .expect(HttpStatus.CREATED)
            .expect(USER_EMAIL_HEADER.toLowerCase(), email);
        await request(app)
            .post(LOGIN_USER_ROUTE)
            .send(userInformation)
            .expect(HttpStatus.OK)
            .expect(USER_EMAIL_HEADER.toLowerCase(), email);
    });
    it("After admin registration, It should be possible to use the same credentials for the login", async () => {
        await request(app)
            .post(REGISTER_ADMIN_ROUTE)
            .send(adminInformation)
            .expect(HttpStatus.CREATED)
            .expect(USER_EMAIL_HEADER.toLowerCase(), email);
        await request(app)
            .post(LOGIN_ADMIN_ROUTE)
            .send(adminInformation)
            .expect(HttpStatus.OK);
    });
    afterEach(async () => {
        await deleteUser(app, userInformation);
        await deleteAdmin(app, adminInformation);
    });
});