import { createServer } from "http";
import { readFile, writeFile } from "fs";
import { logger } from "./logger";

export const createVerificationServer = () => {
    const server = createServer((req, res) => {
        if (req.method === "GET") {
            // Serve the HTML form
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(`
                    <form id="numberForm" action="/save" method="post">
                        <label for="numberInput">Enter a 6-digit number:</label><br>
                        <input type="text" id="numberInput" name="number" pattern="[0-9]{6}" required><br><br>
                        <input type="submit" value="Save Number">
                    </form>`);
        } else if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });

            req.on("end", () => {
                const number = body.split("=")[1];
                logger.debug(number);
                if (number && /^\d{6}$/.test(number)) {
                    writeFile("verificationcode", number, (err) => {
                        if (err) {
                            console.error(err);
                            res.writeHead(500);
                            res.end("Error saving number");
                        } else {
                            res.writeHead(200);
                            res.end("Number saved successfully");
                        }
                    });
                } else {
                    res.writeHead(400);
                    res.end("Invalid number format");
                }
            });
        } else {
            res.writeHead(404);
            res.end("Not found");
        }
    });

    server.listen(3000, () => {
        console.log(`Server is running on port 3000`);
    });

    return server;
};
