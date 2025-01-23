import axios, { AxiosError, AxiosHeaders, AxiosResponse, HttpStatusCode } from 'axios';
import { AbstractHttpClient, HttpClient } from '../httpClient';
import { API_KEY_HEADER } from '../../../../../../models/v0/sensor/headers/sensorHeaders';
import { BasicHttpResponse, HttpResponse } from '../httpResponse';
function axiosCheckServerError(error: AxiosError<unknown, any>): boolean {
    return error.status !== undefined && error.status < 500;
}

class AxiosHttpClient implements HttpClient {
    constructor() {
        axios.defaults.headers.common[API_KEY_HEADER.toLowerCase()] = '';
    }
    private makeAxiosHeaders(headers: Record<string, string>): AxiosHeaders {
        const axiosHeaders = new AxiosHeaders();
        if (headers) {
            Object.keys(headers).forEach((key) => {
                axiosHeaders[String(key)] = headers[key];
            });
        }
        return axiosHeaders;
    }

    private setSecret(headers: Record<string, string>) {
        const axiosHeaders = this.makeAxiosHeaders(headers);
        if (axiosHeaders.has(API_KEY_HEADER.toLowerCase())) {
            axios.defaults.headers[API_KEY_HEADER.toLowerCase()] = axiosHeaders[API_KEY_HEADER.toLowerCase()];
        }
    }

    private removeSecret() {
        axios.defaults.headers[API_KEY_HEADER.toLowerCase()] = '';
    }

    private fromAxiosHeadersToRecord(axiosHeaders: any): Record<string, string> {
        const headers: Record<string, string> = {};
        Object.keys(axiosHeaders).forEach((key) => (headers[key] = axiosHeaders[key]));
        return headers;
    }

    private async sendRequest(request: () => Promise<AxiosResponse>): Promise<HttpResponse> {
        try {
            const response = await request();
            return new BasicHttpResponse(
                response.status,
                this.fromAxiosHeadersToRecord(response.headers),
                response.data,
            );
        } catch (error) {
            if (error instanceof AxiosError && error.response !== undefined) {
                return new BasicHttpResponse(
                    error.response.status,
                    this.fromAxiosHeadersToRecord(error.response.headers),
                    error.response.data,
                );
            } else if (error instanceof Error) {
                return new BasicHttpResponse(HttpStatusCode.BadRequest, {}, Object(error.message));
            }
            return new BasicHttpResponse(HttpStatusCode.BadRequest);
        } finally {
        }
    }

    httpGet(endpoint: string, headers: Record<string, string>): Promise<HttpResponse> {
        return this.sendRequest(() => axios.get(endpoint));
    }
    httpPost(endpoint: string, headers: Record<string, string>, data: object): Promise<HttpResponse> {
        return this.sendRequest(() => axios.post(endpoint, data, headers));
    }

    httpPut(endpoint: string, headers: Record<string, string>, data: object): Promise<HttpResponse> {
        return this.sendRequest(() => axios.put(endpoint, data, { headers }));
    }

    httpDelete(endpoint: string, headers: Record<string, string>): Promise<HttpResponse> {
        return this.sendRequest(() => axios.delete(endpoint, { headers }));
    }
}

class AxiosService extends AbstractHttpClient<AxiosHttpClient> {
    private axiosClient: AxiosHttpClient = new AxiosHttpClient();

    constructor() {
        const axiosC = new AxiosHttpClient();
        super(axiosC);
        this.axiosClient = axiosC;
    }
}

export { AxiosService, axiosCheckServerError };
