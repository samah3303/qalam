// Type definitions for window.api exposure
export interface IElectronAPI {
  auth: {
    login: (username: string, password: string) => Promise<{
      success: boolean;
      user?: any;
      error?: string;
    }>;
    signup: (username: string, password: string, email?: string) => Promise<{
      success: boolean;
      user?: any;
      error?: string;
    }>;
  };
  invoice: {
    create: (customerId: number, invoiceDate: string, dueDate: string | null, items: any[]) => Promise<{
      success: boolean;
      invoice?: any;
      error?: string;
    }>;
    list: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (invoiceId: number) => Promise<any>;
    updateStatus: (invoiceId: number, status: string) => Promise<{ success: boolean; error?: string }>;
    delete: (invoiceId: number) => Promise<{ success: boolean; error?: string }>;
    getNextNumber: () => Promise<string>;
  };
  customer: {
    list: (activeOnly?: boolean, limit?: number, offset?: number) => Promise<any[]>;
    getById: (customerId: number) => Promise<any>;
    create: (data: any) => Promise<{ success: boolean; customer?: any; error?: string }>;
    update: (customerId: number, data: any) => Promise<{ success: boolean; customer?: any; error?: string }>;
    delete: (customerId: number) => Promise<{ success: boolean; error?: string }>;
    search: (query: string) => Promise<any[]>;
    getInvoices: (customerId: number) => Promise<any[]>;
    getBalance: (customerId: number) => Promise<{ total: number; paid: number; outstanding: number }>;
    getStats: (customerId: number) => Promise<{
      totalInvoices: number;
      totalAmount: number;
      paidAmount: number;
      outstandingAmount: number;
    }>;
  };
  product: {
    list: (activeOnly?: boolean, limit?: number, offset?: number) => Promise<any[]>;
    getById: (productId: number) => Promise<any>;
    create: (data: any) => Promise<{ success: boolean; product?: any; error?: string }>;
    update: (productId: number, data: any) => Promise<{ success: boolean; product?: any; error?: string }>;
    delete: (productId: number) => Promise<{ success: boolean; error?: string }>;
    search: (query: string) => Promise<any[]>;
    getLowStock: () => Promise<any[]>;
    adjustStock: (
      productId: number,
      quantity: number,
      type: 'IN' | 'OUT' | 'ADJUST',
      referenceType?: string,
      referenceId?: number,
      notes?: string
    ) => Promise<{ success: boolean; product?: any; error?: string }>;
    getMovements: (productId: number, limit?: number) => Promise<any[]>;
  };
  expense: {
    create: (
      date: string,
      categoryId: number,
      amount: number,
      description: string,
      vendor?: string,
      paymentMethod?: string
    ) => Promise<{ success: boolean; expense?: any; error?: string }>;
    list: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (expenseId: number) => Promise<any>;
    update: (expenseId: number, data: any) => Promise<{ success: boolean; error?: string }>;
    delete: (expenseId: number) => Promise<{ success: boolean; error?: string }>;
    getCategories: () => Promise<any[]>;
    getSummary: (startDate?: string, endDate?: string) => Promise<any[]>;
    getTotal: (startDate?: string, endDate?: string) => Promise<number>;
  };
  accounting: {
    createJournalEntry: (entryDate: string, description: string, lines: any[], reference?: string) => Promise<{
      success: boolean;
      entry?: any;
      error?: string;
    }>;
    getJournalEntryById: (entryId: number) => Promise<any>;
    listJournalEntries: (limit?: number, offset?: number) => Promise<any[]>;
    getGeneralLedger: (accountId?: number, startDate?: string, endDate?: string) => Promise<any[]>;
    getChartOfAccounts: () => Promise<any[]>;
    getTrialBalance: (asOfDate?: string) => Promise<any[]>;
    getProfitAndLoss: (startDate: string, endDate: string) => Promise<any>;
    getBalanceSheet: (asOfDate: string) => Promise<any>;
    getCashFlow: (startDate: string, endDate: string) => Promise<any>;
    getVATReport: (startDate: string, endDate: string) => Promise<any>;
  };
  invoice: {
    create: (customerId: number, invoiceDate: string, dueDate: string | null, items: any[]) => Promise<{
      success: boolean;
      invoice?: any;
      error?: string;
    }>;
    list: (limit?: number, offset?: number) => Promise<any[]>;
    getById: (invoiceId: number) => Promise<any>;
    updateStatus: (invoiceId: number, status: string) => Promise<{ success: boolean; error?: string }>;
    delete: (invoiceId: number) => Promise<{ success: boolean; error?: string }>;
    getNextNumber: () => Promise<string>;
    getAgedReceivables: (asOfDate?: string) => Promise<any>;
  };
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any, type?: string, category?: string) => Promise<{ success: boolean; error?: string }>;
    getAll: () => Promise<Record<string, any>>;
    update: (settings: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
    reset: () => Promise<{ success: boolean; error?: string }>;
  };
  export: {
    invoices: (format: 'csv' | 'excel', filters?: any) => Promise<any>;
    expenses: (format: 'csv' | 'excel', filters?: any) => Promise<any>;
    customers: (format: 'csv' | 'excel') => Promise<any>;
    products: (format: 'csv' | 'excel') => Promise<any>;
  };
  backup: {
    create: (destination?: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    restore: (backupPath: string) => Promise<{ success: boolean; error?: string }>;
    list: () => Promise<any[]>;
  };
}

declare global {
  interface Window {
    api: IElectronAPI;
    ipcRenderer: any;
  }
}
