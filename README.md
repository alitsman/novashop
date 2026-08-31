# NovaShop

NovaShop is a full-stack e-commerce portfolio project built as a realistic application and automation target.

## Project components

- **Frontend:** React, TypeScript, Redux Toolkit, React Router, and Vite.
- **Backend:** Express, TypeScript, PostgreSQL, and JWT authentication.
- **Automation:** Playwright tests for UI, API, and database behaviour.
- **CI:** Automated code-quality checks and blocking API/DB regression.

## Current status

Frontend-backend integration is complete. Minimal CI is in place.

Legacy UI tests still need to be updated for the integrated application and are not a blocking CI check.

Authentication already uses the real backend API:

- registration through `POST /auth/register`;
- login through `POST /auth/login`;
- session restoration through `GET /me`;
- JWT storage in the browser;
- backend-controlled user roles and authorization.

Products also use the backend API for catalog browsing, product details, and admin product creation, editing, and deletion.

The cart stays in browser storage and is not synchronized across devices. Prices and availability are checked against the backend when opening the cart or checkout and before placing an order.

Checkout creates orders through `POST /orders`, and order history loads through `GET /orders`. The backend calculates order totals and updates product stock.

## Demo accounts

The backend seed creates two demo accounts:

| Role  | Email          | Password  |
| ----- | -------------- | --------- |
| User  | user@test.com  | User123!  |
| Admin | admin@test.com | Admin123! |

## Documentation

Detailed architecture, local setup, testing, and deployment documentation will be added separately.
