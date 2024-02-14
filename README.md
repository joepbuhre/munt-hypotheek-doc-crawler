# Munt Hypotheek Document Crawler

Run application with:

```bash
docker run --env-file .env  --rm -p "3000:3000" ghcr.io/joepbuhre/munt-hypotheek-doc-crawler
```

## Overview

This Node.js application integrates with Puppeteer for web scraping and document processing tasks. It fetches documents from a specified URL, processes them, and uploads them to a Paperless system. The application relies on various environment variables for configuration and interaction with external services.

## Usage

1. Ensure all required environment variables are properly set.
2. Run the application using Node.js.
3. The application will launch a Puppeteer-controlled browser to navigate to the specified URL and fetch documents.
4. Documents will be processed and uploaded to the Paperless system.
5. Logging and error handling are implemented using the provided logger.

## Dependencies

This application requires the following dependencies:

-   **Puppeteer**: For controlling headless Chrome instances to scrape web pages.
-   **Node.js File System Module (`node:fs`)**: For reading and writing files.
-   **Custom Modules (`logger`, `paperless`, `utils`, `browser-utils`)**: User-defined modules for logging, Paperless API interaction, utility functions, and browser-related utilities.
-   **Paperless API**: For uploading documents and managing document metadata.

## Environment Variables

| Variable Name      | Data Type | Default Value | Description                                                                 |
| ------------------ | --------- | ------------- | --------------------------------------------------------------------------- |
| EMAIL              | String    | None          | Email address for authentication and communication within the application.  |
| SECRET_KEY         | String    | None          | Secret key used for encryption or security purposes within the application. |
| PAPERLESS_API_KEY  | String    | None          | API key for integration with the Paperless document processing service.     |
| PAPERLESS_BASE_URL | String    | None          | Base URL for accessing the Paperless API.                                   |
| PAPERLESS_TAGS     | String    | None          | Tags or labels used for categorizing documents within the Paperless system. |
| NOTIFY_WEBHOOKS    | String    | None          | URLs or endpoints for sending notifications or updates.                     |
| NOTIFY_BODY        | String    | None          | Body content for notifications sent via webhooks.                           |

**Note**: The following environment variables are required for the application to function properly:

-   `EMAIL`: Email address for authentication and communication within the application.
-   `SECRET_KEY`: Secret key used for encryption or security purposes within the application.
-   `PAPERLESS_API_KEY`: API key for integration with the Paperless document processing service.
-   `PAPERLESS_BASE_URL`: Base URL for accessing the Paperless API.

Please ensure these variables are properly set in your environment before running the application.

## Code Explanation

The provided code initializes the application, sets up Puppeteer to launch a browser, navigates to a specified URL, fetches documents, processes them, and uploads them to Paperless. It utilizes asynchronous functions, Promises, and error handling for efficient execution. Additionally, it includes utility functions for environment setup, encryption/decryption, and data conversion.

## Note

Ensure proper error handling and security measures are in place, especially when dealing with sensitive data such as passwords and API keys.

---

Feel free to adjust the content as needed for your specific application.
