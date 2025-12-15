import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import * as authController from './controllers/authController.js';
import * as appController from './controllers/appController.js';
import authMiddleware from './middleware/auth.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
// Auth
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/change-password', authMiddleware, authController.changePassword);

// Protected Routes
app.get('/api/transactions', authMiddleware, appController.getTransactions);
app.post('/api/transactions', authMiddleware, appController.addTransactions);
app.delete('/api/transactions/:id', authMiddleware, appController.deleteTransaction);

app.get('/api/assets', authMiddleware, appController.getAssets);
app.post('/api/assets', authMiddleware, appController.addAsset);
app.delete('/api/assets/:id', authMiddleware, appController.deleteAsset);

// Current account (compte courant)
app.get('/api/current-account', authMiddleware, appController.getCurrentAccount);
app.post('/api/current-account/manual', authMiddleware, appController.manualUpdateCurrentAccount);
app.post('/api/current-account/auto', authMiddleware, appController.autoUpdateCurrentAccount);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
