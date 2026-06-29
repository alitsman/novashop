import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import { UserRole } from "../types/user";

export function AdminRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.role !== UserRole.Admin) {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}
