import { config } from "dotenv";
import { logger } from "./logger";
import crypto from "crypto";

const envNotExists = (key: string) => {
    return key in process.env === false;
};

export const generateRandomTextFile = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomText = "";
    const lines = 5; // Number of lines

    for (let j = 0; j < lines; j++) {
        const textLength = Math.floor(Math.random() * 100) + 1; // Random length between 1 and 100
        let line = "";
        for (let i = 0; i < textLength; i++) {
            line += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        randomText += line + "\n"; // Add a new line
    }

    // Convert the string to an ArrayBuffer
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(randomText);
    return encodedText.buffer;
};

export const setEnv = () => {
    config();

    ["EMAIL", "SECRET_KEY", "PAPERLESS_API_KEY", "PAPERLESS_BASE_URL"].forEach((env) => {
        if (envNotExists(env)) {
            logger.fatal(`Environment variable [${env}] not found`);
        }
    });
};

export const decrypt = (encryptedText: string) => {
    let e = new Encrypter(process.env.SECRET_KEY ?? "");
    return e.decrypt(encryptedText);
};

export const decryptPass = (): string => {
    return decrypt(process.env?.PASSWORD ?? "");
};

class Encrypter {
    private algorithm: string;
    private key: Buffer;
    constructor(encryptionKey: string) {
        this.algorithm = "aes-192-cbc";
        this.key = crypto.scryptSync(encryptionKey, "salt", 24);
    }

    encrypt(clearText: string) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        const encrypted = cipher.update(clearText, "utf8", "hex");
        return [encrypted + cipher.final("hex"), Buffer.from(iv).toString("hex")].join("|");
    }

    decrypt(encryptedText: string) {
        const [encrypted, iv] = encryptedText.split("|");
        if (!iv) throw new Error("IV not found");
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(iv, "hex"));
        return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
    }
}

export const init = async () => {
    config();
    if (process.env.SECRET_KEY === undefined) {
        console.log(
            `Your secret key is \x1b[31;4m\x1b[1m${crypto
                .randomBytes(32)
                .toString("hex")}\x1b[0m. Please store this in the .env file under SECRET_KEY`
        );
        process.exit();
    }
    if (process.env.SECRET_KEY && process.env.PASSWORD_PLAIN) {
        const e = new Encrypter(process.env.SECRET_KEY);
        let password_enc = e.encrypt(process.env.PASSWORD_PLAIN);

        console.log(`\nYour encrypted password is '${password_enc}'\n\r Please store this in the .env file under PASSWORD.`);

        logger.info("Please start application without env variable [PASSWORD_PLAIN]");
        process.exit();
    }
    if (process.env.SECRET_KEY === undefined || process.env.PASSWORD === undefined) {
        logger.fatal("Either SECRET_KEY or PASSWORD is undefined please check");
    }
};

export const convertToFormData = (data: any) => {
    const formData = new FormData();

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            const value = data[key];
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    formData.append(`${key}`, item);
                });
            } else {
                formData.append(key, value);
            }
        }
    }

    return formData;
};
