import Database from 'better-sqlite3';
import * as XLSX from 'xlsx';

export class ExportService {
  constructor(private db: Database.Database) {}

  // Export invoices to CSV/Excel
  exportInvoices(format: 'csv' | 'excel', filters?: { startDate?: string; endDate?: string; status?: string }): any {
    try {
      let query = `
        SELECT 
          i.invoice_number,
          i.invoice_date,
          i.due_date,
          c.name as customer_name,
          i.subtotal,
          i.tax_amount,
          i.total_amount,
          i.status
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.customer_id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filters?.startDate) {
        query += ' AND i.invoice_date >= ?';
        params.push(filters.startDate);
      }

      if (filters?.endDate) {
        query += ' AND i.invoice_date <= ?';
        params.push(filters.endDate);
      }

      if (filters?.status) {
        query += ' AND i.status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY i.invoice_date DESC';

      const data = this.db.prepare(query).all(...params);

      if (format === 'csv') {
        return this.convertToCSV(data);
      } else {
        return this.convertToExcel(data, 'Invoices');
      }
    } catch (error) {
      console.error('Error exporting invoices:', error);
      throw new Error('Failed to export invoices');
    }
  }

  // Export expenses to CSV/Excel
  exportExpenses(format: 'csv' | 'excel', filters?: { startDate?: string; endDate?: string }): any {
    try {
      let query = `
        SELECT 
          e.date,
          ec.name as category,
          e.description,
          e.amount,
          e.vendor,
          e.payment_method
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.category_id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (filters?.startDate) {
        query += ' AND e.date >= ?';
        params.push(filters.startDate);
      }

      if (filters?.endDate) {
        query += ' AND e.date <= ?';
        params.push(filters.endDate);
      }

      query += ' ORDER BY e.date DESC';

      const data = this.db.prepare(query).all(...params);

      if (format === 'csv') {
        return this.convertToCSV(data);
      } else {
        return this.convertToExcel(data, 'Expenses');
      }
    } catch (error) {
      console.error('Error exporting expenses:', error);
      throw new Error('Failed to export expenses');
    }
  }

  // Export customers to CSV/Excel
  exportCustomers(format: 'csv' | 'excel'): any {
    try {
      const query = `
        SELECT 
          name,
          company_name,
          email,
          phone,
          address,
          trn,
          credit_limit,
          payment_terms,
          is_active
        FROM customers
        ORDER BY name ASC
      `;

      const data = this.db.prepare(query).all();

      if (format === 'csv') {
        return this.convertToCSV(data);
      } else {
        return this.convertToExcel(data, 'Customers');
      }
    } catch (error) {
      console.error('Error exporting customers:', error);
      throw new Error('Failed to export customers');
    }
  }

  // Export products to CSV/Excel
  exportProducts(format: 'csv' | 'excel'): any {
    try {
      const query = `
        SELECT 
          sku,
          name,
          category,
          unit_price,
          cost_price,
          stock_quantity,
          low_stock_threshold,
          unit_of_measure,
          tax_rate,
          is_active
        FROM products
        ORDER BY name ASC
      `;

      const data = this.db.prepare(query).all();

      if (format === 'csv') {
        return this.convertToCSV(data);
      } else {
        return this.convertToExcel(data, 'Products');
      }
    } catch (error) {
      console.error('Error exporting products:', error);
      throw new Error('Failed to export products');
    }
  }

  // Convert data to CSV string
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  // Convert data to Excel buffer
  private convertToExcel(data: any[], sheetName: string): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }
}
