import axios from "axios";
import { logger } from "./logger";

export const notify = async () => {
    let body = process.env?.NOTIFY_BODY ?? {};
    await Promise.all((process.env?.NOTIFY_WEBHOOKS?.split(",") ?? []).map((url: string) => axios.post(url, body)));
};
