import puppeteer, { Page } from "puppeteer";
import { logger } from "./logger";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

interface Document {
    date: string;
    name: string;
    documentType: string;
    url: string;
}

const sleep = (seconds: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, seconds * 1000);
    });
};

const fetchVerificationCode = (timeoutSeconds: number) => {
    let expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + timeoutSeconds);

    return new Promise(async (resolve: (value: string) => void, reject) => {
        while (true) {
            logger.info("Waiting to read verification code...");
            let verificationcode: string = readFileSync("verificationcode").toString();
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

const login = async (page: Page) => {
    // Accept cookies
    await page.click(".cc-compliance a");

    // // Log into and fetch token
    await page.type("form input[name='UserName']", process.env.EMAIL ?? "");
    await page.type("form input[name='Password']", process.env?.PASSWORD ?? "");

    await page.click("form button");

    // Wait for verification
    let code: string = await fetchVerificationCode(60)
        .catch((err) => {
            logger.error("No verification code has been found");
            process.exit(-1);
        })
        .finally(() => {
            writeFileSync("verificationcode", "");
        });

    // // Login and submit
    await page.type("form input[name='Token']", code);
    await page.click("form button");
};

async function downloadFile(
    doc: Document,
    cookies: string
): Promise<{
    document: Document;
    buff: ArrayBuffer;
}> {
    const response = await fetch(doc.url, {
        headers: {
            Cookie: cookies,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to download file from ${doc.url}`);
    }
    return {
        document: doc,
        buff: await response.arrayBuffer(),
    };
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    // Set cookies
    let cookies: any = JSON.parse(readFileSync("cookies.json").toString());
    await page.setCookie(...cookies);

    await page.goto("https://munt.mijnhypotheekonline.nl/Document");

    if (page.url() === "https://munt.mijnhypotheekonline.nl/Document") {
        logger.info("We are logged in, fetching documents");
    } else {
        await login(page);
    }

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
                name:
                    (<HTMLAnchorElement>row.querySelector("td:nth-child(2) a.documentname"))
                        .textContent ?? "",
                url: (<HTMLAnchorElement>row.querySelector("td:nth-child(2) a.documentname")).href,
            };
        })
    );
    logger.debug(documents);

    // Fetch cookies and save them so we don't log in every time
    let newCookies = await page.cookies();
    writeFileSync("cookies.json", JSON.stringify(cookies));

    logger.debug("Done with browser");
    await browser.close();

    // Convert cookies to a format suitable for fetch headers
    const cookieString: string = newCookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

    // Array of promises to download all files
    const downloadPromises = (<Document[]>documents).map((doc) => downloadFile(doc, cookieString));

    // Use Promise.all to execute all download promises concurrently
    Promise.all(downloadPromises)
        .then((responses) => {
            responses.forEach((doc) => {
                const filename = `${doc.document.name}.pdf`; // You can modify the filename as needed
                const filePath = path.join(__dirname, "../out", filename); // Create file path
                const buff = Buffer.from(doc.buff);
                writeFileSync(filePath, buff); // Write blob to file
                logger.info(`${filename} saved successfully.`);
            });
        })
        .catch((error) => {
            logger.error("Failed to download files:", error);
        });
})();
