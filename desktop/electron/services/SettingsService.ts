import Database from 'better-sqlite3';

export interface AppSetting {
  setting_id: number;
  setting_key: string;
  setting_value: string;
  setting_type: 'string' | 'number' | 'boolean' | 'json';
  category: 'company' | 'invoice' | 'application';
  created_at: string;
  updated_at: string;
}

interface SettingInput {
  key: string;
  value: any;
  type?: 'string' | 'number' | 'boolean' | 'json';
  category?: 'company' | 'invoice' | 'application';
}

export class SettingsService {
  constructor(private db: Database.Database) {
    this.initializeSettings();
  }

  private initializeSettings() {
    // Create settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type TEXT DEFAULT 'string',
        category TEXT DEFAULT 'application',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Initialize default settings if table is empty
    const count = this.db.prepare('SELECT COUNT(*) as count FROM app_settings').get() as { count: number };
    
    if (count.count === 0) {
      this.loadDefaultSettings();
    }
  }

  private loadDefaultSettings() {
    const defaults: SettingInput[] = [
      // Company Profile
      { key: 'company.name', value: 'My Company', type: 'string', category: 'company' },
      { key: 'company.address', value: '', type: 'string', category: 'company' },
      { key: 'company.phone', value: '', type: 'string', category: 'company' },
      { key: 'company.email', value: '', type: 'string', category: 'company' },
      { key: 'company.trn', value: '', type: 'string', category: 'company' },
      { key: 'company.logo', value: '', type: 'string', category: 'company' },
      
      // Invoice Settings
      { key: 'invoice.default_vat_rate', value: 5.0, type: 'number', category: 'invoice' },
      { key: 'invoice.default_payment_terms', value: 'Net 30', type: 'string', category: 'invoice' },
      { key: 'invoice.terms_and_conditions', value: '', type: 'string', category: 'invoice' },
      { key: 'invoice.footer_text', value: 'Thank you for your business!', type: 'string', category: 'invoice' },
      { key: 'invoice.number_prefix', value: 'INV', type: 'string', category: 'invoice' },
      
      // Application Settings
      { key: 'app.currency', value: 'AED', type: 'string', category: 'application' },
      { key: 'app.language', value: 'en', type: 'string', category: 'application' },
      { key: 'app.date_format', value: 'YYYY-MM-DD', type: 'string', category: 'application' },
      { key: 'app.theme', value: 'light', type: 'string', category: 'application' },
    ];

    const stmt = this.db.prepare(`
      INSERT INTO app_settings (setting_key, setting_value, setting_type, category, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    for (const setting of defaults) {
      const value = typeof setting.value === 'object' 
        ? JSON.stringify(setting.value) 
        : String(setting.value);
      
      stmt.run(setting.key, value, setting.type || 'string', setting.category || 'application');
    }
  }

  // Get single setting by key
  getSetting(key: string): any {
    const setting = this.db
      .prepare('SELECT * FROM app_settings WHERE setting_key = ?')
      .get(key) as AppSetting | undefined;

    if (!setting) return null;

    return this.parseSettingValue(setting);
  }

  // Get all settings by category
  getSettingsByCategory(category: string): Record<string, any> {
    const settings = this.db
      .prepare('SELECT * FROM app_settings WHERE category = ?')
      .all(category) as AppSetting[];

    const result: Record<string, any> = {};
    settings.forEach(setting => {
      const key = setting.setting_key.replace(`${category}.`, '');
      result[key] = this.parseSettingValue(setting);
    });

    return result;
  }

  // Get all settings
  getAllSettings(): Record<string, any> {
    const settings = this.db
      .prepare('SELECT * FROM app_settings ORDER BY category, setting_key')
      .all() as AppSetting[];

    const result: Record<string, any> = {
      company: {},
      invoice: {},
      application: {},
    };

    settings.forEach(setting => {
      const [category, key] = setting.setting_key.split('.');
      if (result[category]) {
        result[category][key] = this.parseSettingValue(setting);
      }
    });

    return result;
  }

  // Set single setting
  setSetting(key: string, value: any, type?: string, category?: string): { success: boolean; error?: string } {
    try {
      const existingSetting = this.db
        .prepare('SELECT * FROM app_settings WHERE setting_key = ?')
        .get(key) as AppSetting | undefined;

      const settingType = type || existingSetting?.setting_type || this.inferType(value);
      const settingCategory = category || existingSetting?.category || this.inferCategory(key);
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      if (existingSetting) {
        // Update existing
        this.db
          .prepare(`
            UPDATE app_settings 
            SET setting_value = ?, setting_type = ?, category = ?, updated_at = datetime('now')
            WHERE setting_key = ?
          `)
          .run(stringValue, settingType, settingCategory, key);
      } else {
        // Insert new
        this.db
          .prepare(`
            INSERT INTO app_settings (setting_key, setting_value, setting_type, category, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
          `)
          .run(key, stringValue, settingType, settingCategory);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error setting value:', error);
      return { success: false, error: 'Failed to save setting' };
    }
  }

  // Bulk update settings
  updateSettings(settings: Record<string, any>): { success: boolean; error?: string } {
    try {
      const transaction = this.db.transaction(() => {
        for (const [key, value] of Object.entries(settings)) {
          this.setSetting(key, value);
        }
      });

      transaction();
      return { success: true };
    } catch (error: any) {
      console.error('Error updating settings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }

  // Reset to defaults
  resetSettings(): { success: boolean; error?: string } {
    try {
      this.db.exec('DELETE FROM app_settings');
      this.loadDefaultSettings();
      return { success: true };
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      return { success: false, error: 'Failed to reset settings' };
    }
  }

  // Helper: Parse setting value based on type
  private parseSettingValue(setting: AppSetting): any {
    switch (setting.setting_type) {
      case 'number':
        return Number(setting.setting_value);
      case 'boolean':
        return setting.setting_value === 'true';
      case 'json':
        try {
          return JSON.parse(setting.setting_value);
        } catch {
          return null;
        }
      case 'string':
      default:
        return setting.setting_value;
    }
  }

  // Helper: Infer type from value
  private inferType(value: any): 'string' | 'number' | 'boolean' | 'json' {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  // Helper: Infer category from key
  private inferCategory(key: string): 'company' | 'invoice' | 'application' {
    if (key.startsWith('company.')) return 'company';
    if (key.startsWith('invoice.')) return 'invoice';
    return 'application';
  }
}
