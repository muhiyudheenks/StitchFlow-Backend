import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authRouter } from './features/auth';
import { adminRouter, managerRouter, employeeRouter } from './features/user';
import performanceRouter from './features/user/routes/performance.routes';
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
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://stitchflow.space',
    'https://www.stitchflow.space',
];

const envFrontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
const allowedOrigins = envFrontendUrl
    ? Array.from(new Set([...defaultOrigins, envFrontendUrl.replace(/\/$/, '')]))
    : defaultOrigins;

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, '')) || process.env.NODE_ENV !== 'production') {
                callback(null, true);
            } else {
                callback(null, true);
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        optionsSuccessStatus: 204,
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

import { getActiveGarmentProducts } from './features/production/controllers/garmentProduct.controller';

app.get('/api/garment-products/active', protect, getActiveGarmentProducts);

import categoryRouter from './features/inventory/routes/category.routes';
import warehouseRouter from './features/inventory/routes/warehouse.routes';

import settingsRouter from './features/settings/routes/settings.routes';

app.use('/api/support', protect, supportRouter);
app.use('/api/tasks', protect, tasksRouter);
app.use('/api/production', protect, productionRouter);
app.use('/api/inventory', protect, inventoryRouter);
app.use('/api/categories', protect, categoryRouter);
app.use('/api/warehouses', protect, warehouseRouter);
app.use('/api/leave', protect, leaveRouter);
app.use('/api/attendance', protect, attendanceRouter);
app.use('/api/salary', protect, salaryRouter);
app.use('/api/reports', protect, reportsRouter);
app.use('/api/notifications', protect, notificationsRouter);
app.use('/api/profile', protect, profileRouter);
app.use('/api/settings', settingsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
