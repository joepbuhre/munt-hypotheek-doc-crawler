// logger.js
import pino, { Logger } from "pino";
import { Page } from "puppeteer";

interface ExtendedLogger extends Logger {
    page?: Page;
}

// Create a logging instance
export const logger: ExtendedLogger = pino({
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    level: process.env.LOG_LEVEL || "debug",
    name: process.env.LOGGER_NAME,
    redact: {
        paths: ["email", "password", "token"],
    },
    // https://github.com/pinojs/pino/issues/674
    timestamp: pino.stdTimeFunctions.isoTime,
});

const originalFatal = logger.fatal;
logger.fatal = function (...args: any[]): never {
    // @ts-ignore
    originalFatal.apply(this, args);
    process.exit(1);
};

const originalDebug = logger.debug;
logger.debug = function (...args: any[]) {
    // @ts-ignore
    originalDebug.apply(this, args);
    let name = args.find((el) => typeof el === "string");
    if (logger.page && process.env?.DEBUG_SCREENSHOT !== undefined) {
        logger.page
            .screenshot({
                path: `shared/${name}.png`,
            })
            .catch((err: any) => logger.error("Couldn't make screenshot"));
    }
};
