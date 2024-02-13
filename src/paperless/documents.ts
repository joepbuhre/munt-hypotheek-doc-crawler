import { logger } from "../logger";
import { convertToFormData } from "../utils";
import { api } from "./api";
import { Correspondent } from "./correspondents";

interface PostDocumentResponse {
    task_id: string;
}

export interface PostDocumentParams {
    title?: string;
    created?: string;
    correspondent?: number;
    document_type?: number;
    storage_path?: string;
    tags?: number[]; // Array of tag IDs
    archive_serial_number?: string;
    owner?: string | null;
}
const defaultParams: PostDocumentParams = {
    owner: null,
};

interface searchDocumentParams {
    correspondent__id: number;
    title__iexact: string;
}

export const documentExists = (params: searchDocumentParams): Promise<boolean> =>
    new Promise((resolve, reject) => {
        api.get<{ count: number }>("documents", {
            params: params,
        })
            .then((res) => {
                resolve(res.data.count > 0);
            })
            .catch((err) => {
                logger.error(err.response.data);
                reject(false);
            });
    });

// Function to make a POST request to /documents/post_document with the provided parameters
export const postDocument = (file: Blob, params: PostDocumentParams): Promise<PostDocumentResponse> =>
    new Promise((resolve, reject) => {
        // Build multipart form data object here
        const paramsWithDefaults: PostDocumentParams = {
            ...defaultParams,
            ...params,
        };
        const form = convertToFormData(paramsWithDefaults);
        form.append("document", file);

        api.post<PostDocumentResponse>(`documents/post_document`, form)
            .then((response) => resolve(response.data))
            .catch((error) => {
                logger.error(error.response.data);
                reject(`Failed to post document: ${error.message}`);
            });
    });
