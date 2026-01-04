import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

export class DatabaseService {
  private db: Database.Database | null = null;
  private isInitialized = false;

  constructor() {
    // Don't initialize here - app may not be ready yet
  }

  public initialize() {
    if (this.isInitialized) {
      console.warn('Database already initialized');
      return;
    }

    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'accounting.db');

      console.log(`Initializing database at: ${dbPath}`);
      this.db = new Database(dbPath);

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Run migrations
      this.runMigrations();

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private runMigrations() {
    if (!this.db) return;

    // Create migrations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        business_name TEXT,
        business_type TEXT,
        location TEXT,
        trn TEXT,
        sync_enabled INTEGER DEFAULT 0,
        last_sync_timestamp DATETIME,
        local_version INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create companies table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        company_id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        trn TEXT,
        vat_number TEXT,
        business_address TEXT,
        emirate TEXT,
        free_zone_status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create chart of accounts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        account_id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_code TEXT NOT NULL UNIQUE,
        account_name TEXT NOT NULL,
        account_type TEXT NOT NULL,
        opening_balance REAL DEFAULT 0,
        local_currency TEXT DEFAULT 'AED',
        parent_account_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(account_id)
      )
    `);

    // Create transactions (journal entries) table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_date DATE NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        debit_account_id INTEGER NOT NULL,
        credit_account_id INTEGER NOT NULL,
        is_synced INTEGER DEFAULT 0,
        sync_status TEXT,
        local_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        cloud_timestamp DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (debit_account_id) REFERENCES chart_of_accounts(account_id),
        FOREIGN KEY (credit_account_id) REFERENCES chart_of_accounts(account_id)
      )
    `);

    // Create customers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_status TEXT,
        credit_limit REAL DEFAULT 0,
        contact_person TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoices table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        invoice_date DATE NOT NULL,
        due_date DATE,
        customer_id INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        tax_amount REAL NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'draft',
        is_synced INTEGER DEFAULT 0,
        sync_status TEXT,
        sync_timestamp DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      )
    `);

    // Create invoice line items table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        tax_rate REAL DEFAULT 5.0,
        line_total REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
      )
    `);

    // Create inventory table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_code TEXT NOT NULL UNIQUE,
        product_name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER DEFAULT 0,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        warehouse_id INTEGER,
        sku TEXT,
        last_stock_check_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sync queue table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        queue_id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced_at DATETIME,
        retry_count INTEGER DEFAULT 0
      )
    `);

    console.log('Database migrations completed successfully');
  }

  getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const databaseService = new DatabaseService();

