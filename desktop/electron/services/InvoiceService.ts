import Database from 'better-sqlite3';
import { Customer } from '../../src/types/database.types.js';


export class InvoiceService {
  constructor(private db: Database.Database) {}

  // Generate next invoice number
  getNextInvoiceNumber(): string {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    const result = this.db
      .prepare(
        `SELECT invoice_number FROM invoices 
         WHERE invoice_number LIKE ? 
         ORDER BY invoice_id DESC LIMIT 1`
      )
      .get(`${prefix}%`) as { invoice_number?: string } | undefined;

    if (!result || !result.invoice_number) {
      return `${prefix}0001`;
    }

    const lastNumber = parseInt(result.invoice_number.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `${prefix}${nextNumber}`;
  }

  // Create invoice
  createInvoice(
    customerId: number,
    invoiceDate: string,
    dueDate: string | null,
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      tax_rate?: number;
    }>
  ): { success: boolean; invoice?: any; error?: string } {
    try {
      const invoiceNumber = this.getNextInvoiceNumber();

      // Calculate totals
      let subtotal = 0;
      let totalTax = 0;

      const processedItems = items.map(item => {
        const taxRate = item.tax_rate ?? 5.0; // Default UAE VAT 5%
        const lineSubtotal = item.quantity * item.unit_price;
        const lineTax = (lineSubtotal * taxRate) / 100;
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        totalTax += lineTax;

        return {
          ...item,
          tax_rate: taxRate,
          line_total: lineTotal,
        };
      });

      const totalAmount = subtotal + totalTax;

      // ✅ FIX: Wrap in transaction for atomicity
      const transaction = this.db.transaction((invoiceNumber, invoiceDate, dueDate, customerId, subtotal, totalTax, totalAmount, processedItems) => {
        // Insert invoice
        const invoiceStmt = this.db.prepare(`
          INSERT INTO invoices (
            invoice_number, invoice_date, due_date, customer_id,
            subtotal, tax_amount, total_amount, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))
        `);

        const invoiceResult = invoiceStmt.run(
          invoiceNumber,
          invoiceDate,
          dueDate,
          customerId,
          subtotal,
          totalTax,
          totalAmount
        );

        const invoiceId = invoiceResult.lastInsertRowid;

        // Insert invoice items
        const itemStmt = this.db.prepare(`
          INSERT INTO invoice_items (
            invoice_id, description, quantity, unit_price, tax_rate, line_total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        for (const item of processedItems) {
          itemStmt.run(
            invoiceId,
            item.description,
            item.quantity,
            item.unit_price,
            item.tax_rate,
            item.line_total
          );
        }

        return invoiceId;
      });

      // Execute transaction
      const invoiceId = transaction(invoiceNumber, invoiceDate, dueDate, customerId, subtotal, totalTax, totalAmount, processedItems);

      // Fetch created invoice with items
      const createdInvoice = this.getInvoiceById(Number(invoiceId));

      return { success: true, invoice: createdInvoice };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: 'Failed to create invoice. Please try again.' };
    }
  }

  // Get invoice by ID with items and customer
  getInvoiceById(invoiceId: number): any {
    const invoice = this.db
      .prepare(
        `SELECT i.*, c.name as customer_name, c.email as customer_email, c.address as customer_address
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         WHERE i.invoice_id = ?`
      )
      .get(invoiceId);

    if (!invoice) return null;

    const items = this.db
      .prepare('SELECT * FROM invoice_items WHERE invoice_id = ?')
      .all(invoiceId);

    return { ...invoice, items };
  }

  // List all invoices
  listInvoices(limit = 50, offset = 0): any[] {
    return this.db
      .prepare(
        `SELECT i.*, c.name as customer_name 
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         ORDER BY i.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset);
  }

  // Update invoice status
  updateInvoiceStatus(
    invoiceId: number,
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  ): { success: boolean; error?: string } {
    try {
      this.db
        .prepare(
          `UPDATE invoices 
           SET status = ?, updated_at = datetime('now')
           WHERE invoice_id = ?`
        )
        .run(status, invoiceId);

      return { success: true };
    } catch (error) {
      console.error('Error updating invoice status:', error);
      return { success: false, error: 'Failed to update invoice status. Please try again.' };
    }
  }

  // Delete invoice
  deleteInvoice(invoiceId: number): { success: boolean; error?: string } {
    try {
      // Foreign key cascade will delete items automatically
      this.db.prepare('DELETE FROM invoices WHERE invoice_id = ?').run(invoiceId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { success: false, error: 'Failed to delete invoice. Please try again.' };
    }
  }

  // Get customer list for dropdown
  getCustomers(): Customer[] {
    return this.db
      .prepare('SELECT * FROM customers ORDER BY name ASC')
      .all() as Customer[];
  }

  // Create customer (quick add)
  createCustomer(
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): { success: boolean; customer?: Customer; error?: string } {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO customers (name, email, phone, address, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(name, email || null, phone || null, address || null);

      const customer = this.db
        .prepare('SELECT * FROM customers WHERE customer_id = ?')
        .get(result.lastInsertRowid) as Customer;

      return { success: true, customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error: 'Failed to create customer. Please try again.' };
    }
  }

  // Get Aged Receivables Report
  getAgedReceivables(asOfDate?: string): any {
    const today = asOfDate || new Date().toISOString().split('T')[0];

    // Get all unpaid/partially paid invoices
    const invoices = this.db.prepare(`
      SELECT i.*, c.name as customer_name,
             JULIANDAY(?) - JULIANDAY(i.due_date) as days_overdue
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.customer_id
      WHERE i.status IN ('sent', 'overdue')
      ORDER BY c.name, i.due_date
    `).all(today) as any[];

    // Initialize buckets
    const summary = {
      current: 0,
      days31_60: 0,
      days61_90: 0,
      over90: 0,
      total: 0,
    };

    const byCustomer: Record<number, any> = {};

    invoices.forEach(invoice => {
      const amount = invoice.total_amount;
      const days = invoice.days_overdue;

      // Categorize by age
      if (days <= 30 || days < 0) {
        summary.current += amount;
        if (!byCustomer[invoice.customer_id]) byCustomer[invoice.customer_id] = { customer_name: invoice.customer_name, current: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0, invoices: [] };
        byCustomer[invoice.customer_id].current += amount;
      } else if (days <= 60) {
        summary.days31_60 += amount;
        if (!byCustomer[invoice.customer_id]) byCustomer[invoice.customer_id] = { customer_name: invoice.customer_name, current: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0, invoices: [] };
        byCustomer[invoice.customer_id].days31_60 += amount;
      } else if (days <= 90) {
        summary.days61_90 += amount;
        if (!byCustomer[invoice.customer_id]) byCustomer[invoice.customer_id] = { customer_name: invoice.customer_name, current: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0, invoices: [] };
        byCustomer[invoice.customer_id].days61_90 += amount;
      } else {
        summary.over90 += amount;
        if (!byCustomer[invoice.customer_id]) byCustomer[invoice.customer_id] = { customer_name: invoice.customer_name, current: 0, days31_60: 0, days61_90: 0, over90: 0, total: 0, invoices: [] };
        byCustomer[invoice.customer_id].over90 += amount;
      }

      summary.total += amount;
      if (byCustomer[invoice.customer_id]) {
        byCustomer[invoice.customer_id].total += amount;
        byCustomer[invoice.customer_id].invoices.push(invoice);
      }
    });

    return {
      summary,
      byCustomer: Object.values(byCustomer),
      asOfDate: today,
    };
  }
}
