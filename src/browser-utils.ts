import { Page } from "puppeteer";
import { logger } from "./logger";
import { decryptPass, generateRandomTextFile } from "./utils";
import { writeFileSync, readFileSync } from "fs";
import { createVerificationServer } from "./verificationcode";
import { notify } from "./notify";

export interface Document {
    date: string;
    name: string;
    documentType: string;
    url: string;
}

export const sleep = (seconds: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
};

export const fetchVerificationCode = (timeoutSeconds: number) => {
    let expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + timeoutSeconds);

    return new Promise(async (resolve: (value: string) => void, reject) => {
        while (true) {
            logger.info("Waiting to read verification code...");
            let verificationcode: string;
            try {
                verificationcode = readFileSync("verificationcode").toString();
            } catch (error) {
                verificationcode = "";
            }
            logger.debug(`Got code: [${verificationcode}]`);
            await sleep(1);
            if (verificationcode.length > 1) {
                return resolve(verificationcode);
            }
            if (expirationDate < new Date()) {
                return reject(false);
            }
        }
    });
};

export const setCookies = async (page: Page) => {
    // Fetch cookies and save them so we don't log in every time
    let newCookies = await page.cookies();
    writeFileSync("cookies.json", JSON.stringify(newCookies));
    return newCookies;
};

export const login = async (page: Page) => {
    // Accept cookies
    await page.click(".cc-compliance a").catch((err) => {});

    // // Log into and fetch token
    await page.type("form input[name='UserName']", process.env.EMAIL ?? "");
    await page.type("form input[name='Password']", decryptPass());

    await page.click("form button");

    // Spawn browser
    const server = createVerificationServer();

    await notify();

    // Wait for verification
    let code: string = await fetchVerificationCode(120)
        .catch((err) => {
            logger.fatal("No verification code has been found");
            return ""; // ts fix
        })
        .finally(() => {
            writeFileSync("verificationcode", "");
            server.close();
        });

    // // Login and submit
    await page.type("form input[name='Token']", code);
    await page.click("form button");
    await page.waitForNavigation({
        waitUntil: "networkidle0",
    });
    await setCookies(page);
};

export async function downloadFile(
    doc: Document,
    cookies: string
): Promise<{
    document: Document;
    buff: ArrayBuffer;
    mime: string;
}> {
    if (process.env.FAKE_DOWNLOAD !== undefined) {
        // If fake download is true because you don't want to download everything (Slow internet?)
        return {
            document: doc,
            buff: generateRandomTextFile(),
            mime: "plain/text",
        };
    } else {
        const response = await fetch(doc.url, {
            headers: {
                Cookie: cookies,
            },
        });
        if (!response.ok) {
            return Promise.reject(`Failed to download file from ${doc.url}`);
        }
        return Promise.resolve({
            document: doc,
            mime: response.headers.get("Content-Type") ?? "plain",
            buff: await response.arrayBuffer(),
        });
    }
}
