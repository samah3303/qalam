import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { databaseService } from './database/DatabaseService.js';
import { LocalAuthService } from './services/AuthService.js';
import { InvoiceService } from './services/InvoiceService.js';
import { ExpenseService } from './services/ExpenseService.js';
import { AccountingService } from './services/AccountingService.js';
import { CustomerService } from './services/CustomerService.js';
import { InventoryService } from './services/InventoryService.js';
import { SettingsService } from './services/SettingsService.js';
import { ExportService } from './services/ExportService.js';
import { BackupService } from './services/BackupService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup IPC handlers for renderer communication
function setupIPCHandlers() {
  const authService = new LocalAuthService(databaseService.getDb());
  const invoiceService = new InvoiceService(databaseService.getDb());
  const expenseService = new ExpenseService(databaseService.getDb());
  const accountingService = new AccountingService(databaseService.getDb());
  const customerService = new CustomerService(databaseService.getDb());
  const inventoryService = new InventoryService(databaseService.getDb());
  const settingsService = new SettingsService(databaseService.getDb());
  const exportService = new ExportService(databaseService.getDb());
  const backupService = new BackupService(databaseService.getDb());

  // Auth handlers...
  ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
    return await authService.login(username, password);
  });

  ipcMain.handle('auth:signup', async (_event, username: string, password: string, email?: string) => {
    return await authService.signup(username, password, email);
  });

  // Invoice handlers...
  ipcMain.handle(
    'invoice:create',
    async (_event, customerId: number, invoiceDate: string, dueDate: string | null, items: any[]) => {
      return invoiceService.createInvoice(customerId, invoiceDate, dueDate, items);
    }
  );

  ipcMain.handle('invoice:list', async (_event, limit?: number, offset?: number) => {
    return invoiceService.listInvoices(limit, offset);
  });

  ipcMain.handle('invoice:getById', async (_event, invoiceId: number) => {
    return invoiceService.getInvoiceById(invoiceId);
  });

  ipcMain.handle('invoice:updateStatus', async (_event, invoiceId: number, status: string) => {
    return invoiceService.updateInvoiceStatus(invoiceId, status as any);
  });

  ipcMain.handle('invoice:delete', async (_event, invoiceId: number) => {
    return invoiceService.deleteInvoice(invoiceId);
  });

  ipcMain.handle('invoice:getNextNumber', async () => {
    return invoiceService.getNextInvoiceNumber();
  });

  // Customer handlers...
  ipcMain.handle('customer:list', async (_event, activeOnly?: boolean, limit?: number, offset?: number) => {
    return customerService.getCustomers(activeOnly, limit, offset);
  });

  ipcMain.handle('customer:getById', async (_event, customerId: number) => {
    return customerService.getCustomerById(customerId);
  });

  ipcMain.handle('customer:create', async (_event, data: any) => {
    return customerService.createCustomer(data);
  });

  ipcMain.handle('customer:update', async (_event, customerId: number, data: any) => {
    return customerService.updateCustomer(customerId, data);
  });

  ipcMain.handle('customer:delete', async (_event, customerId: number) => {
    return customerService.deleteCustomer(customerId);
  });

  ipcMain.handle('customer:search', async (_event, query: string) => {
    return customerService.searchCustomers(query);
  });

  ipcMain.handle('customer:getInvoices', async (_event, customerId: number) => {
    return customerService.getCustomerInvoices(customerId);
  });

  ipcMain.handle('customer:getBalance', async (_event, customerId: number) => {
    return customerService.getCustomerBalance(customerId);
  });

  ipcMain.handle('customer:getStats', async (_event, customerId: number) => {
    return customerService.getCustomerStats(customerId);
  });

  // Expense handlers...
  ipcMain.handle(
    'expense:create',
    async (
      _event,
      date: string,
      categoryId: number,
      amount: number,
      description: string,
      vendor?: string,
      paymentMethod?: string
    ) => {
      return expenseService.createExpense(date, categoryId, amount, description, vendor, paymentMethod);
    }
  );

  ipcMain.handle('expense:list', async (_event, limit?: number, offset?: number) => {
    return expenseService.listExpenses(limit, offset);
  });

  ipcMain.handle('expense:getById', async (_event, expenseId: number) => {
    return expenseService.getExpenseById(expenseId);
  });

  ipcMain.handle('expense:update', async (_event, expenseId: number, data: any) => {
    return expenseService.updateExpense(expenseId, data);
  });

  ipcMain.handle('expense:delete', async (_event, expenseId: number) => {
    return expenseService.deleteExpense(expenseId);
  });

  ipcMain.handle('expense:getCategories', async () => {
    return expenseService.getCategories();
  });

  // Product/Inventory handlers...
  ipcMain.handle('product:list', async (_event, activeOnly?: boolean, limit?: number, offset?: number) => {
    return inventoryService.getProducts(activeOnly, limit, offset);
  });

  ipcMain.handle('product:getById', async (_event, productId: number) => {
    return inventoryService.getProductById(productId);
  });

  ipcMain.handle('product:create', async (_event, data: any) => {
    return inventoryService.createProduct(data);
  });

  ipcMain.handle('product:update', async (_event, productId: number, data: any) => {
    return inventoryService.updateProduct(productId, data);
  });

  ipcMain.handle('product:delete', async (_event, productId: number) => {
    return inventoryService.deleteProduct(productId);
  });

  ipcMain.handle('product:search', async (_event, query: string) => {
    return inventoryService.searchProducts(query);
  });

  ipcMain.handle('product:getLowStock', async () => {
    return inventoryService.getLowStockProducts();
  });

  ipcMain.handle(
    'product:adjustStock',
    async (
      _event,
      productId: number,
      quantity: number,
      type: 'IN' | 'OUT' | 'ADJUST',
      referenceType?: string,
      referenceId?: number,
      notes?: string
    ) => {
      return inventoryService.adjustStock(productId, quantity, type, referenceType, referenceId, notes);
    }
  );

  ipcMain.handle('product:getMovements', async (_event, productId: number, limit?: number) => {
    return inventoryService.getStockMovements(productId, limit);
  });

  ipcMain.handle('expense:getSummary', async (_event, startDate?: string, endDate?: string) => {
    return expenseService.getExpenseSummary(startDate, endDate);
  });

  ipcMain.handle('expense:getTotal', async (_event, startDate?: string, endDate?: string) => {
    return expenseService.getTotalExpenses(startDate, endDate);
  });

  // Accounting handlers...
  ipcMain.handle('accounting:createJournalEntry', async (_event, entryDate: string, description: string, lines: any[], reference?: string) => {
    return accountingService.createJournalEntry(entryDate, description, lines, reference);
  });

  ipcMain.handle('accounting:getJournalEntryById', async (_event, entryId: number) => {
    return accountingService.getJournalEntryById(entryId);
  });

  ipcMain.handle('accounting:listJournalEntries', async (_event, limit?: number, offset?: number) => {
    return accountingService.listJournalEntries(limit, offset);
  });

  ipcMain.handle('accounting:getGeneralLedger', async (_event, accountId?: number, startDate?: string, endDate?: string) => {
    return accountingService.getGeneralLedger(accountId, startDate, endDate);
  });

  ipcMain.handle('accounting:getChartOfAccounts', async () => {
    return accountingService.getChartOfAccounts();
  });

  ipcMain.handle('accounting:getTrialBalance', async (_event, asOfDate?: string) => {
    return accountingService.getTrialBalance(asOfDate);
  });

  ipcMain.handle('accounting:getProfitAndLoss', async (_event, startDate: string, endDate: string) => {
    return accountingService.getProfitAndLoss(startDate, endDate);
  });

  ipcMain.handle('accounting:getBalanceSheet', async (_event, asOfDate: string) => {
    return accountingService.getBalanceSheet(asOfDate);
  });

  ipcMain.handle('accounting:getCashFlow', async (_event, startDate: string, endDate: string) => {
    return accountingService.getCashFlowStatement(startDate, endDate);
  });

  ipcMain.handle('accounting:getVATReport', async (_event, startDate: string, endDate: string) => {
    return accountingService.getVATReport(startDate, endDate);
  });

  ipcMain.handle('invoice:getAgedReceivables', async (_event, asOfDate?: string) => {
    return invoiceService.getAgedReceivables(asOfDate);
  });

  // Settings handlers
  ipcMain.handle('settings:get', async (_event, key: string) => {
    return settingsService.getSetting(key);
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: any, type?: string, category?: string) => {
    return settingsService.setSetting(key, value, type, category);
  });

  ipcMain.handle('settings:getAll', async () => {
    return settingsService.getAllSettings();
  });

  ipcMain.handle('settings:update', async (_event, settings: Record<string, any>) => {
    return settingsService.updateSettings(settings);
  });

  ipcMain.handle('settings:reset', async () => {
    return settingsService.resetSettings();
  });

  // Export handlers
  ipcMain.handle('export:invoices', async (_event, format: 'csv' | 'excel', filters?: any) => {
    return exportService.exportInvoices(format, filters);
  });

  ipcMain.handle('export:expenses', async (_event, format: 'csv' | 'excel', filters?: any) => {
    return exportService.exportExpenses(format, filters);
  });

  ipcMain.handle('export:customers', async (_event, format: 'csv' | 'excel') => {
    return exportService.exportCustomers(format);
  });

  ipcMain.handle('export:products', async (_event, format: 'csv' | 'excel') => {
    return exportService.exportProducts(format);
  });

  // Backup handlers
  ipcMain.handle('backup:create', async (_event, destination?: string) => {
    return await backupService.createBackup(destination);
  });

  ipcMain.handle('backup:restore', async (_event, backupPath: string) => {
    return await backupService.restoreBackup(backupPath);
  });

  ipcMain.handle('backup:list', async () => {
    return backupService.listBackups();
  });
}



// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Qalam',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Close database connection before quitting
    databaseService.close();
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  // Ensure database is closed
  databaseService.close();
});

app.whenReady().then(() => {
  console.log('App is ready, initializing database...');
  // Initialize database after app is ready
  try {
    databaseService.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Continue anyway - app can still run without database
  }

  // Setup IPC handlers
  setupIPCHandlers();
  
  createWindow();
});
