# NovaShop

NovaShop is a full-stack e-commerce portfolio project built as a realistic application and automation target.

## Project components

- **Frontend:** React, TypeScript, Redux Toolkit, React Router, and Vite.
- **Backend:** Express, TypeScript, PostgreSQL, and JWT authentication.
- **Automation:** Playwright tests for UI, API, and database behaviour.
- **CI:** Automated code-quality checks and blocking API/DB regression.

## Current status

Minimal CI is complete. Frontend-backend integration is currently in progress.

Authentication already uses the real backend API:

- registration through `POST /auth/register`;
- login through `POST /auth/login`;
- session restoration through `GET /me`;
- JWT storage in the browser;
- backend-controlled user roles and authorization.

Products, cart, checkout, orders, and admin functionality will be connected to the backend in the following integration stages.

## Demo accounts

The backend seed creates two demo accounts:

| Role  | Email          | Password  |
| ----- | -------------- | --------- |
| User  | user@test.com  | User123!  |
| Admin | admin@test.com | Admin123! |

## Documentation

Detailed architecture, local setup, testing, and deployment documentation will be added after frontend-backend integration is complete.
