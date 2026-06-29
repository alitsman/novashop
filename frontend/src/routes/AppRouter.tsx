import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { NotFoundPage } from "../pages/not-found";
import { ProductsPage } from "../pages/products";
import { ProductDetailsPage } from "../pages/product-details";
import { LoginPage } from "../pages/login";
import { RegisterPage } from "../pages/register";
import { CartPage } from "../pages/cart";
import { OrdersPage } from "../pages/orders";
import { AdminProductsPage } from "../pages/admin-products";
import { AdminProductCreatePage } from "../pages/admin-product-create";
import { AdminProductEditPage } from "../pages/admin-product-edit";
import { CheckoutPage } from "../pages/checkout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { GuestRoute } from "./GuestRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/products" replace />} />

          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route
              path="/products/:productId"
              element={<ProductDetailsPage />}
            />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route
              path="/admin/products/new"
              element={<AdminProductCreatePage />}
            />
            <Route
              path="/admin/products/:productId/edit"
              element={<AdminProductEditPage />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
