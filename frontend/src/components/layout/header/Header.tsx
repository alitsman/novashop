import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  logoutUser,
  selectCurrentUser,
  selectIsAuthenticated,
} from "../../../features/auth/authSlice";
import { selectCartTotalQuantity } from "../../../features/cart/cartSlice";
import { UserRole } from "../../../types/user";
import { HeaderView } from "./HeaderView";

export function Header() {
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const cartTotalQuantity = useAppSelector(selectCartTotalQuantity);

  const isAdmin = currentUser?.role === UserRole.Admin;
  const userName = currentUser?.name ?? null;

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <HeaderView
      userName={userName}
      isAuthenticated={isAuthenticated}
      isAdmin={isAdmin}
      cartTotalQuantity={cartTotalQuantity}
      onLogout={handleLogout}
    />
  );
}
