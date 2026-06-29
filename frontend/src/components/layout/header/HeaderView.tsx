import { NavLink } from "react-router-dom";
import "./header.css";

type DefaultHeaderViewProps = {
  variant?: "default";
  userName: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  cartTotalQuantity: number;
  onLogout: () => void;
};

type BootstrapHeaderViewProps = {
  variant: "bootstrap";
};

type HeaderViewProps = DefaultHeaderViewProps | BootstrapHeaderViewProps;

type HeaderBrandProps = {
  isLink: boolean;
};

const getNavLinkClassName = ({ isActive }: { isActive: boolean }) => {
  return isActive
    ? "app-header__link app-header__link--active"
    : "app-header__link";
};

const getManagementNavLinkClassName = ({ isActive }: { isActive: boolean }) => {
  return isActive
    ? "app-header__management-link app-header__management-link--active"
    : "app-header__management-link";
};

const getCartLinkText = (cartTotalQuantity: number) => {
  const itemLabel = cartTotalQuantity === 1 ? "item" : "items";

  return `Cart, ${cartTotalQuantity} ${itemLabel}`;
};

function HeaderBrand({ isLink }: HeaderBrandProps) {
  if (isLink) {
    return (
      <NavLink className="app-header__logo" to="/products">
        NovaShop
      </NavLink>
    );
  }

  return <span className="app-header__logo">NovaShop</span>;
}

export function HeaderView(props: HeaderViewProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        {props.variant === "bootstrap" ? (
          <div className="app-header__nav">
            <HeaderBrand isLink={false} />
          </div>
        ) : (
          <>
            <nav className="app-header__nav" aria-label="Main navigation">
              <HeaderBrand isLink={props.isAuthenticated} />

              {props.isAuthenticated && (
                <div className="app-header__links">
                  <NavLink className={getNavLinkClassName} to="/products">
                    Products
                  </NavLink>

                  <NavLink className={getNavLinkClassName} to="/cart">
                    {getCartLinkText(props.cartTotalQuantity)}
                  </NavLink>

                  <NavLink className={getNavLinkClassName} to="/orders">
                    My orders
                  </NavLink>
                </div>
              )}

              <div className="app-header__auth">
                {!props.isAuthenticated && (
                  <>
                    <NavLink className={getNavLinkClassName} to="/login">
                      Login
                    </NavLink>

                    <NavLink className={getNavLinkClassName} to="/register">
                      Register
                    </NavLink>
                  </>
                )}

                {props.isAuthenticated && (
                  <>
                    <span className="app-header__user-name">
                      {props.userName}
                    </span>

                    <button
                      className="app-header__logout-button"
                      type="button"
                      onClick={props.onLogout}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </nav>

            {props.isAdmin && (
              <nav
                className="app-header__management-nav"
                aria-label="Management navigation"
              >
                <span className="app-header__management-title">
                  Management tools:
                </span>

                <div className="app-header__management-links">
                  <NavLink
                    className={getManagementNavLinkClassName}
                    to="/admin/products"
                  >
                    Manage products
                  </NavLink>
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </header>
  );
}
