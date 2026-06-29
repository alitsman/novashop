import "./admin-product-preview.css";

type AdminProductPreviewViewProps = {
  titleText: string;
  categoryText: string;
  descriptionText: string;
  imageUrl: string;
  imageAlt: string;
  priceText: string;
  stockText: string;
  shouldShowImage: boolean;
  imagePlaceholderText: string;
  onImageError: () => void;
};

export function AdminProductPreviewView({
  titleText,
  categoryText,
  descriptionText,
  imageUrl,
  imageAlt,
  priceText,
  stockText,
  shouldShowImage,
  imagePlaceholderText,
  onImageError,
}: AdminProductPreviewViewProps) {
  return (
    <section
      className="admin-product-preview"
      aria-labelledby="admin-product-preview-title"
    >
      <div className="admin-product-preview__header">
        <h2
          className="admin-product-preview__title"
          id="admin-product-preview-title"
        >
          Product card preview
        </h2>

        <p className="admin-product-preview__note">
          Preview only. Catalog actions are not available here.
        </p>
      </div>

      <article
        className="admin-product-preview__card"
        aria-label="Product card preview"
      >
        <div className="admin-product-preview__image-frame">
          {shouldShowImage ? (
            <img
              className="admin-product-preview__image"
              src={imageUrl}
              alt={imageAlt}
              onError={onImageError}
            />
          ) : (
            <div className="admin-product-preview__image-placeholder">
              <span className="admin-product-preview__image-placeholder-text">
                {imagePlaceholderText}
              </span>
            </div>
          )}
        </div>

        <div className="admin-product-preview__content">
          <p className="admin-product-preview__category">{categoryText}</p>

          <h3 className="admin-product-preview__product-title">{titleText}</h3>

          <p className="admin-product-preview__description">
            {descriptionText}
          </p>

          <div className="admin-product-preview__meta">
            <p className="admin-product-preview__price">{priceText}</p>

            <p className="admin-product-preview__stock">{stockText}</p>
          </div>

          <div className="admin-product-preview__actions" aria-hidden="true">
            <span className="admin-product-preview__fake-button">
              Add to cart
            </span>

            <span className="admin-product-preview__fake-link">
              View details
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}
