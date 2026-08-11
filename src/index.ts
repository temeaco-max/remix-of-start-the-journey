import dotenv from 'dotenv';
import express from 'express';
import { getDb } from './database.js';
import { registerLegacyRoutes } from './legacyApp.js';
import { startBackgroundServices } from './startup/backgroundServices.js';

dotenv.config();
if (!process.env.KURUKOO_PAY_PROVIDER) process.env.KURUKOO_PAY_PROVIDER = 'sandbox';
if (!process.env.CREDIT_ECONOMY_ENABLED) process.env.CREDIT_ECONOMY_ENABLED = 'true';
const PORT = Number(process.env.PORT) || 3000;

export function createApp() {
    const app = express();
    app.set('trust proxy', 1);
    registerLegacyRoutes(app);
    return app;
}

const app = createApp();
app.listen(PORT, '0.0.0.0', async () => {
    await getDb();
    console.log(`Kurukoo server running on port ${PORT}`);
    await startBackgroundServices();
});
