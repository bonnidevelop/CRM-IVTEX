import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";


async function startServer(): Promise<void> {
    try {
        await connectDatabase();
        const PORT = Number(process.env.PORT) || 5000;
        app.listen(PORT, () => {
            console.log(`CRM API server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
        });

    } catch (error) {
        console.error(
            "Failed to start the CRM API. Check database configuration and connectivity."
        );

        if (process.env.NODE_ENV !== "production") {
            console.error(error);
        }

        process.exitCode = 1;
    }
}

void startServer();






