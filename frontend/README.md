# NovaShop

Frontend diploma project. A fully functional e-commerce application built with React and TypeScript, featuring product catalog, cart, checkout, order history, and a complete admin panel for product management.

## Demo accounts

Open the application and use these credentials on the sign-in page:

| Role  | Email          | Password |
| ----- | -------------- | -------- |
| User  | user@test.com  | user123  |
| Admin | admin@test.com | admin123 |

The admin account unlocks the management panel with full product CRUD access.

## Tech stack

- **React** — UI components
- **TypeScript** — static typing throughout
- **Vite** — build tool and dev server
- **React Router** — client-side routing with protected and admin-only routes
- **Redux Toolkit** — global state management (auth, products, cart, orders)
- **Plain CSS + BEM + CSS custom properties** — styling without a UI framework
- **localStorage** — temporary data persistence (replaces a real backend for this stage)

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

```bash
npm run build   # production build
npm run preview # preview the production build locally
```

## Project structure

```
src/
├── app/              # Redux store, typed hooks, bootstrap hooks
├── assets/           # Static images
├── components/
│   ├── admin/        # Admin-only components (form, preview, delete, table)
│   ├── auth/         # Auth page layout
│   ├── cart/         # Cart quantity control
│   ├── checkout/     # Checkout form
│   ├── common/       # Shared UI: Button, TextField, ConfirmDialog, Toast, ...
│   ├── layout/       # App layout, Header, bootstrap screen
│   └── products/     # Product card, filters, add-to-cart control
├── data/             # Mock seed data (users, products)
├── features/         # Redux slices: auth, cart, orders, products
├── hooks/            # Shared hooks (useDebouncedValue)
├── pages/            # Route-level pages
├── routes/           # AppRouter, ProtectedRoute, AdminRoute, GuestRoute
├── services/         # Service layer: auth, products, orders, cart
├── types/            # Shared TypeScript types
└── utils/            # storage wrapper, delay utility
```

## Architecture

The app follows a strict layered data flow:

```
UI components
  → pages (Redux dispatch + selectors)
    → Redux slices / thunks
      → services (authService, productsService, ordersService, cartService)
        → localStorage via storage utility
```

Components and pages never access `localStorage` directly. All persistence goes through the service layer, which is designed to be replaced by a real backend API without touching Redux or UI code.

## Features

### Authentication

- Email and password sign-in and registration
- Auth state persisted across page refreshes via localStorage
- `GuestRoute` — redirects authenticated users away from `/login` and `/register`
- `ProtectedRoute` — redirects unauthenticated users to `/login`
- `AdminRoute` — redirects non-admin users to `/products`

### Products

- Catalog with search, category filter, and price sort (ascending / descending)
- Search is debounced (300 ms) to avoid excessive Redux dispatches
- Filter state persists within the session — navigating to a product and back keeps your search and filters active (intentional UX decision)
- Product details page with add-to-cart control and stock validation

### Cart

- Per-user cart: each user's cart is stored separately under their user ID
- Cart is restored on login and cleared on logout
- Quantity control with inline validation and stock enforcement
- Remove item with confirmation dialog

### Checkout

- Form with full name, phone, address, delivery method, and payment method
- Client-side validation with focus-on-first-error behavior
- On success: cart is cleared, a success toast is shown, and the user is redirected to order history

### Orders

- Order history showing all orders for the current user
- Orders are sorted by creation date (newest first)
- Per-user filtering: users only see their own orders

### Admin panel (`/admin/products`)

Accessible only to accounts with the `admin` role.

- **Product list** — table with image, title, category, price, and stock; responsive card layout on mobile
- **Create product** (`/admin/products/new`) — form with live preview that updates as you type
- **Edit product** (`/admin/products/:id/edit`) — same form pre-filled from the loaded product, with live preview and a delete section
- **Delete product** — confirmation dialog before any deletion; delete state is managed per-row so deleting one product does not block the rest of the table

The admin form validates all fields: title, price (positive decimal), stock (non-negative integer), image URL (must be http/https), category, and description. Validation includes length limits, control character detection, and angle bracket filtering.

## State management

Four Redux slices:

| Slice           | Responsibility                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `authSlice`     | Current user, token, auth request status                                                              |
| `productsSlice` | Product list, selected product, filters, separate status fields for list / detail / mutation / delete |
| `cartSlice`     | Cart items, quantity operations, stock validation                                                     |
| `ordersSlice`   | Order list with separate fetch and create status fields                                               |

`productsSlice` keeps four independent status fields (`listStatus`, `detailStatus`, `mutationStatus`, `deleteStatus`) so that create, update, and delete operations never share state and cannot interfere with each other.

## Data persistence (localStorage)

| Key                            | Contents                                                      |
| ------------------------------ | ------------------------------------------------------------- |
| `novashop-auth-token`          | Current session token                                         |
| `novashop-auth-user`           | Current user object                                           |
| `novashop-auth-users`          | All registered users (seeded from `mockUsers.ts`)             |
| `novashop-products`            | Product catalog (seeded from `mockProducts.ts` on first load) |
| `novashop-orders`              | All orders across all users                                   |
| `novashop-cart-items-{userId}` | Cart items for each user                                      |

On first load, if `novashop-products` is not found in localStorage, the app seeds 8 products from `mockProducts.ts`. All subsequent changes (create, edit, delete) persist immediately. To reset the catalog to seed data, clear `novashop-products` from localStorage and refresh.

## Mock backend behaviour

- All service methods include a simulated 300 ms async delay to replicate network latency
- The app bootstrap adds a minimum 1-second display of the loading screen to prevent a flash of unstyled content when localStorage is read synchronously
- Passwords in `mockUsers.ts` do not pass the registration form's password strength rules — this is intentional, as mock accounts are seed data, not user-registered accounts

## Accessibility

- Semantic HTML throughout: `<header>`, `<main>`, `<nav>`, `<section>`, `<article>`, `<table>` with `scope` attributes
- Two labelled `<nav>` landmarks in the header: main navigation and management navigation
- All forms use `noValidate` with custom validation, `aria-invalid`, `aria-describedby`, and focus-on-first-error
- Error messages use `role="alert"` for immediate screen reader announcement
- Status messages (loading, order count) use `role="status"` with `aria-live="polite"`
- Confirmation dialog implemented with the native `<dialog>` element and `showModal()` — provides built-in focus trapping, Escape key handling, and focus return on close
- Toast notifications use `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`
- Admin table action buttons have accessible labels: `Edit {product title}` and `Delete {product title}`
- Submit buttons carry `aria-busy` during async operations
- Decorative images use `alt=""` and `aria-hidden="true"`
- Global `:focus-visible` outline defined in `index.css`

## Known limitations and future work

This project is a frontend-only implementation. The following are known limitations of the current stage:

- **No real backend** — all data is stored in `localStorage`. Adding a backend requires replacing the service layer only; Redux and UI code do not need to change.
- **No real authentication** — tokens are mock strings, not JWTs. No token expiry or refresh logic.
- **No real authorisation** — admin role is stored in localStorage alongside the user object. In production this must come from the server.
- **Passwords stored in plaintext** in localStorage (mock only — not acceptable for production).
- **No pagination** — the product catalog and order history load all records at once.
- **No image upload** — product images are referenced by URL only.
- **Filter state is session-scoped** — product filters (search, category, sort) are stored in Redux and persist within the session but reset on page refresh.

The next planned stage is a real backend (Node.js + PostgreSQL + JWT) and Playwright end-to-end test coverage.
