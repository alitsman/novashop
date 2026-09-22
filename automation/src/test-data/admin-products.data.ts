import type { Product } from "../types";

type AdminListProductOverrides = Pick<Product, "id" | "title" | "createdAt"> & Partial<Product>;

export const ADMIN_LIST_OLDEST_PRODUCT: AdminListProductOverrides = {
  id: "ffffffff-ffff-4fff-8fff-fffffffffff1",
  title: "Admin Desk Lamp",
  createdAt: "2026-09-18T10:00:00.000Z",
};

export const ADMIN_LIST_MIDDLE_PRODUCT: AdminListProductOverrides = {
  id: "ffffffff-ffff-4fff-8fff-fffffffffff2",
  title: "Admin Office Chair",
  createdAt: "2026-09-19T10:00:00.000Z",
};

// The representative row overrides every displayed field so its values differ
// from the factory defaults shown in the other two rows.
export const ADMIN_LIST_NEWEST_PRODUCT: AdminListProductOverrides = {
  id: "ffffffff-ffff-4fff-8fff-fffffffffff3",
  title: "Admin Monitor Stand",
  description: "An adjustable stand used for admin product list coverage.",
  price: 84.75,
  category: "Workspace",
  imageUrl: "https://example.com/admin-monitor-stand.jpg",
  stock: 7,
  createdAt: "2026-09-20T10:00:00.000Z",
};
