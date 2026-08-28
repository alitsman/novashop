import type { Product } from "../types";

type ExpectedSeededProduct = Omit<Product, "createdAt" | "updatedAt">;

// These products intentionally mirror the active rows from
// backend/seed-data/products.json.
// Automation does not import backend implementation files, so changes to the
// shared seed products must be reflected here.
//
// The array follows the public API order, not the insertion order from JSON:
// createdAt ascending, then id ascending.
export const SEEDED_REFERENCE_PRODUCT: ExpectedSeededProduct = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  title: "Wireless Mouse",
  price: 29.99,
  category: "Electronics",
  imageUrl:
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
  description: "A comfortable wireless mouse for everyday work, study, and browsing.",
  stock: 12,
};

export const SEEDED_ACTIVE_PRODUCTS: ExpectedSeededProduct[] = [
  SEEDED_REFERENCE_PRODUCT,
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    title: "Mechanical Keyboard",
    price: 89.99,
    category: "Electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    description: "A compact mechanical keyboard with responsive keys for coding and gaming.",
    stock: 8,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    title: "USB-C Hub",
    price: 39.99,
    category: "Electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=800&q=80",
    description: "A multi-port USB-C hub for connecting monitors, drives, and accessories.",
    stock: 15,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    title: "Desk Lamp",
    price: 24.99,
    category: "Home",
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    description: "A minimal desk lamp with a clean design for a comfortable workspace.",
    stock: 10,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    title: "Coffee Mug",
    price: 12.99,
    category: "Home",
    imageUrl:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
    description: "A ceramic mug for coffee, tea, or late-night debugging sessions.",
    stock: 20,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
    title: "Laptop Stand",
    price: 34.99,
    category: "Accessories",
    imageUrl:
      "https://images.unsplash.com/photo-1616628188508-42adf853b87c?auto=format&fit=crop&w=800&q=80",
    description: "An ergonomic laptop stand that helps improve posture at your desk.",
    stock: 7,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7",
    title: "Notebook",
    price: 9.99,
    category: "Books",
    imageUrl:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=800&q=80",
    description: "A simple notebook for plans, notes, test ideas, and daily tasks.",
    stock: 25,
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8",
    title: "TypeScript Handbook",
    price: 19.99,
    category: "Books",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    description: "A practical book-style guide for learning TypeScript basics.",
    stock: 5,
  },
];

export const SOFT_DELETED_SEEDED_PRODUCT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9";
