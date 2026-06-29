import { useState } from "react";
import { AdminProductPreviewView } from "./AdminProductPreviewView";

type AdminProductPreviewProps = {
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  price: string;
  stock: string;
};

const formatPreviewPrice = (price: string) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return "$0.00";
  }

  return `$${numericPrice.toFixed(2)}`;
};

const formatPreviewStock = (stock: string) => {
  const numericStock = Number(stock);

  if (!Number.isInteger(numericStock) || numericStock < 0) {
    return "Stock quantity";
  }

  if (numericStock === 0) {
    return "Out of stock";
  }

  return `${numericStock} in stock`;
};

export function AdminProductPreview({
  title,
  category,
  description,
  imageUrl,
  price,
  stock,
}: AdminProductPreviewProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const trimmedTitle = title.trim();
  const trimmedCategory = category.trim();
  const trimmedDescription = description.trim();
  const trimmedImageUrl = imageUrl.trim();

  const titleText = trimmedTitle || "Product title";
  const categoryText = trimmedCategory || "Category";
  const descriptionText =
    trimmedDescription || "Product description will appear here.";

  const priceText = formatPreviewPrice(price);
  const stockText = formatPreviewStock(stock);

  const hasImageError =
    Boolean(trimmedImageUrl) && failedImageUrl === trimmedImageUrl;

  const shouldShowImage = Boolean(trimmedImageUrl) && !hasImageError;

  const imagePlaceholderText = trimmedImageUrl
    ? "Image could not be loaded"
    : "Product image will appear here";

  const handleImageError = () => {
    setFailedImageUrl(trimmedImageUrl);
  };

  return (
    <AdminProductPreviewView
      titleText={titleText}
      categoryText={categoryText}
      descriptionText={descriptionText}
      imageUrl={trimmedImageUrl}
      imageAlt={titleText}
      priceText={priceText}
      stockText={stockText}
      shouldShowImage={shouldShowImage}
      imagePlaceholderText={imagePlaceholderText}
      onImageError={handleImageError}
    />
  );
}
