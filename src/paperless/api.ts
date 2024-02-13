import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { logger } from "../logger";
import { setEnv } from "../utils";

setEnv();

export const api = axios.create({
    baseURL: process.env.PAPERLESS_BASE_URL,
    headers: {
        Authorization: `Token ${process.env.PAPERLESS_API_KEY}`,
    },
});

api.interceptors.request.use((request) => {
    let isRelative = false;
    try {
        new URL(request?.url ?? "");
    } catch (error) {
        isRelative = true;
    }
    if (isRelative && request.baseURL && request.url) {
        if (request.url.endsWith("/") === false) {
            request.url = request.url + "/";
        }
        request.url = request.url;
    }
    return request;
});
