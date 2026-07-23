import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './features/auth';
import { adminRouter } from './features/admin';
import protect from './shared/middleware/authMiddleware';
import { authorize } from './shared/middleware/roleMiddleware';
import { notFound, errorHandler } from './shared/middleware/errorHandler';

const app: Application = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'stitchflow-backend' });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', protect, authorize('admin'), adminRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
