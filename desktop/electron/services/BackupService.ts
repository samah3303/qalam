import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { app } from 'electron';

export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created: Date;
}

export class BackupService {
  private dbPath: string;

  constructor(private db: Database.Database) {
    // Get the database file path
    this.dbPath = (db as any).name || path.join(app.getPath('userData'), 'qalam.db');
  }

  // Create database backup
  async createBackup(destination?: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Default backup location
      const backupDir = destination || path.join(app.getPath('documents'), 'Qalam Backups');
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupFilename = `qalam-backup-${timestamp}.qdb`;
      const backupPath = path.join(backupDir, backupFilename);

      // Create ZIP archive
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          resolve({
            success: true,
            path: backupPath,
          });
        });

        archive.on('error', (err) => {
          reject(err);
        });

        // Pipe archive to output file
        archive.pipe(output);

        // Add database file to archive
        archive.file(this.dbPath, { name: 'database.db' });

        // Add metadata
        const metadata = {
          version: '1.0.0',
          created: new Date().toISOString(),
          app: 'Qalam Accounting',
        };
        archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

        // Finalize the archive
        archive.finalize();
      });
    } catch (error: any) {
      console.error('Error creating backup:', error);
      return {
        success: false,
        error: 'Failed to create backup. Please try again.',
      };
    }
  }

  // Restore database from backup
  async restoreBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate backup file exists
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup file not found' };
      }

      // Create backup of current database before restore
      const currentBackupResult = await this.createBackup();
      if (!currentBackupResult.success) {
        return { success: false, error: 'Failed to backup current database before restore' };
      }

      // Close current database connection
      this.db.close();

      // Extract backup
      const tempDir = path.join(app.getPath('temp'), 'qalam-restore');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      await fs.createReadStream(backupPath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .promise();

      // Copy restored database to original location
      const restoredDbPath = path.join(tempDir, 'database.db');
      if (fs.existsSync(restoredDbPath)) {
        fs.copyFileSync(restoredDbPath, this.dbPath);
        
        // Clean up temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });

        return {
          success: true,
        };
      } else {
        return { success: false, error: 'Invalid backup file' };
      }
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      return {
        success: false,
        error: 'Failed to restore backup. Please try again.',
      };
    }
  }

  // List available backups
  listBackups(directory?: string): BackupInfo[] {
    try {
      const backupDir = directory || path.join(app.getPath('documents'), 'Qalam Backups');

      if (!fs.existsSync(backupDir)) {
        return [];
      }

      const files = fs.readdirSync(backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (file.endsWith('.qdb')) {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);

          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
          });
        }
      }

      // Sort by creation date, newest first
      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  // Validate backup file
  async validateBackup(backupPath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!fs.existsSync(backupPath)) {
        return { valid: false, error: 'File not found' };
      }

      // Check if it's a valid ZIP file
      const directory = await unzipper.Open.file(backupPath);
      const hasDatabase = directory.files.some((f: any) => f.path === 'database.db');

      if (!hasDatabase) {
        return { valid: false, error: 'Invalid backup file: missing database' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid backup file format' };
    }
  }
}
