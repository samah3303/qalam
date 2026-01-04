// Database models and types
export interface User {
  user_id?: number;
  username: string;
  password_hash: string;
  email?: string;
  phone?: string;
  business_name?: string;
  business_type?: string;
  location?: string;
  trn?: string;
  sync_enabled?: boolean;
  last_sync_timestamp?: string;
  local_version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  company_id?: number;
  company_name: string;
  trn?: string;
  vat_number?: string;
  business_address?: string;
  emirate?: string;
  free_zone_status?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ChartOfAccount {
  account_id?: number;
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  opening_balance?: number;
  local_currency?: string;
  parent_account_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  transaction_id?: number;
  transaction_date: string;
  description?: string;
  amount: number;
  debit_account_id: number;
  credit_account_id: number;
  is_synced?: boolean;
  sync_status?: string;
  local_timestamp?: string;
  cloud_timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  customer_id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_status?: string;
  credit_limit?: number;
  contact_person?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  invoice_id?: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  customer_id: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  is_synced?: boolean;
  sync_status?: string;
  sync_timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  item_id?: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  line_total: number;
  created_at?: string;
}

export interface Product {
  product_id?: number;
  product_code: string;
  product_name: string;
  description?: string;
  quantity?: number;
  cost_price: number;
  selling_price: number;
  warehouse_id?: number;
  sku?: string;
  last_stock_check_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncQueueItem {
  queue_id?: number;
  entity_type: string;
  entity_id: number;
  action: 'create' | 'update' | 'delete';
  payload?: string;
  created_at?: string;
  synced_at?: string;
  retry_count?: number;
}
