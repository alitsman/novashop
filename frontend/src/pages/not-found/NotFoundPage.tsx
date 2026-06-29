import notFoundImage from "../../assets/404.png";
import { ActionLink } from "../../components/common/action-link";
import "./not-found-page.css";

export function NotFoundPage() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <img
        className="not-found-page__image"
        src={notFoundImage}
        alt=""
        aria-hidden="true"
      />

      <h1 className="not-found-page__title" id="not-found-title">
        Page not found.
      </h1>

      <p className="not-found-page__text">
        Looks like this page got lost somewhere in NovaShop.
      </p>

      <ActionLink to="/products">Go to products</ActionLink>
    </section>
  );
}
