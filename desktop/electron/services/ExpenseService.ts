import Database from 'better-sqlite3';

export interface ExpenseCategory {
  category_id: number;
  name: string;
  description?: string;
}

export interface Expense {
  expense_id: number;
  date: string;
  category_id: number;
  amount: number;
  description: string;
  vendor?: string;
  payment_method?: string;
  receipt_path?: string;
  created_at: string;
  updated_at: string;
}

export class ExpenseService {
  constructor(private db: Database.Database) {
    this.initializeExpenseTables();
  }

  private initializeExpenseTables() {
    // Create expense categories table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create expenses table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        vendor TEXT,
        payment_method TEXT,
        receipt_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES expense_categories(category_id)
      )
    `);

    // Insert default categories if they don't exist
    const defaultCategories = [
      { name: 'Rent', description: 'Office and property rent' },
      { name: 'Utilities', description: 'Electricity, water, internet' },
      { name: 'Supplies', description: 'Office supplies and materials' },
      { name: 'Salaries', description: 'Employee salaries and wages' },
      { name: 'Marketing', description: 'Advertising and marketing costs' },
      { name: 'Travel', description: 'Business travel expenses' },
      { name: 'Professional Fees', description: 'Consultants, lawyers, accountants' },
      { name: 'Insurance', description: 'Business insurance premiums' },
      { name: 'Maintenance', description: 'Equipment and facility maintenance' },
      { name: 'Other', description: 'Miscellaneous expenses' },
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO expense_categories (name, description)
      VALUES (?, ?)
    `);

    for (const category of defaultCategories) {
      stmt.run(category.name, category.description);
    }
  }

  // Create expense
  createExpense(
    date: string,
    categoryId: number,
    amount: number,
    description: string,
    vendor?: string,
    paymentMethod?: string
  ): { success: boolean; expense?: Expense; error?: string } {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO expenses (date, category_id, amount, description, vendor, payment_method, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(date, categoryId, amount, description, vendor || null, paymentMethod || null);

      const expense = this.db
        .prepare('SELECT * FROM expenses WHERE expense_id = ?')
        .get(result.lastInsertRowid) as Expense;

      return { success: true, expense };
    } catch (error) {
      console.error('Error creating expense:', error);
      return { success: false, error: 'Failed to create expense. Please try again.' };
    }
  }

  // List expenses
  listExpenses(limit = 50, offset = 0): any[] {
    return this.db
      .prepare(
        `SELECT e.*, c.name as category_name
         FROM expenses e
         LEFT JOIN expense_categories c ON e.category_id = c.category_id
         ORDER BY e.date DESC, e.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset);
  }

  // Get expense by ID
  getExpenseById(expenseId: number): Expense | null {
    return this.db.prepare('SELECT * FROM expenses WHERE expense_id = ?').get(expenseId) as Expense | null;
  }

  // Update expense
  updateExpense(
    expenseId: number,
    data: {
      date?: string;
      categoryId?: number;
      amount?: number;
      description?: string;
      vendor?: string;
      paymentMethod?: string;
    }
  ): { success: boolean; error?: string } {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.date !== undefined) {
        updates.push('date = ?');
        values.push(data.date);
      }
      if (data.categoryId !== undefined) {
        updates.push('category_id = ?');
        values.push(data.categoryId);
      }
      if (data.amount !== undefined) {
        updates.push('amount = ?');
        values.push(data.amount);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.vendor !== undefined) {
        updates.push('vendor = ?');
        values.push(data.vendor);
      }
      if (data.paymentMethod !== undefined) {
        updates.push('payment_method = ?');
        values.push(data.paymentMethod);
      }

      if (updates.length === 0) {
        return { success: false, error: 'No updates provided' };
      }

      updates.push("updated_at = datetime('now')");
      values.push(expenseId);

      const stmt = this.db.prepare(`
        UPDATE expenses
        SET ${updates.join(', ')}
        WHERE expense_id = ?
      `);

      stmt.run(...values);
      return { success: true };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { success: false, error: 'Failed to update expense. Please try again.' };
    }
  }

  // Delete expense
  deleteExpense(expenseId: number): { success: boolean; error?: string } {
    try {
      this.db.prepare('DELETE FROM expenses WHERE expense_id = ?').run(expenseId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error: 'Failed to delete expense. Please try again.' };
    }
  }

  // Get expense categories
  getCategories(): ExpenseCategory[] {
    return this.db.prepare('SELECT * FROM expense_categories ORDER BY name ASC').all() as ExpenseCategory[];
  }

  // Get expense summary by category
  getExpenseSummary(startDate?: string, endDate?: string): any[] {
    let query = `
      SELECT 
        c.name as category_name,
        COUNT(e.expense_id) as count,
        SUM(e.amount) as total
      FROM expense_categories c
      LEFT JOIN expenses e ON c.category_id = e.category_id
    `;

    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE e.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE e.date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' WHERE e.date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY c.category_id, c.name ORDER BY total DESC';

    return this.db.prepare(query).all(...params);
  }

  // Get total expenses for a period
  getTotalExpenses(startDate?: string, endDate?: string): number {
    let query = 'SELECT SUM(amount) as total FROM expenses';
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' WHERE date <= ?';
      params.push(endDate);
    }

    const result = this.db.prepare(query).get(...params) as { total: number | null };
    return result.total || 0;
  }
}
