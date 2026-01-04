import Database from 'better-sqlite3';
import * as crypto from 'crypto';

export interface AuthService {
  login(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }>;
  signup(username: string, password: string, email?: string): Promise<{ success: boolean; user?: any; error?: string }>;
  hashPassword(password: string): string;
  verifyPassword(password: string, hash: string): boolean;
}

export class LocalAuthService implements AuthService {
  constructor(private db: Database.Database) {}

  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  verifyPassword(password: string, hash: string): boolean {
    const passwordHash = this.hashPassword(password);
    return passwordHash === hash;
  }

  async login(username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
      const user = stmt.get(username);

      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      const isValid = this.verifyPassword(password, (user as any).password_hash);

      if (!isValid) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Remove password hash from returned user object
      const { password_hash, ...userWithoutPassword } = user as any;

      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  async signup(username: string, password: string, email?: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password
      const passwordHash = this.hashPassword(password);

      // Insert new user
      const stmt = this.db.prepare(`
        INSERT INTO users (username, password_hash, email, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(username, passwordHash, email || null);

      // Fetch the created user
      const newUser = this.db.prepare('SELECT * FROM users WHERE user_id = ?').get(result.lastInsertRowid);

      if (!newUser) {
        return { success: false, error: 'Failed to create user' };
      }

      const { password_hash, ...userWithoutPassword } = newUser as any;

      return { success: true, user: userWithoutPassword };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }
}
