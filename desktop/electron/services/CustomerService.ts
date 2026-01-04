import Database from 'better-sqlite3';

export interface Customer {
  customer_id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_name?: string;
  trn?: string;
  tax_status?: string;
  credit_limit: number;
  payment_terms?: string;
  contact_person?: string;
  notes?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export class CustomerService {
  constructor(private db: Database.Database) {
    this.initializeCustomerExtensions();
  }

  private initializeCustomerExtensions() {
    // Add new columns if they don't exist
    try {
      this.db.exec(`
        ALTER TABLE customers ADD COLUMN company_name TEXT;
      `);
    } catch (e) {
      // Column already exists
    }

    try {
      this.db.exec(`
        ALTER TABLE customers ADD COLUMN trn TEXT;
      `);
    } catch (e) {
      // Column already exists
    }

    try {
      this.db.exec(`
        ALTER TABLE customers ADD COLUMN payment_terms TEXT;
      `);
    } catch (e) {
      // Column already exists
    }

    try {
      this.db.exec(`
        ALTER TABLE customers ADD COLUMN notes TEXT;
      `);
    } catch (e) {
      // Column already exists
    }

    try {
      this.db.exec(`
        ALTER TABLE customers ADD COLUMN is_active INTEGER DEFAULT 1;
      `);
    } catch (e) {
      // Column already exists
    }
  }

  // Get all customers
  getCustomers(activeOnly = false, limit = 50, offset = 0): Customer[] {
    // ✅ FIX: Add pagination limit (max 1000)
    const safeLimit = Math.min(limit, 1000);
    let query = 'SELECT * FROM customers';
    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';

    return this.db.prepare(query).all(safeLimit, offset) as Customer[];
  }

  // Get customer by ID
  getCustomerById(customerId: number): Customer | null {
    return this.db
      .prepare('SELECT * FROM customers WHERE customer_id = ?')
      .get(customerId) as Customer | null;
  }

  // Create customer
  createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company_name?: string;
    trn?: string;
    tax_status?: string;
    credit_limit?: number;
    payment_terms?: string;
    contact_person?: string;
    notes?: string;
  }): { success: boolean; customer?: Customer; error?: string } {
    try {
      // Validation
      if (!data.name || data.name.trim().length === 0) {
        return { success: false, error: 'Customer name is required' };
      }

      if (data.email && !this.isValidEmail(data.email)) {
        return { success: false, error: 'Invalid email address' };
      }

      const stmt = this.db.prepare(`
        INSERT INTO customers (
          name, email, phone, address, company_name, trn, tax_status,
          credit_limit, payment_terms, contact_person, notes, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(
        data.name.trim(),
        data.email?.trim() || null,
        data.phone?.trim() || null,
        data.address?.trim() || null,
        data.company_name?.trim() || null,
        data.trn?.trim() || null,
        data.tax_status || null,
        data.credit_limit || 0,
        data.payment_terms?.trim() || null,
        data.contact_person?.trim() || null,
        data.notes?.trim() || null
      );

      const customer = this.getCustomerById(Number(result.lastInsertRowid));
      return { success: true, customer: customer! };
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      // ✅ FIX: Don't expose internal error details
      if (error.code === 'SQLITE_CONSTRAINT') {
        return { success: false, error: 'A customer with this information already exists' };
      }
      
      return { 
        success: false, 
        error: 'Failed to create customer. Please try again.'
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Update customer
  updateCustomer(
    customerId: number,
    data: Partial<Customer>
  ): { success: boolean; customer?: Customer; error?: string } {
    try {
      const stmt = this.db.prepare(`
        UPDATE customers
        SET name = COALESCE(?, name),
            email = ?,
            phone = ?,
            address = ?,
            company_name = ?,
            trn = ?,
            tax_status = ?,
            credit_limit = COALESCE(?, credit_limit),
            payment_terms = ?,
            contact_person = ?,
            notes = ?,
            is_active = COALESCE(?, is_active),
            updated_at = datetime('now')
        WHERE customer_id = ?
      `);

      stmt.run(
        data.name || null,
        data.email || null,
        data.phone || null,
        data.address || null,
        data.company_name || null,
        data.trn || null,
        data.tax_status || null,
        data.credit_limit !== undefined ? data.credit_limit : null,
        data.payment_terms || null,
        data.contact_person || null,
        data.notes || null,
        data.is_active !== undefined ? data.is_active : null,
        customerId
      );

      const customer = this.getCustomerById(customerId);
      return { success: true, customer: customer! };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, error: 'Failed to update customer' };
    }
  }

  // Delete customer (soft delete)
  deleteCustomer(customerId: number): { success: boolean; error?: string } {
    try {
      // Check if customer has invoices
      const invoiceCount = this.db
        .prepare('SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?')
        .get(customerId) as { count: number };

      if (invoiceCount.count > 0) {
        // Soft delete
        this.db
          .prepare('UPDATE customers SET is_active = 0, updated_at = datetime(\'now\') WHERE customer_id = ?')
          .run(customerId);
      } else {
        // Hard delete if no invoices
        this.db.prepare('DELETE FROM customers WHERE customer_id = ?').run(customerId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error: 'Failed to delete customer' };
    }
  }

  // Search customers
  searchCustomers(query: string): Customer[] {
    const searchTerm = `%${query}%`;
    return this.db.prepare(`
      SELECT * FROM customers
      WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ? OR company_name LIKE ?)
        AND is_active = 1
      ORDER BY name ASC
    `).all(searchTerm, searchTerm, searchTerm, searchTerm) as Customer[];
  }

  // Get customer invoices
  getCustomerInvoices(customerId: number): any[] {
    return this.db.prepare(`
      SELECT * FROM invoices
      WHERE customer_id = ?
      ORDER BY invoice_date DESC
    `).all(customerId);
  }

  // Get customer balance
  getCustomerBalance(customerId: number): { total: number; paid: number; outstanding: number } {
    const invoices = this.db.prepare(`
      SELECT total_amount, status FROM invoices
      WHERE customer_id = ?
    `).all(customerId) as Array<{ total_amount: number; status: string }>;

    let total = 0;
    let paid = 0;

    invoices.forEach(invoice => {
      total += invoice.total_amount;
      if (invoice.status === 'paid') {
        paid += invoice.total_amount;
      }
    });

    return {
      total,
      paid,
      outstanding: total - paid,
    };
  }

  // Get customer statistics
  getCustomerStats(customerId: number): {
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
  } {
    const balance = this.getCustomerBalance(customerId);
    const invoices = this.getCustomerInvoices(customerId);

    return {
      totalInvoices: invoices.length,
      totalAmount: balance.total,
      paidAmount: balance.paid,
      outstandingAmount: balance.outstanding,
    };
  }
}
