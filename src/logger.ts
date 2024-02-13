// logger.js
import pino, { Logger } from "pino";

// Create a logging instance
export const logger = pino({
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
