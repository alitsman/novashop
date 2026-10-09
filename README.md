# NovaShop

NovaShop is a full-stack e-commerce portfolio project built as a realistic application and automation target.

## Project components

- **Frontend:** React, TypeScript, Redux Toolkit, React Router, and Vite.
- **Backend:** Express, TypeScript, PostgreSQL, and JWT authentication.
- **Automation:** Playwright tests for UI, API, and database behaviour.
- **CI:** Automated code-quality checks and blocking API, database, and Chromium browser regression.

## Current status

Frontend-backend integration and the Chromium browser-test migration are complete. CI runs API, database, hybrid, E2E, and isolated UI regression as a blocking pull-request gate.

Authentication already uses the real backend API:

- registration through `POST /auth/register`;
- login through `POST /auth/login`;
- session restoration through `GET /me`;
- JWT storage in the browser;
- backend-controlled user roles and authorization.

Products also use the backend API for catalog browsing, product details, and admin product creation, editing, and deletion.

The cart stays in browser storage and is not synchronized across devices. Prices and availability are checked against the backend when opening the cart or checkout and before placing an order.

Checkout creates orders through `POST /orders`, and order history loads through `GET /orders`. The backend calculates order totals and updates product stock.

## Run with Docker

You can run NovaShop locally with Docker Compose. You do not need Node.js or PostgreSQL on your computer. You need Docker Desktop (or Docker Engine with Compose).

1. Copy `.env.example` in the repository root to `.env`. Do not commit `.env`.

2. Fill in the values in `.env`:
   - `POSTGRES_PASSWORD` and `JWT_SECRET` are required. Use random hexadecimal values. Other characters can break the database connection URL.
   - `ADMIN_PASSWORD` is needed only for the seed step below. It must be at least 16 characters long.

   To generate a random hexadecimal value, use one of these commands:

   ```bash
   # Git Bash, WSL, Linux or macOS
   openssl rand -hex 32
   ```

   ```powershell
   # Windows PowerShell 5.1 or PowerShell 7
   $bytes = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes); ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
   ```

3. Build and start the application:

   ```bash
   docker compose up -d --build --wait backend frontend
   ```

   This starts PostgreSQL, runs the database migrations, and then starts the backend and the frontend.

4. Open `http://localhost:8080`. Use `localhost`, not `127.0.0.1`. The backend allows requests only from `http://localhost:8080`.

5. Optional: add the admin account and the seed products. Set `ADMIN_PASSWORD` in `.env` and run:

   ```bash
   docker compose run --rm seed
   ```

   The seed never runs automatically. The admin email is `admin@test.com`, and the password is your `ADMIN_PASSWORD` value. The public test accounts are not created. To create a regular user, register in the application.

6. Stop the application and keep the data:

   ```bash
   docker compose down
   ```

   Start it again with `docker compose up -d --wait backend frontend`.

Important notes:

- `docker compose down -v` deletes the database volume and all data.
- `POSTGRES_PASSWORD` is used only when the database is created for the first time. If you change it later, the existing database keeps the old password. To use a new password, delete the volume with `docker compose down -v`.
- Docker Compose commands, including `down`, need the root `.env` file because Compose checks the required variables.

## Local test accounts

The test database seed (`npm run seed:test` in `backend/`) creates two accounts for automated testing:

| Role  | Email            | Password    |
| ----- | ---------------- | ----------- |
| User  | `user@test.com`  | `User123!`  |
| Admin | `admin@test.com` | `Admin123!` |

These credentials are only for the isolated test database. They are not used anywhere else:

- The Docker Compose seed (`docker compose run --rm seed`) reads `ADMIN_PASSWORD` from the root `.env`.
- The local backend seed (`npm run seed` in `backend/`) reads `ADMIN_PASSWORD` from `backend/.env`.

Both create only the admin account `admin@test.com`, with the password from `ADMIN_PASSWORD`, and the seed products. Regular users register in the application.

## Documentation

Detailed architecture, local setup, testing, and deployment documentation will be added separately.
