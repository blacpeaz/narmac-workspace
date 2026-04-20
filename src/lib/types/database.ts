export type UserRole = "admin" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  type: string;
  size: string | null;
  unit: string;
  low_stock_threshold: number;
  is_active: boolean;
  category_id: string | null;
  created_at: string;
  created_by: string | null;
  category?: ProductCategory;
}

export type StockTransactionType = "IN" | "OUT";
export type ReferenceType = "rebaling" | "sale" | "adjustment" | "initial";

export interface StockTransaction {
  id: string;
  product_id: string;
  type: StockTransactionType;
  quantity: number;
  reference_type: ReferenceType;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  module: string;
  record_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
  user?: UserProfile;
}

export type PaymentType = "cash" | "transfer" | "credit";

export interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_type: PaymentType;
  notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  created_at: string;
  created_by: string | null;
  product?: Product;
  user?: UserProfile;
}

export type ExpenseCategory = string;

export interface ExpenseCategoryRecord {
  id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  created_at: string;
  created_by: string | null;
  user?: UserProfile;
}

export type InventoryStatus = "OK" | "LOW" | "OUT_OF_STOCK";

export interface InventoryItem {
  product_id: string;
  product_type: string;
  product_size: string;
  unit: string;
  low_stock_threshold: number;
  is_active: boolean;
  current_stock: number;
  status: InventoryStatus;
}
