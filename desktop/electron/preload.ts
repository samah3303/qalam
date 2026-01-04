import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// Expose Auth API
contextBridge.exposeInMainWorld('api', {
  auth: {
    login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
    signup: (username: string, password: string, email?: string) =>
      ipcRenderer.invoke('auth:signup', username, password, email),
  },
  invoice: {
    create: (customerId: number, invoiceDate: string, dueDate: string | null, items: any[]) =>
      ipcRenderer.invoke('invoice:create', customerId, invoiceDate, dueDate, items),
    list: (limit?: number, offset?: number) => ipcRenderer.invoke('invoice:list', limit, offset),
    getById: (invoiceId: number) => ipcRenderer.invoke('invoice:getById', invoiceId),
    updateStatus: (invoiceId: number, status: string) =>
      ipcRenderer.invoke('invoice:updateStatus', invoiceId, status),
    delete: (invoiceId: number) => ipcRenderer.invoke('invoice:delete', invoiceId),
    getNextNumber: () => ipcRenderer.invoke('invoice:getNextNumber'),
    getAgedReceivables: (asOfDate?: string) => ipcRenderer.invoke('invoice:getAgedReceivables', asOfDate),
  },

  customer: {
    list: (activeOnly?: boolean, limit?: number, offset?: number) => ipcRenderer.invoke('customer:list', activeOnly, limit, offset),
    getById: (customerId: number) => ipcRenderer.invoke('customer:getById', customerId),
    create: (data: any) => ipcRenderer.invoke('customer:create', data),
    update: (customerId: number, data: any) => ipcRenderer.invoke('customer:update', customerId, data),
    delete: (customerId: number) => ipcRenderer.invoke('customer:delete', customerId),
    search: (query: string) => ipcRenderer.invoke('customer:search', query),
    getInvoices: (customerId: number) => ipcRenderer.invoke('customer:getInvoices', customerId),
    getBalance: (customerId: number) => ipcRenderer.invoke('customer:getBalance', customerId),
    getStats: (customerId: number) => ipcRenderer.invoke('customer:getStats', customerId),
  },
  product: {
    list: (activeOnly?: boolean, limit?: number, offset?: number) => ipcRenderer.invoke('product:list', activeOnly, limit, offset),
    getById: (productId: number) => ipcRenderer.invoke('product:getById', productId),
    create: (data: any) => ipcRenderer.invoke('product:create', data),
    update: (productId: number, data: any) => ipcRenderer.invoke('product:update', productId, data),
    delete: (productId: number) => ipcRenderer.invoke('product:delete', productId),
    search: (query: string) => ipcRenderer.invoke('product:search', query),
    getLowStock: () => ipcRenderer.invoke('product:getLowStock'),
    adjustStock: (
      productId: number,
      quantity: number,
      type: 'IN' | 'OUT' | 'ADJUST',
      referenceType?: string,
      referenceId?: number,
      notes?: string
    ) => ipcRenderer.invoke('product:adjustStock', productId, quantity, type, referenceType, referenceId, notes),
    getMovements: (productId: number, limit?: number) => ipcRenderer.invoke('product:getMovements', productId, limit),
  },
  expense: {
    create: (
      date: string,
      categoryId: number,
      amount: number,
      description: string,
      vendor?: string,
      paymentMethod?: string
    ) => ipcRenderer.invoke('expense:create', date, categoryId, amount, description, vendor, paymentMethod),
    list: (limit?: number, offset?: number) => ipcRenderer.invoke('expense:list', limit, offset),
    getById: (expenseId: number) => ipcRenderer.invoke('expense:getById', expenseId),
    update: (expenseId: number, data: any) => ipcRenderer.invoke('expense:update', expenseId, data),
    delete: (expenseId: number) => ipcRenderer.invoke('expense:delete', expenseId),
    getCategories: () => ipcRenderer.invoke('expense:getCategories'),
    getSummary: (startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('expense:getSummary', startDate, endDate),
    getTotal: (startDate?: string, endDate?: string) => ipcRenderer.invoke('expense:getTotal', startDate, endDate),
  },
  accounting: {
    createJournalEntry: (entryDate: string, description: string, lines: any[], reference?: string) =>
      ipcRenderer.invoke('accounting:createJournalEntry', entryDate, description, lines, reference),
    getJournalEntryById: (entryId: number) => ipcRenderer.invoke('accounting:getJournalEntryById', entryId),
    listJournalEntries: (limit?: number, offset?: number) =>
      ipcRenderer.invoke('accounting:listJournalEntries', limit, offset),
    getGeneralLedger: (accountId?: number, startDate?: string, endDate?: string) =>
      ipcRenderer.invoke('accounting:getGeneralLedger', accountId, startDate, endDate),
    getChartOfAccounts: () => ipcRenderer.invoke('accounting:getChartOfAccounts'),
    getTrialBalance: (asOfDate?: string) => ipcRenderer.invoke('accounting:getTrialBalance', asOfDate),
    getProfitAndLoss: (startDate: string, endDate: string) =>
      ipcRenderer.invoke('accounting:getProfitAndLoss', startDate, endDate),
    getBalanceSheet: (asOfDate: string) => ipcRenderer.invoke('accounting:getBalanceSheet', asOfDate),
    getCashFlow: (startDate: string, endDate: string) => ipcRenderer.invoke('accounting:getCashFlow', startDate, endDate),
    getVATReport: (startDate: string, endDate: string) => ipcRenderer.invoke('accounting:getVATReport', startDate, endDate),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any, type?: string, category?: string) => ipcRenderer.invoke('settings:set', key, value, type, category),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    update: (settings: Record<string, any>) => ipcRenderer.invoke('settings:update', settings),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },
  export: {
    invoices: (format: 'csv' | 'excel', filters?: any) => ipcRenderer.invoke('export:invoices', format, filters),
    expenses: (format: 'csv' | 'excel', filters?: any) => ipcRenderer.invoke('export:expenses', format, filters),
    customers: (format: 'csv' | 'excel') => ipcRenderer.invoke('export:customers', format),
    products: (format: 'csv' | 'excel') => ipcRenderer.invoke('export:products', format),
  },
  backup: {
    create: (destination?: string) => ipcRenderer.invoke('backup:create', destination),
    restore: (backupPath: string) => ipcRenderer.invoke('backup:restore', backupPath),
    list: () => ipcRenderer.invoke('backup:list'),
  },
});
