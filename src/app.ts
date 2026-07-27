import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authRouter } from './features/auth';
import { adminRouter } from './features/admin';
import { managerRouter } from './features/manager';
import { employeeRouter } from './features/employee';
import performanceRouter from './features/employee/routes/performance.routes';
import supportRouter from './features/support/routes/support.routes';

import { tasksRouter } from './features/tasks';
import { productionRouter } from './features/production';
import { inventoryRouter } from './features/inventory';
import { leaveRouter } from './features/leave';
import attendanceRouter from './features/attendance/routes/attendance.routes';
import { salaryRouter } from './features/salary';
import { reportsRouter } from './features/reports';
import { notificationsRouter } from './features/notifications';
import { profileRouter } from './features/profile';

import protect from './shared/middleware/authMiddleware';
import { authorize } from './shared/middleware/roleMiddleware';
import { notFound, errorHandler } from './shared/middleware/errorHandler';

const app: Application = express();

const defaultOrigins = [
    'http://localhost:3000',
    'https://stitchflow.space',
    'https://www.stitchflow.space',
];

const envFrontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
const allowedOrigins = envFrontendUrl
    ? Array.from(new Set([...defaultOrigins, envFrontendUrl]))
    : defaultOrigins;

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'stitchflow-backend' });
});

// Role Dashboard APIs
app.use('/api/auth', authRouter);
app.use('/api/admin', protect, authorize('admin'), adminRouter);
app.use('/api/manager', protect, authorize('manager', 'admin'), managerRouter);
app.use('/api/employee', protect, authorize('employee', 'manager', 'admin'), employeeRouter);
app.use('/api/performance', protect, performanceRouter);

// Centralized Domain Feature APIs
app.use('/api/support', protect, supportRouter);
app.use('/api/tasks', protect, tasksRouter);
app.use('/api/production', protect, productionRouter);
app.use('/api/inventory', protect, inventoryRouter);
app.use('/api/leave', protect, leaveRouter);
app.use('/api/attendance', protect, attendanceRouter);
app.use('/api/salary', protect, salaryRouter);
app.use('/api/reports', protect, reportsRouter);
app.use('/api/notifications', protect, notificationsRouter);
app.use('/api/profile', protect, profileRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
