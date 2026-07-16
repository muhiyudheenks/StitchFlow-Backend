import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import connectDB from "./configure/db";
import authRoutes from './routes/authRoute';
import { notFound, errorHandler } from './Middlewares/errorHandler';

connectDB();

const app: Application = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'stitchflow-backend' });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`StitchFlow backend running on port ${PORT}`);
});