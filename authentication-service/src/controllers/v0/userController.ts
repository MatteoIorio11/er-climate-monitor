import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import dotenv from 'dotenv';
import { login, register, deleteInputUser } from './utils/auth';
import { getInfosFromToken, tokenExpiration, verifyToken } from './utils/jwt';
import { isUserRoleAdmin } from './utils/userUtils';
import {
    USER_EMAIL_FIELD,
    USER_PASSWORD_FIELD,
    USER_JWT_TOKEN_EXPIRATION_FIELD,
    USER_JWT_TOKEN_FIELD,
    ADMIN_USER,
    NORMAL_USER,
    USER_ACTION_FIELD,
    USER_ROLE_FIELD,
    USER_TOKEN_HEADER,
    API_KEY_HEADER,
} from '../../models/v0/headers/userHeaders';
import { AUTHENTICATE, LOGIN, REGISTER } from './utils/userActions';
import Logger from 'js-logger';

Logger.useDefaults();

dotenv.config();

const secretKey = process.env.SECRET_API_KEY || '__';

function checkAction(tag: string, body: any, equalTo: string): boolean {
    return body[tag] === equalTo;
}

async function canBeDeleted(token: string, userEmail: string): Promise<boolean> {
    if (token === '' || userEmail === '') {
        return false;
    }
    try {
        return (await verifyToken(token)) && getInfosFromToken(token).email === userEmail;
    } catch (error) {
        return false;
    }
}

function isAdmin(data: any, key: string): boolean {
    if (key in data) {
        const API_KEY: string = data[key];
        return API_KEY === secretKey;
    }
    return false;
}

function fromBody<X>(body: any, key: string, defaultValue: X): X {
    return body && key in body ? body[key] : defaultValue;
}

const loginUser = async (request: Request, response: Response) => {
    const modelData = request.body;
    if (modelData && checkAction(USER_ACTION_FIELD, modelData, LOGIN)) {
        await login(
            fromBody<string>(modelData, USER_EMAIL_FIELD, ''),
            fromBody<string>(modelData, USER_PASSWORD_FIELD, ''),
            NORMAL_USER,
            response,
        );
    } else {
        response.status(HttpStatus.BAD_REQUEST).end();
    }
};

const loginAdmin = async (request: Request, response: Response) => {
    const modelData = request.body;
    Logger.info('Received a request for loggin an admin');
    if (modelData && checkAction(USER_ACTION_FIELD, modelData, LOGIN)) {
        if (
            isAdmin(request.headers, API_KEY_HEADER.toLowerCase()) &&
            (await isUserRoleAdmin(fromBody<string>(modelData, USER_EMAIL_FIELD, '')))
        ) {
            await login(
                fromBody<string>(modelData, USER_EMAIL_FIELD, ''),
                fromBody<string>(modelData, USER_PASSWORD_FIELD, ''),
                ADMIN_USER,
                response,
            );
        } else {
            response.status(HttpStatus.UNAUTHORIZED).end();
        }
    } else {
        response.end();
    }
};

const registerUser = async (request: Request, response: Response) => {
    const modelData = request.body;
    Logger.info('Received a request for registering a new User.');
    if (modelData && checkAction(USER_ACTION_FIELD, modelData, REGISTER)) {
        Logger.info('All the needed data has been sent, processing the user creation.');
        await register(
            fromBody<string>(modelData, USER_EMAIL_FIELD, ''),
            fromBody<string>(modelData, USER_PASSWORD_FIELD, ''),
            NORMAL_USER,
            response,
        );
    } else {
        response.status(HttpStatus.BAD_REQUEST).end();
    }
};

const registerAdmin = async (request: Request, response: Response) => {
    const modelData = request.body;
    Logger.info('Received a request for registering a new Admin');
    if (modelData && checkAction(USER_ACTION_FIELD, modelData, REGISTER)) {
        if (isAdmin(request.headers, API_KEY_HEADER.toLowerCase())) {
            await register(
                fromBody<string>(modelData, USER_EMAIL_FIELD, ''),
                fromBody<string>(modelData, USER_PASSWORD_FIELD, ''),
                ADMIN_USER,
                response,
            );
        } else {
            response.status(HttpStatus.UNAUTHORIZED).end();
        }
    } else {
        response.status(HttpStatus.BAD_REQUEST).end();
    }
};

const deleteUser = async (request: Request, response: Response) => {
    Logger.info('Received a request for deleting a user.');
    const userEmail = String(request.query[USER_EMAIL_FIELD]) || '';
    const jwtToken = String(request.headers[USER_TOKEN_HEADER]) || '';
    if (await canBeDeleted(jwtToken, userEmail)) {
        await deleteInputUser(userEmail, response);
    } else {
        response.status(HttpStatus.UNAUTHORIZED).end();
    }
};

const deleteAdmin = async (request: Request, response: Response) => {
    Logger.info('Received a request for deleting an admin');
    if (
        isAdmin(request.headers, API_KEY_HEADER.toLocaleLowerCase()) &&
        (await isUserRoleAdmin(String(request.query[USER_EMAIL_FIELD]) || ''))
    ) {
        const userEmail = String(request.query[USER_EMAIL_FIELD]) || '';
        const jwtToken = String(request.headers[USER_TOKEN_HEADER]) || '';
        if (await canBeDeleted(jwtToken, userEmail)) {
            await deleteInputUser(userEmail, response);
        }
    } else {
        response.status(HttpStatus.UNAUTHORIZED).end();
    }
};

const checkToken = async (request: Request, response: Response) => {
    const modelData = request.body;
    try {
        if (modelData && checkAction(USER_ACTION_FIELD, modelData, AUTHENTICATE)) {
            const jwtToken: string = fromBody<string>(modelData, USER_JWT_TOKEN_FIELD, '');
            const verified = await verifyToken(jwtToken);
            if (verified) {
                const tokenInfos = getInfosFromToken(jwtToken);
                response.status(HttpStatus.ACCEPTED).send({
                    [USER_JWT_TOKEN_EXPIRATION_FIELD]: tokenExpiration(jwtToken).getTime(),
                    [USER_EMAIL_FIELD]: tokenInfos.email,
                    [USER_ROLE_FIELD]: tokenInfos.role,
                });
            } else {
                response.status(HttpStatus.UNAUTHORIZED);
            }
        }
    } catch (error) {
        response.status(HttpStatus.BAD_REQUEST).send({ ERROR_TAG: error });
    } finally {
        response.end();
    }
};

export { registerUser, registerAdmin, loginUser, loginAdmin, deleteUser, deleteAdmin, checkToken };
