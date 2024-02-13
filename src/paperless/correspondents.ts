import { logger } from "../logger";
import { api } from "./api";

export interface Correspondent {
    name: string;
    match?: string;
    is_insensitive?: boolean;
    owner?: string | null;
    set_permissions?: { [key: string]: string };
    id?: number;
}
const defaultParams: Correspondent = {
    name: "",
    owner: null,
};

// Function to make a GET request to /correspondents
const getAllCorrespondents = (): Promise<Correspondent[]> =>
    new Promise((resolve, reject) => {
        api.get<{ results: Correspondent[] }>(`correspondents`)
            .then((response) => resolve(response.data.results))
            .catch((error) => reject(`Failed to fetch correspondents: ${error}`));
    });

// Function to make a POST request to /correspondents with the provided body
export const createCorrespondent = (correspondentData: Correspondent): Promise<Correspondent> =>
    new Promise(async (resolve, reject) => {
        // First check if correspondent exists (Make this more efficient later)
        let corr = await getAllCorrespondents()
            .then((corrArr) => {
                return corrArr.find((el) => el.name === correspondentData.name);
            })
            .catch((err) => {
                logger.error(err, "Something happend while fetching correspondents");
                return undefined;
            });
        if (corr !== undefined) {
            logger.debug("returning already created correspondent");
            return resolve(corr);
        } else {
            logger.debug("We need to create correspondent here");
            api.post<Correspondent>(`correspondents`, {
                ...defaultParams,
                ...correspondentData,
            })
                .then((response) => resolve(response.data))
                .catch((error) => {
                    logger.debug(error.response.data);
                    reject(`Failed to create correspondent`);
                });
        }
    });
