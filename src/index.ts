import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { logger } from "./logger";
import { readFileSync, writeFileSync } from "node:fs";
import { createCorrespondent, createDocumentType, postDocument } from "./paperless";
import { init, setEnv } from "./utils";
import { downloadFile, login, setCookies, sleep } from "./browser-utils";
import { Document } from "./browser-utils";
import { PostDocumentParams, documentExists } from "./paperless/documents";
import { Page } from "puppeteer";
import { Logger } from "pino";

(async () => {
    puppeteer.use(StealthPlugin());
    await init();
    setEnv();

    const browser = await puppeteer.launch({
        headless: process.env?.NODE_ENV === "production" ? "new" : false,
        args: ["--no-sandbox"],
    });
    const page: Page = await browser.newPage();

    // Set logger here so we can use it everywhere
    logger.page = page;

    await page.setViewport({
        width: 1920,
        height: 1080,
    });
    logger.debug("Browser launched");

    // Set cookies
    let cookies: any;
    try {
        cookies = JSON.parse(readFileSync("shared/cookies.json").toString());
        await page.setCookie(...cookies);
        logger.debug("Cookies has been set");
    } catch (error) {
        logger.warn("Cookies path not found");
    }
    await page.goto("https://munt.mijnhypotheekonline.nl/Document");
    logger.debug("Tried to login");

    if (page.url() === "https://munt.mijnhypotheekonline.nl/Document") {
        logger.info("We are logged in, fetching documents");
    } else {
        await login(page);
    }

    // Waiting until we are loaded
    await page.waitForSelector("table#digitaldocuments tbody tr");
    logger.debug("Page loaded succesfully");

    // document.querySelectorAll("table#digitaldocuments tbody tr")
    let documents = await page.$$eval("table#digitaldocuments tbody tr", (el) =>
        el.map((row: HTMLTableRowElement): Document => {
            let dt: Date;
            const parts = row.querySelector("td:nth-child(1)")?.textContent?.trim().split("-");
            if (parts) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1; // Months are zero-based (0-11)
                const year = parseInt(parts[2], 10);
                dt = new Date(year, month, day);
            } else {
                dt = new Date();
            }
            return {
                date: dt.toISOString(),
                documentType: row.attributes.getNamedItem("data-document-type")?.value ?? "",
                name: (<HTMLAnchorElement>row.querySelector("td:nth-child(2) a.documentname")).textContent ?? "",
                url: (<HTMLAnchorElement>row.querySelector("td:nth-child(2) a.documentname")).href,
            };
        })
    );
    logger.debug(documents, "Fetched all documents:");

    // Set cookies
    let newCookies = await setCookies(page);
    logger.debug("Done with browser");
    await browser.close();
    // Convert cookies to a format suitable for fetch headers
    const cookieString: string = newCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

    // Array of promises to download all files
    const downloadPromises = (<Document[]>documents).map(async (doc) => {
        // Set base Doc params
        const { date, name, documentType, url } = doc;

        // Fetch necessary paperless attributes
        const DocumentTypeId = (await createDocumentType({ name: documentType })).id;
        const CorrespondentId = (await createCorrespondent({ name: "Munt Hypotheken" })).id;

        if (DocumentTypeId === undefined) {
            logger.fatal(`DocumentType [${documentType}] not found and / or could not be created`);
        }
        if (CorrespondentId === undefined) {
            logger.fatal("Correspondent [Munt Hypotheken] not found and / or could not be created");
            process.exit();
        }

        // Check if document exists, otherwise exit immediately
        if (
            (await documentExists({
                correspondent__id: CorrespondentId,
                title__iexact: name,
                created__day: new Date(date).getDate(),
                created__month: new Date(date).getMonth(),
                created__year: new Date(date).getFullYear(),
            })) === true
        ) {
            logger.info("Document already existed");
            return;
        }
        const document: false | Awaited<ReturnType<typeof downloadFile>> = await downloadFile(doc, cookieString).catch((err) => false);

        // Return a resolved promise
        // We know it is unsuccesfull. Handle this in the future
        if (document === false) {
            logger.error("No document found, exiting...");
            return;
        }

        const buff = Buffer.from(document.buff);

        // Create blob
        logger.info("Posting the file");
        let file = new Blob([buff], { type: document.mime });
        const postDocumentParams: PostDocumentParams = {
            title: name,
            correspondent: CorrespondentId,
            document_type: DocumentTypeId,
            created: date,
            owner: null,
        };
        if (process.env?.PAPERLESS_TAGS) {
            postDocumentParams["tags"] = process.env.PAPERLESS_TAGS.split(",").map((el) => parseInt(el));
        }
        await postDocument(file, postDocumentParams)
            .then((res) => {
                logger.info(`${name} saved successfully.`);
            })
            .catch((err) => {
                logger.error(err, "Something went horribly wrong, while posting document");
            });
    });

    // Use Promise.all to execute all download promises concurrently
    await Promise.all(downloadPromises)
        .then((responses) => {
            logger.info("All done");
        })
        .catch((error: any) => {
            logger.error(error, "Failed to download files:");
        });
})();
