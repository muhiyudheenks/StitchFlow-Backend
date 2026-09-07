# StitchFlow Backend

The StitchFlow backend is a TypeScript and Express API for garment-manufacturing workforce and operations management. It provides authentication, role-based access, employee and manager administration, production workflows, inventory, attendance, leave, tasks, payroll, reports, notifications, support, profiles, and settings.

The API uses MongoDB through Mongoose and is consumed by the separate StitchFlow frontend application.

## Features

- Email/password authentication with email OTP verification.
- Google ID-token verification for registered StitchFlow users.
- Password reset and invited-user password setup flows.
- JWT authentication through bearer headers or cookies.
- Role-based access for `admin`, `manager`, and `employee`.
- Permission-based access for administrative and operational actions.
- Employee and manager administration with invitation/setup links.
- Production batches, members, tasks, progress, verification, and garment products.
- Attendance check-in, check-out, history, team views, and summaries.
- Leave requests and leave review workflows.
- Fabric, thread, garment, category, warehouse, and stock transaction APIs.
- Salary and payslip APIs.
- Reports and generated CSV-style downloads.
- User notifications and unread counts.
- Support tickets, FAQs, company documents, and support contacts.
- Profile and system settings APIs.
- Centralized validation and error handling.

## Technology stack

- Node.js
- Express `4.19.2`
- TypeScript
- MongoDB and Mongoose `8.5.0`
- JSON Web Tokens with `jsonwebtoken`
- `bcryptjs` password hashing
- `google-auth-library`
- Zod validation
- `cookie-parser`
- CORS
- Resend and Nodemailer email utilities
- dotenv

## Project structure

```text
Backend/
├── src/
│   ├── app.ts                         # Express setup and route mounting
│   ├── server.ts                       # Environment loading, DB startup, HTTP server
│   ├── modules/
│   │   ├── auth/                      # Authentication and OTP
│   │   ├── user/                      # Admin, manager, employee, and performance APIs
│   │   ├── attendance/                # Attendance operations
│   │   ├── dashboard/                 # Role dashboard services
│   │   ├── inventory/                 # Inventory and catalog operations
│   │   ├── leave/                     # Leave requests and review
│   │   ├── notifications/             # Notifications
│   │   ├── production/                # Batches and garment products
│   │   ├── profile/                   # User profile
│   │   ├── reports/                   # Reports and downloads
│   │   ├── salary/                    # Salary and payslips
│   │   ├── settings/                  # System settings
│   │   ├── support/                   # Tickets, FAQs, documents, contacts
│   │   └── tasks/                     # Task operations
│   └── shared/
│       ├── config/                    # MongoDB connection
│       ├── constants/                 # Roles, permissions, and schema constants
│       ├── errors/                    # AppError and async error utilities
│       ├── middleware/                # Auth, role, permission, and error middleware
│       ├── services/                  # Email and invitation services
│       ├── types/                     # Shared request types
│       └── utils/                     # JWT, OTP, and email helpers
├── .env.example
├── package.json
├── tsconfig.json
└── .github/workflows/deploy.yml
```

Modules generally use controllers, services, repositories, routes, models, validators, and types. Not every module contains every layer.

## Roles and permissions

The `User` model supports three roles:

| Role | API access |
| --- | --- |
| `admin` | `/api/admin`; administrator-level operations and all permission checks. |
| `manager` | `/api/manager` and manager-level workflows. |
| `employee` | `/api/employee` and employee self-service workflows. |

The main role middleware is mounted in `src/app.ts`:

- `/api/admin` requires `admin`.
- `/api/manager` allows `manager` and `admin`.
- `/api/employee` allows `employee`, `manager`, and `admin`.

Permission names are defined in `src/shared/constants/permissions.ts`:

- `employees.view`, `employees.create`, `employees.update`, `employees.delete`
- `production.view`, `production.create`, `production.update`, `production.delete`, `production.assign`, `production.verify`
- `attendance.view`, `attendance.manage`, `attendance.export`
- `inventory.view`, `inventory.create`, `inventory.update`, `inventory.delete`
- `support.view`, `support.create`, `support.update`, `support.resolve`, `support.close`
- `reports.view`, `reports.export`
- `settings.view`, `settings.manage`

The database user is reloaded for every protected request. Role and permissions are therefore taken from MongoDB, not from the request body or frontend state.

## Authentication and authorization

### Password and OTP flow

1. `POST /api/auth/login` validates the email and password.
2. The backend generates and stores a login OTP.
3. The OTP is sent to the user's email.
4. `POST /api/auth/verify-otp` verifies the OTP and issues a JWT.
5. The frontend uses the returned user and token for authenticated requests.

### Google flow

1. The frontend sends a Google credential to `POST /api/auth/google-login`.
2. The backend verifies the Google ID token with `google-auth-library`.
3. The Google email must be verified and must already exist in the `User` collection.
4. Unregistered Google accounts are rejected without creating a database user.
5. Inactive or blocked users are rejected.
6. The existing MongoDB user's ID is used to create the StitchFlow JWT.
7. The existing MongoDB role and permissions remain authoritative.

### JWT middleware

`src/shared/middleware/authMiddleware.ts` accepts a JWT from:

- `Authorization: Bearer <token>`
- `token` cookie
- `jwt` cookie

The middleware verifies the token, reloads the user from MongoDB, and attaches the database user ID, role, email, and effective permissions to `req.user`.

JWTs contain the user ID and default to a seven-day expiration. The lifetime can be changed with `JWT_EXPIRES_IN`.

## API reference

The API is mounted under `/api`. Credentialed CORS is configured for local and production frontend origins. The health endpoint is public:

```text
GET /api/health
```

### Authentication: `/api/auth`

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Validate credentials and send login OTP. |
| `POST` | `/api/auth/google-login` | Verify Google credential and authenticate an existing user. |
| `POST` | `/api/auth/logout` | Clear authentication cookies. |
| `POST` | `/api/auth/verify-otp` | Verify login or reset OTP. |
| `POST` | `/api/auth/verify-reset-otp` | OTP verification alias. |
| `POST` | `/api/auth/resend-otp` | Send another OTP. |
| `POST` | `/api/auth/forgot-password` | Start password reset. |
| `POST` | `/api/auth/reset-password` | Set a new password. |
| `GET` | `/api/auth/verify-setup-token/:token` | Validate an invitation setup token. |
| `POST` | `/api/auth/setup-password` | Set a password for an invited user. |

### Role APIs

```text
# Admin
GET    /api/admin/employees
POST   /api/admin/employees
GET    /api/admin/employees/:id
PUT    /api/admin/employees/:id
PATCH  /api/admin/employees/:id
DELETE /api/admin/employees/:id
GET    /api/admin/managers
POST   /api/admin/managers
PATCH  /api/admin/managers/:id
DELETE /api/admin/managers/:id
POST   /api/admin/managers/:id/assign-employees
GET    /api/admin/dashboard/overview
GET    /api/admin/dashboard/analytics-summary

# Manager
GET    /api/manager/overview
GET    /api/manager/batches
GET    /api/manager/batches/:batchId
GET    /api/manager/batches/:batchId/tasks
POST   /api/manager/batches/:batchId/tasks
PATCH  /api/manager/batches/:batchId/tasks/:taskId
PATCH  /api/manager/batches/:batchId/tasks/:taskId/verify
GET    /api/manager/employees
GET    /api/manager/tasks
POST   /api/manager/tasks
GET    /api/manager/attendance
GET    /api/manager/leaves
PATCH  /api/manager/leaves/:id
GET    /api/manager/production
GET    /api/manager/inventory
GET    /api/manager/reports

# Employee
GET    /api/employee/dashboard
GET    /api/employee/performance
GET    /api/employee/performance/me
GET    /api/employee/performance/team
GET    /api/employee/performance/:employeeId
PATCH  /api/employee/profile
POST   /api/employee/attendance/toggle
POST   /api/employee/leaves

# Performance
GET    /api/performance
GET    /api/performance/me
GET    /api/performance/team
GET    /api/performance/:employeeId
```

### Operational APIs

```text
# Attendance
GET    /api/attendance/today
POST   /api/attendance/check-in
POST   /api/attendance/check-out
GET    /api/attendance/history
GET    /api/attendance/team
GET    /api/attendance/all

# Leave
GET    /api/leave/my
GET    /api/leave
POST   /api/leave
PATCH  /api/leave/:id/status

# Tasks
GET    /api/tasks
GET    /api/tasks/batch/:batchId
POST   /api/tasks
PUT    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
PATCH  /api/tasks/:id/progress
PATCH  /api/tasks/:id/complete
PATCH  /api/tasks/:id/verify

# Production
GET    /api/production
POST   /api/production
GET    /api/production/available-employees
GET    /api/production/:id
PATCH  /api/production/:id
PUT    /api/production/:id
DELETE /api/production/:id
POST   /api/production/:id/members
DELETE /api/production/:id/members/:employeeId
PATCH  /api/production/:id/complete
DELETE /api/production/tasks/:id
POST   /api/production/tasks/:id/inventory

# Inventory and catalog
GET|POST   /api/inventory/fabric
PUT|DELETE /api/inventory/fabric/:id
GET|POST   /api/inventory/thread
PUT|DELETE /api/inventory/thread/:id
GET|POST   /api/inventory/garments
PUT|DELETE /api/inventory/garments/:id
GET        /api/inventory/summary
GET        /api/inventory/analytics
GET        /api/inventory/transactions
GET|POST   /api/categories
GET|POST   /api/warehouses
GET        /api/garment-products/active
```

### Supporting APIs

```text
# Notifications
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/read-all
PATCH /api/notifications/:id/read

# Salary
GET /api/salary
GET /api/salary/me
GET /api/salary/payslip/:id

# Reports
GET /api/reports
GET /api/reports/download/:id

# Profile and settings
GET   /api/profile
PUT   /api/profile
PATCH /api/profile
GET   /api/settings
PATCH /api/settings

# Support
POST   /api/support/tickets
GET    /api/support/my-tickets
PATCH  /api/support/my-tickets/:id/status
GET    /api/support/tickets
GET    /api/support/tickets/:id
PATCH  /api/support/tickets/:id
PATCH  /api/support/tickets/:id/status
GET    /api/support/faqs
POST   /api/support/faqs
PATCH  /api/support/faqs/:id
DELETE /api/support/faqs/:id
GET    /api/support/documents
POST   /api/support/documents
PATCH  /api/support/documents/:id
DELETE /api/support/documents/:id
GET    /api/support/manager
GET    /api/support/hr
GET    /api/support/contacts
```

## Database models

MongoDB is connected through `src/shared/config/db.ts`. Startup performs safe updates for employee type defaults and grants the complete permission set to admin users.

| Model | Purpose | Relationships or notes |
| --- | --- | --- |
| `User` | Identity, role, status, permissions, profile, and password data | Self-reference through `managerId`. |
| `Otp` | Login and password-reset OTP records | Stores purpose, code, email, and expiry. |
| `AttendanceRecord` | Daily attendance and sessions | References `User` through `employeeId`. |
| `LeaveRequest` | Leave requests and reviews | References employee and reviewer users. |
| `ProductionBatch` | Production batches and members | References manager and user member arrays. |
| `BatchTask` | Tasks attached to production batches | References batch, assigned user, and verifier. |
| `Task` | General task records | References batch, assigned employee, and verifier. |
| `GarmentProduct` | Garment products | Stores product and creator data. |
| `Production` | Production records | Contains manager/user references. |
| `Notification` | Workflow notifications | References recipient and optional batch/task data. |
| `Payroll` | Salary and payslip records | References an employee. |
| `Inventory` | Administrative inventory records | Used by admin inventory workflows. |
| `FabricItem` | Fabric stock | Calculates value and stock status. |
| `ThreadItem` | Thread stock | Inventory item model. |
| `GarmentItem` | Garment stock | Calculates total quantity. |
| `InventoryTransaction` | Stock movement history | Records stock-in and stock-out operations. |
| `Category` | Inventory categories | Used by category routes. |
| `Warehouse` | Inventory warehouses | Used by warehouse routes. |
| `Activity` | Dashboard activity records | References the acting user. |
| `SupportTicket` | Support requests and assignments | References creator, employee/manager, and admin. |
| `FAQ` | Support FAQs | Supports active FAQ records. |
| `CompanyDocument` | Company support documents | Supports active documents. |
| `SupportContact` | Support contact information | Stores contact records. |
| `SystemSettings` | System configuration | Used by settings services. |

User passwords are hashed in a Mongoose `pre('save')` hook. User status values include `active`, `inactive`, and `on_leave`; blocked users are represented by `isBlock`.

## Validation and error handling

Zod validation is used in authentication and selected employee, manager, attendance, production, and inventory routes. `validateRequest.middleware.ts` provides request validation middleware where applied.

The backend has centralized error utilities:

- `AppError` for known application errors.
- `asyncHandler` for asynchronous controller errors.
- `notFound` handling for unmatched routes.
- Global error middleware for HTTP error responses.

The error layer handles CORS, Zod, duplicate MongoDB keys, Mongoose cast errors, invalid JWTs, expired JWTs, and unknown errors. Development responses may include stack traces; production configuration should ensure sensitive diagnostics are not exposed.

## Environment variables

Copy the example file before starting the backend:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `PORT` | Express server port; the example uses `5000`. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_SECRET` | Secret used to sign JWTs. |
| `JWT_EXPIRES_IN` | Optional JWT lifetime; code defaults to `7d`. |
| `FRONTEND_URL` | Frontend origin allowed by CORS. |
| `CLIENT_URL` | Alternate frontend origin used by CORS. |
| `OTP_LENGTH` | OTP length. |
| `OTP_EXPIRES_MINUTES` | OTP lifetime in minutes. |
| `RESEND_API_KEY` | Resend API credential. |
| `EMAIL_FROM` | Email sender address. |
| `GOOGLE_CLIENT_ID` | Google ID-token audience. |
| `SMTP_HOST` | Optional SMTP host used by email utilities. |
| `SMTP_PORT` | Optional SMTP port. |
| `SMTP_USER` | Optional SMTP username. |
| `SMTP_PASS` | Optional SMTP password. |
| `EMAIL_USER` | Optional email username. |
| `EMAIL_PASS` | Optional email password. |
| `NODE_ENV` | Runtime environment used by cookie and error behavior. |

Never commit `.env` files, JWT secrets, database credentials, OAuth credentials, email credentials, or private keys.

## Local development

### Prerequisites

- Node.js 20 or a compatible current Node.js release.
- npm.
- A reachable MongoDB instance.
- Resend or configured email credentials for OTP delivery.
- Google OAuth credentials if Google login is enabled.

### Install and run

```bash
npm ci
npm run dev
```

The development command watches `src` and runs `src/server.ts` through Nodemon and ts-node. The server listens on port `5000` by default.

Health check:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "stitchflow-backend"
}
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Watch TypeScript source and run the development server. |
| `npm run build` | Compile TypeScript into `dist`. |
| `npm start` | Run the compiled `dist/server.js`. |

There is currently no test or lint script in this repository.

## Production deployment

The repository includes `.github/workflows/deploy.yml`. On pushes to `main`, it:

1. Uses Node.js 20.
2. Runs `npm ci` and `npm run build` in GitHub Actions.
3. Connects to EC2 over SSH.
4. Pulls the `main` branch in `/home/ubuntu/StitchFlow-Backend`.
5. Installs dependencies, builds again, and restarts the PM2 process `stitchflow-backend`.

The workflow expects these GitHub Actions secrets:

- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_KEY`

The parent workspace contains an Nginx configuration that proxies `/api/` and `/socket.io/` to `localhost:5000`. No Dockerfile, Docker Compose file, PM2 ecosystem file, database backup procedure, or rollback runbook is committed in this repository.

## Development workflow

1. Create or switch to a branch in the backend repository.
2. Copy `.env.example` to `.env` and configure local services.
3. Run `npm ci`.
4. Start MongoDB and the backend with `npm run dev`.
5. Use `GET /api/health` to check server availability.
6. Run `npm run build` before opening a pull request.
7. Keep API route, service, model, and authorization changes scoped to the relevant module.

## Security considerations

- Use a strong, unique `JWT_SECRET` in every environment.
- Require `MONGO_URI`, `JWT_SECRET`, and production email/OAuth values through deployment secrets.
- Use HTTPS in production so cookies and bearer tokens are protected in transit.
- Keep Google client secrets, SMTP credentials, Resend credentials, and private keys out of Git.
- Keep backend role and permission checks authoritative; never trust role data from the frontend.
- Keep Google login restricted to existing, verified, active users.
- Configure CORS only for trusted frontend origins.
- Disable stack traces and sensitive error details in production responses.
- Add rate limiting and monitoring around login, OTP, password reset, and administrative endpoints before exposing the API to untrusted traffic.

## Known implementation notes

- Frontend and backend are separate GitHub repositories and must be configured and run independently.
- The backend does not contain a test script or OpenAPI specification.
- Some frontend service paths require reconciliation with backend route registrations, including notification, report export, and production batch-task paths.
- Some feature authorization is enforced in services or individual routes rather than through one uniform role middleware pattern.
- There is no committed Docker or PM2 ecosystem configuration; the deployment workflow assumes PM2 is already configured on the EC2 host.

## Repository

GitHub: <https://github.com/muhiyudheenks/StitchFlow-Backend>
