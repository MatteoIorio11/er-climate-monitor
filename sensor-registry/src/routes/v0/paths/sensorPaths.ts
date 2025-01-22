const BASE_SENSOR_PATH_V0 = '/v0/sensor';

const REGISTER_PATH = '/register';
const REGISTER_ROUTE = BASE_SENSOR_PATH_V0 + REGISTER_PATH;

const ALL_PATH = '/all';
const ALL_ROUTE = BASE_SENSOR_PATH_V0 + ALL_PATH;

const ALL_INFO_PATH = '/infos';
const ALL_INFO_ROUTE = BASE_SENSOR_PATH_V0 + ALL_PATH + ALL_INFO_PATH;

const SHUT_DOWN_PATH = '/shutdown';
const SHUT_DOWN_ROUTE = BASE_SENSOR_PATH_V0 + SHUT_DOWN_PATH;

const TYPE_PATH = '/type';

export {
    BASE_SENSOR_PATH_V0,
    REGISTER_PATH,
    ALL_PATH,
    SHUT_DOWN_PATH,
    REGISTER_ROUTE,
    ALL_ROUTE,
    SHUT_DOWN_ROUTE,
    ALL_INFO_ROUTE,
    TYPE_PATH,
};