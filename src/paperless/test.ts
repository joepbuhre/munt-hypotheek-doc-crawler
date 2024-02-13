import { logger } from "../logger";
import { createCorrespondent } from "./correspondents";
import { createDocumentType } from "./document_types";
import { postDocument } from "./documents";

const generateRandomString = (length: number) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

const testUploadFile = () => {
    // Create random filelet content = '';
    let content: string = "";
    for (let i = 0; i < 30; i++) {
        content += `Line ${i + 1}: ${generateRandomString(50)}\n`;
    }
    let file = new Blob([content], { type: "text/plain" });

    postDocument(file, {
        title: "Test upload file",
    })
        .then((res) => {
            logger.info(res);
        })
        .catch((err) => {
            logger.error(err);
        });
};

(() => {
    logger.info("Starting paperless SDK");

    // testUploadFile();

    // getCorrespondents().then((res) => {
    //     logger.debug(res, "Got the following correspondents")
    // }).catch((err) => {
    //     logger.error(err)
    // })

    // createCorrespondent({
    //     name: "Test4",
    // })
    //     .then((res) => {
    //         logger.info(res, "Created correspondent");
    //     })
    //     .catch((err) => {
    //         logger.error(err);
    //     });

    createDocumentType({
        name: "TestDocType3",
    })
        .then((res) => {
            logger.info(res, "Created doctype");
        })
        .catch((err) => {
            logger.error(err);
        });
})();
