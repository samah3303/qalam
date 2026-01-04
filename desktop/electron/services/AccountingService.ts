import Database from 'better-sqlite3';

export interface JournalEntry {
  entry_id: number;
  entry_date: string;
  description: string;
  reference?: string;
  created_at: string;
}

export interface JournalLine {
  line_id: number;
  entry_id: number;
  account_id: number;
  debit: number;
  credit: number;
  description?: string;
}

export class AccountingService {
  constructor(private db: Database.Database) {
    this.initializeAccountingTables();
  }

  private initializeAccountingTables() {
    // Create journal entries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date DATE NOT NULL,
        description TEXT NOT NULL,
        reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create journal lines table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS journal_lines (
        line_id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        description TEXT,
        FOREIGN KEY (entry_id) REFERENCES journal_entries(entry_id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES chart_of_accounts(account_id)
      )
    `);

    // Add default chart of accounts if empty
    const count = this.db.prepare('SELECT COUNT(*) as count FROM chart_of_accounts').get() as { count: number };
    
    if (count.count === 0) {
      const defaultAccounts = [
        // Assets (1000-1999)
        { code: '1000', name: 'Cash', type: 'Asset', parent_account_id: null },
        { code: '1100', name: 'Bank Account', type: 'Asset', parent_account_id: null },
        { code: '1200', name: 'Accounts Receivable', type: 'Asset', parent_account_id: null },
        { code: '1300', name: 'Inventory', type: 'Asset', parent_account_id: null },
        { code: '1400', name: 'Equipment', type: 'Asset', parent_account_id: null },
        
        // Liabilities (2000-2999)
        { code: '2000', name: 'Accounts Payable', type: 'Liability', parent_account_id: null },
        { code: '2100', name: 'Loans Payable', type: 'Liability', parent_account_id: null },
        { code: '2200', name: 'VAT Payable', type: 'Liability', parent_account_id: null },
        
        // Equity (3000-3999)
        { code: '3000', name: 'Owner\'s Equity', type: 'Equity', parent_account_id: null },
        { code: '3100', name: 'Retained Earnings', type: 'Equity', parent_account_id: null },
        
        // Revenue (4000-4999)
        { code: '4000', name: 'Sales Revenue', type: 'Revenue', parent_account_id: null },
        { code: '4100', name: 'Service Revenue', type: 'Revenue', parent_account_id: null },
        
        // Expenses (5000-5999)
        { code: '5000', name: 'Rent Expense', type: 'Expense', parent_account_id: null },
        { code: '5100', name: 'Salary Expense', type: 'Expense', parent_account_id: null },
        { code: '5200', name: 'Utilities Expense', type: 'Expense', parent_account_id: null },
        { code: '5300', name: 'Supplies Expense', type: 'Expense', parent_account_id: null },
        { code: '5400', name: 'Marketing Expense', type: 'Expense', parent_account_id: null },
      ];

      const stmt = this.db.prepare(`
        INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `);

      for (const account of defaultAccounts) {
        stmt.run(account.code, account.name, account.type, account.parent_account_id);
      }
    }
  }

  // Create journal entry with lines
  createJournalEntry(
    entryDate: string,
    description: string,
    lines: Array<{ accountId: number; debit: number; credit: number; description?: string }>,
    reference?: string
  ): { success: boolean; entry?: any; error?: string } {
    try {
      // Validate balanced entry
      const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        return { success: false, error: 'Journal entry must be balanced (debits = credits)' };
      }

      // Insert journal entry
      const entryStmt = this.db.prepare(`
        INSERT INTO journal_entries (entry_date, description, reference, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `);

      const entryResult = entryStmt.run(entryDate, description, reference || null);
      const entryId = entryResult.lastInsertRowid;

      // Insert journal lines
      const lineStmt = this.db.prepare(`
        INSERT INTO journal_lines (entry_id, account_id, debit, credit, description)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const line of lines) {
        lineStmt.run(entryId, line.accountId, line.debit, line.credit, line.description || null);
      }

      // Fetch created entry with lines
      const entry = this.getJournalEntryById(Number(entryId));

      return { success: true, entry };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return { success: false, error: 'Failed to create journal entry' };
    }
  }

  // Get journal entry by ID
  getJournalEntryById(entryId: number): any {
    const entry = this.db.prepare('SELECT * FROM journal_entries WHERE entry_id = ?').get(entryId);
    
    if (!entry) return null;

    const lines = this.db.prepare(`
      SELECT jl.*, coa.account_name, coa.account_code
      FROM journal_lines jl
      LEFT JOIN chart_of_accounts coa ON jl.account_id = coa.account_id
      WHERE jl.entry_id = ?
    `).all(entryId);

    return { ...entry, lines };
  }

  // List journal entries
  listJournalEntries(limit = 50, offset = 0): any[] {
    return this.db.prepare(`
      SELECT je.*, 
             (SELECT SUM(debit) FROM journal_lines WHERE entry_id = je.entry_id) as total_debit
      FROM journal_entries je
      ORDER BY je.entry_date DESC, je.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  }

  // Get general ledger
  getGeneralLedger(accountId?: number, startDate?: string, endDate?: string): any[] {
    let query = `
      SELECT jl.*, je.entry_date, je.description as entry_description, je.reference,
             coa.account_name, coa.account_code, coa.account_type
      FROM journal_lines jl
      JOIN journal_entries je ON jl.entry_id = je.entry_id
      JOIN chart_of_accounts coa ON jl.account_id = coa.account_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (accountId) {
      query += ' AND jl.account_id = ?';
      params.push(accountId);
    }

    if (startDate) {
      query += ' AND je.entry_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND je.entry_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY je.entry_date DESC, jl.line_id DESC';

    return this.db.prepare(query).all(...params);
  }

  // Get chart of accounts
  getChartOfAccounts(): any[] {
    return this.db.prepare(`
      SELECT * FROM chart_of_accounts
      ORDER BY account_code ASC
    `).all();
  }

  // Get trial balance
  getTrialBalance(asOfDate?: string): any[] {
    let query = `
      SELECT coa.account_id, coa.account_code, coa.account_name, coa.account_type,
             COALESCE(SUM(jl.debit), 0) as total_debit,
             COALESCE(SUM(jl.credit), 0) as total_credit,
             COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) as balance
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON coa.account_id = jl.account_id
      LEFT JOIN journal_entries je ON jl.entry_id = je.entry_id
    `;

    const params: any[] = [];

    if (asOfDate) {
      query += ' WHERE je.entry_date <= ?';
      params.push(asOfDate);
    }

    query += ' GROUP BY coa.account_id ORDER BY coa.account_code';

    return this.db.prepare(query).all(...params);
  }

  // Get P&L statement
  getProfitAndLoss(startDate: string, endDate: string): any {
    const revenue = this.db.prepare(`
      SELECT coa.account_name, coa.account_code,
             COALESCE(SUM(jl.credit - jl.debit), 0) as amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON coa.account_id = jl.account_id
      LEFT JOIN journal_entries je ON jl.entry_id = je.entry_id
      WHERE coa.account_type = 'Revenue'
        AND je.entry_date BETWEEN ? AND ?
      GROUP BY coa.account_id
      ORDER BY coa.account_code
    `).all(startDate, endDate);

    const expenses = this.db.prepare(`
      SELECT coa.account_name, coa.account_code,
             COALESCE(SUM(jl.debit - jl.credit), 0) as amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON coa.account_id = jl.account_id
      LEFT JOIN journal_entries je ON jl.entry_id = je.entry_id
      WHERE coa.account_type = 'Expense'
        AND je.entry_date BETWEEN ? AND ?
      GROUP BY coa.account_id
      ORDER BY coa.account_code
    `).all(startDate, endDate);

    const totalRevenue = revenue.reduce((sum: number, item: any) => sum + item.amount, 0);
    const totalExpenses = expenses.reduce((sum: number, item: any) => sum + item.amount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome,
      startDate,
      endDate,
    };
  }

  // Get balance sheet
  getBalanceSheet(asOfDate: string): any {
    const assets = this.db.prepare(`
      SELECT coa.account_name, coa.account_code,
             COALESCE(SUM(jl.debit - jl.credit), 0) as amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON coa.account_id = jl.account_id
      LEFT JOIN journal_entries je ON jl.entry_id = je.entry_id
      WHERE coa.account_type = 'Asset'
        AND je.entry_date <= ?
      GROUP BY coa.account_id
      ORDER BY coa.account_code
    `).all(asOfDate);

    const liabilities = this.db.prepare(`
      SELECT coa.account_name, coa.account_code,
             COALESCE(SUM(jl.credit - jl.debit), 0) as amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON coa.account_id = jl.account_id
      LEFT JOIN journal_entries je ON jl.entry_id = je.entry_id
      WHERE coa.account_type = 'Liability'
        AND je.entry_date <= ?
      GROUP BY coa.account_id
      ORDER BY coa.account_code
    `).all(asOfDate);

    const equity = this.db.prepare(`
      SELECT coa.account_name, coa.account_code,
             COALESCE(SUM(jl.credit - jl.debit), 0) as amount
      FROM chart_of_accounts coa
      LEFT JOIN journal_lines jl ON coa.account_id = jl.account_id
      LEFT JOIN journal_entries je ON jl.entry_id = je.entry_id
      WHERE coa.account_type = 'Equity'
        AND je.entry_date <= ?
      GROUP BY coa.account_id
      ORDER BY coa.account_code
    `).all(asOfDate);

    const totalAssets = assets.reduce((sum: number, item: any) => sum + item.amount, 0);
    const totalLiabilities = liabilities.reduce((sum: number, item: any) => sum + item.amount, 0);
    const totalEquity = equity.reduce((sum: number, item: any) => sum + item.amount, 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      asOfDate,
    };
  }

  // Get Cash Flow Statement
  getCashFlowStatement(startDate: string, endDate: string): any {
    // Get all invoices (revenue)
    const invoiceRevenue = this.db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as amount
      FROM invoices
      WHERE status IN ('paid', 'sent')
        AND invoice_date BETWEEN ? AND ?
    `).get(startDate, endDate) as { amount: number };

    // Get all expenses
    const expenseTotal = this.db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as amount
      FROM expenses
      WHERE date BETWEEN ? AND ?
    `).get(startDate, endDate) as { amount: number };

    const netOperatingCash = invoiceRevenue.amount - expenseTotal.amount;

    return {
      operatingActivities: {
        cashFromRevenue: invoiceRevenue.amount,
        cashFromExpenses: -expenseTotal.amount,
        net: netOperatingCash,
      },
      investingActivities: {
        net: 0, // TODO: Implement when asset purchases are tracked
      },
      financingActivities: {
        net: 0, // TODO: Implement when loans/capital are tracked
      },
      netCashFlow: netOperatingCash,
      startDate,
      endDate,
    };
  }

  // Get VAT Report
  getVATReport(startDate: string, endDate: string): any {
    // Sales (invoices) with VAT
    const sales = this.db.prepare(`
      SELECT 
        COALESCE(SUM(subtotal), 0) as taxable,
        COALESCE(SUM(tax_amount), 0) as vat,
        COALESCE(SUM(total_amount), 0) as total
      FROM invoices
      WHERE invoice_date BETWEEN ? AND ?
        AND status != 'cancelled'
    `).get(startDate, endDate) as { taxable: number; vat: number; total: number };

    // Purchases (expenses) - assuming 5% VAT on expenses
    const expenses = this.db.prepare(`
      SELECT 
        COALESCE(SUM(amount / 1.05), 0) as taxable,
        COALESCE(SUM(amount - (amount / 1.05)), 0) as vat,
        COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date BETWEEN ? AND ?
    `).get(startDate, endDate) as { taxable: number; vat: number; total: number };

    const netVAT = sales.vat - expenses.vat;

    // Get detailed transactions
    const salesTransactions = this.db.prepare(`
      SELECT invoice_number as reference, invoice_date as date, 
             subtotal as taxable, tax_amount as vat, total_amount as total, 'Sale' as type
      FROM invoices
      WHERE invoice_date BETWEEN ? AND ?
        AND status != 'cancelled'
      ORDER BY invoice_date DESC
    `).all(startDate, endDate);

    const expenseTransactions = this.db.prepare(`
      SELECT description as reference, date, 
             amount / 1.05 as taxable, amount - (amount / 1.05) as vat, amount as total, 'Purchase' as type
      FROM expenses
      WHERE date BETWEEN ? AND ?
      ORDER BY date DESC
    `).all(startDate, endDate);

    return {
      sales,
      purchases: expenses,
      netVAT,
      transactions: [...salesTransactions, ...expenseTransactions],
      startDate,
      endDate,
    };
  }
}
