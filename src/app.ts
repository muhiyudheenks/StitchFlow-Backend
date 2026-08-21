import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authRouter } from './modules/auth';
import { adminRouter, managerRouter, employeeRouter } from './modules/user';
import performanceRouter from './modules/user/routes/performance.routes';
import supportRouter from './modules/support/routes/support.routes';

import { tasksRouter } from './modules/tasks';
import { productionRouter } from './modules/production';
import { inventoryRouter } from './modules/inventory';
import { leaveRouter } from './modules/leave';
import attendanceRouter from './modules/attendance/routes/attendance.routes';
import { salaryRouter } from './modules/salary';
import { reportsRouter } from './modules/reports';
import { notificationsRouter } from './modules/notifications';
import { profileRouter } from './modules/profile';

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
    ? Array.from(new Set([...defaultOrigins, envFrontendUrl.replace(/\/$/, '')]))
    : defaultOrigins;

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
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

import { getActiveGarmentProducts } from './modules/production/controllers/garmentProduct.controller';

app.get('/api/garment-products/active', protect, getActiveGarmentProducts);

import categoryRouter from './modules/inventory/routes/category.routes';
import warehouseRouter from './modules/inventory/routes/warehouse.routes';

import settingsRouter from './modules/settings/routes/settings.routes';

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
