import { logger } from "../logger";
import { api } from "./api";

export interface DocumentType {
    name: string;
    match?: string;
    matching_algorithm?: string;
    is_insensitive?: boolean;
    owner?: string | null;
    set_permissions?: { [key: string]: string };
    id?: number;
}

const defaultParams: DocumentType = {
    name: "",
    match: "",
    is_insensitive: false,
    owner: null,
};

// Function to make a GET request to /document_types
export const getAllDocumentTypes = (): Promise<DocumentType[]> =>
    new Promise((resolve, reject) => {
        api.get<{ results: DocumentType[] }>(`document_types`)
            .then((response) => resolve(response.data.results))
            .catch((error) => reject(`Failed to fetch document types: ${error.message}`));
    });

// Function to make a POST request to /document_types with the provided body
export const createDocumentType = (documentTypeData: DocumentType): Promise<DocumentType> =>
    new Promise(async (resolve, reject) => {
        // First check if doctype exists (Make this more efficient later)
        let doctype = await getAllDocumentTypes()
            .then((docTypes) => {
                return docTypes.find((el) => el.name === documentTypeData.name);
            })
            .catch((err: any) => {
                logger.error(err, "Something happend while fetching documenttypes");
                return undefined;
            });
        if (doctype !== undefined) {
            logger.debug("returning existing document_type");
            return resolve(doctype);
        } else {
            // Set defaults
            doctype = {
                ...defaultParams,
                ...documentTypeData,
            };
            // logger.debug(doctype, "We need to create a document type");
            api.post<DocumentType>(`document_types`, doctype)
                .then((response) => resolve(response.data))
                .catch((error) => {
                    logger.debug(error.response.data);
                    reject(`Failed to create document type`);
                });
        }
    });
