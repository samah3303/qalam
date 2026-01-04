import Database from 'better-sqlite3';

export interface Product {
  product_id: number;
  name: string;
  sku?: string;
  description?: string;
  unit_price: number;
  cost_price?: number;
  category?: string;
  unit_of_measure: string;
  tax_rate: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  movement_id: number;
  product_id: number;
  movement_type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: string;
}

export class InventoryService {
  constructor(private db: Database.Database) {
    this.initializeInventoryExtensions();
  }

  private initializeInventoryExtensions() {
    // Create products table (modern schema)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        description TEXT,
        unit_price REAL NOT NULL DEFAULT 0,
        cost_price REAL,
        category TEXT,
        unit_of_measure TEXT DEFAULT 'unit',
        tax_rate REAL DEFAULT 5.0,
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 10,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create stock movements table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        movement_type TEXT CHECK(movement_type IN ('IN', 'OUT', 'ADJUST')),
        quantity INTEGER NOT NULL,
        reference_type TEXT,
        reference_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      )
    `);
  }

  // Get all products
  getProducts(activeOnly = false, limit = 50, offset = 0): Product[] {
    // ✅ FIX: Add pagination limit (max 1000)
    const safeLimit = Math.min(limit, 1000);
    let query = 'SELECT * FROM products';
    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    return this.db.prepare(query).all(safeLimit, offset) as Product[];
  }

  // Get product by ID
  getProductById(productId: number): Product | null {
    return this.db
      .prepare('SELECT * FROM products WHERE product_id = ?')
      .get(productId) as Product | null;
  }

  // Create product
  createProduct(data: {
    name: string;
    sku?: string;
    description?: string;
    unit_price: number;
    cost_price?: number;
    category?: string;
    unit_of_measure?: string;
    tax_rate?: number;
    stock_quantity?: number;
    low_stock_threshold?: number;
  }): { success: boolean; product?: Product; error?: string } {
    try {
      // Validation
      if (!data.name || data.name.trim().length === 0) {
        return { success: false, error: 'Product name is required' };
      }

      if (data.unit_price < 0) {
        return { success: false, error: 'Unit price must be positive' };
      }

      // Auto-generate SKU if not provided
      const sku = data.sku || this.generateSKU(data.name);

      const stmt = this.db.prepare(`
        INSERT INTO products (
          name, sku, description, unit_price, cost_price, category,
          unit_of_measure, tax_rate, stock_quantity, low_stock_threshold,
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(
        data.name.trim(),
        sku,
        data.description?.trim() || null,
        data.unit_price,
        data.cost_price || null,
        data.category?.trim() || null,
        data.unit_of_measure || 'unit',
        data.tax_rate !== undefined ? data.tax_rate : 5.0,
        data.stock_quantity || 0,
        data.low_stock_threshold !== undefined ? data.low_stock_threshold : 10
      );

      // Record initial stock if any
      if (data.stock_quantity && data.stock_quantity > 0) {
        this.recordStockMovement(
          Number(result.lastInsertRowid),
          'IN',
          data.stock_quantity,
          null,
          null,
          'Initial stock'
        );
      }

      const product = this.getProductById(Number(result.lastInsertRowid));
      return { success: true, product: product! };
    } catch (error: any) {
      console.error('Error creating product:', error);

      if (error.code === 'SQLITE_CONSTRAINT') {
        return { success: false, error: 'A product with this SKU already exists' };
      }

      return {
        success: false,
        error: 'Failed to create product. Please try again.',
      };
    }
  }

  // Update product
  updateProduct(
    productId: number,
    data: Partial<Product>
  ): { success: boolean; product?: Product; error?: string } {
    try {
      const stmt = this.db.prepare(`
        UPDATE products
        SET name = COALESCE(?, name),
            sku = COALESCE(?, sku),
            description = ?,
            unit_price = COALESCE(?, unit_price),
            cost_price = ?,
            category = ?,
            unit_of_measure = COALESCE(?, unit_of_measure),
            tax_rate = COALESCE(?, tax_rate),
            low_stock_threshold = COALESCE(?, low_stock_threshold),
            is_active = COALESCE(?, is_active),
            updated_at = datetime('now')
        WHERE product_id = ?
      `);

      stmt.run(
        data.name?.trim() || null,
        data.sku?.trim() || null,
        data.description?.trim() || null,
        data.unit_price !== undefined ? data.unit_price : null,
        data.cost_price !== undefined ? data.cost_price : null,
        data.category?.trim() || null,
        data.unit_of_measure || null,
        data.tax_rate !== undefined ? data.tax_rate : null,
        data.low_stock_threshold !== undefined ? data.low_stock_threshold : null,
        data.is_active !== undefined ? data.is_active : null,
        productId
      );

      const product = this.getProductById(productId);
      return { success: true, product: product! };
    } catch (error: any) {
      console.error('Error updating product:', error);
      return { success: false, error: 'Failed to update product. Please try again.' };
    }
  }

  // Delete product
  deleteProduct(productId: number): { success: boolean; error?: string } {
    try {
      // Soft delete
      this.db
        .prepare('UPDATE products SET is_active = 0, updated_at = datetime(\'now\') WHERE product_id = ?')
        .run(productId);

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting product:', error);
      return { success: false, error: 'Failed to delete product. Please try again.' };
    }
  }

  // Search products
  searchProducts(query: string): Product[] {
    const searchTerm = `%${query}%`;
    return this.db.prepare(`
      SELECT * FROM products
      WHERE (name LIKE ? OR sku LIKE ? OR category LIKE ?)
        AND is_active = 1
      ORDER BY name ASC
    `).all(searchTerm, searchTerm, searchTerm) as Product[];
  }

  // Get low stock products
  getLowStockProducts(): Product[] {
    return this.db.prepare(`
      SELECT * FROM products
      WHERE stock_quantity <= low_stock_threshold
        AND is_active = 1
      ORDER BY stock_quantity ASC
    `).all() as Product[];
  }

  // Adjust stock
  adjustStock(
    productId: number,
    quantity: number,
    type: 'IN' | 'OUT' | 'ADJUST',
    referenceType?: string,
    referenceId?: number,
    notes?: string
  ): { success: boolean; product?: Product; error?: string } {
    try {
      const product = this.getProductById(productId);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // ✅ FIX: Use atomic SQL UPDATE to prevent race conditions
      let updateQuery: string;
      let queryParams: any[];

      if (type === 'IN') {
        updateQuery = 'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = datetime(\'now\') WHERE product_id = ?';
        queryParams = [quantity, productId];
      } else if (type === 'OUT') {
        // Check stock availability first
        if (product.stock_quantity < quantity) {
          return { success: false, error: 'Insufficient stock' };
        }
        updateQuery = 'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime(\'now\') WHERE product_id = ? AND stock_quantity >= ?';
        queryParams = [quantity, productId, quantity];
      } else if (type === 'ADJUST') {
        updateQuery = 'UPDATE products SET stock_quantity = ?, updated_at = datetime(\'now\') WHERE product_id = ?';
        queryParams = [quantity, productId];
      } else {
        return { success: false, error: 'Invalid adjustment type' };
      }

      const result = this.db.prepare(updateQuery).run(...queryParams);

      // Check if update succeeded
      if (result.changes === 0 && type === 'OUT') {
        return { success: false, error: 'Insufficient stock (concurrent modification)' };
      }

      // Record movement
      this.recordStockMovement(productId, type, quantity, referenceType, referenceId, notes);

      const updatedProduct = this.getProductById(productId);
      return { success: true, product: updatedProduct! };
    } catch (error: any) {
      console.error('Error adjusting stock:', error);
      return { success: false, error: 'Failed to adjust stock. Please try again.' };
    }
  }

  // Get stock movements
  getStockMovements(productId: number, limit = 50): StockMovement[] {
    return this.db.prepare(`
      SELECT * FROM stock_movements
      WHERE product_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(productId, limit) as StockMovement[];
  }

  // Helper: Record stock movement
  private recordStockMovement(
    productId: number,
    type: 'IN' | 'OUT' | 'ADJUST',
    quantity: number,
    referenceType?: string | null,
    referenceId?: number | null,
    notes?: string | null
  ) {
    this.db.prepare(`
      INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(productId, type, quantity, referenceType, referenceId, notes);
  }

  // Helper: Generate SKU
  private generateSKU(name: string): string {
    const prefix = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }
}
