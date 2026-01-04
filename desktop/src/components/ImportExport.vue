<template>
  <div class="p-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Import & Export</h1>
      <p class="text-sm text-gray-600 mt-1">Export your data and manage database backups</p>
    </div>

    <!-- Export Section -->
    <div class="mb-8">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">📊 Export Data</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Invoices Export -->
        <div class="card">
          <div class="flex items-start gap-3 mb-3">
            <span class="text-3xl">📝</span>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">Invoices</h3>
              <p class="text-sm text-gray-600">Export all or filtered invoices</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="exportData('invoices', 'csv')" class="btn-secondary text-sm flex-1">
              CSV
            </button>
            <button @click="exportData('invoices', 'excel')" class="btn-primary text-sm flex-1">
              Excel
            </button>
          </div>
        </div>

        <!-- Expenses Export -->
        <div class="card">
          <div class="flex items-start gap-3 mb-3">
            <span class="text-3xl">💸</span>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">Expenses</h3>
              <p class="text-sm text-gray-600">Export expense records</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="exportData('expenses', 'csv')" class="btn-secondary text-sm flex-1">
              CSV
            </button>
            <button @click="exportData('expenses', 'excel')" class="btn-primary text-sm flex-1">
              Excel
            </button>
          </div>
        </div>

        <!-- Customers Export -->
        <div class="card">
          <div class="flex items-start gap-3 mb-3">
            <span class="text-3xl">👥</span>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">Customers</h3>
              <p class="text-sm text-gray-600">Export customer database</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="exportData('customers', 'csv')" class="btn-secondary text-sm flex-1">
              CSV
            </button>
            <button @click="exportData('customers', 'excel')" class="btn-primary text-sm flex-1">
              Excel
            </button>
          </div>
        </div>

        <!-- Products Export -->
        <div class="card">
          <div class="flex items-start gap-3 mb-3">
            <span class="text-3xl">📦</span>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">Products</h3>
              <p class="text-sm text-gray-600">Export product catalog</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="exportData('products', 'csv')" class="btn-secondary text-sm flex-1">
              CSV
            </button>
            <button @click="exportData('products', 'excel')" class="btn-primary text-sm flex-1">
              Excel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backup Section -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-4">💾 Database Backup</h2>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Create Backup Card -->
        <div class="card">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-3xl">⬇️</span>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 mb-1">Create Backup</h3>
              <p class="text-sm text-gray-600">Create a complete backup of your database</p>
            </div>
          </div>
          <button @click="createBackup" :disabled="creatingBackup" class="btn-primary w-full">
            {{ creatingBackup ? 'Creating Backup...' : 'Create Backup Now' }}
          </button>
          <p class="text-xs text-gray-500 mt-2">
            Backup will be saved to: Documents/Qalam Backups
          </p>
        </div>

        <!-- Restore Backup Card -->
        <div class="card">
          <div class="flex items-start gap-3 mb-4">
            <span class="text-3xl">⬆️</span>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 mb-1">Restore Backup</h3>
              <p class="text-sm text-gray-600">Restore from a previous backup</p>
            </div>
          </div>
          <button @click="loadBackups" class="btn-secondary w-full mb-3">
            Browse Backups
          </button>
          
          <!-- Backup List -->
          <div v-if="backups.length > 0" class="mt-4 space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="backup in backups"
              :key="backup.path"
              class="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ backup.filename }}</p>
                <p class="text-xs text-gray-500">
                  {{ formatDate(backup.created) }} • {{ formatSize(backup.size) }}
                </p>
              </div>
              <button
                @click="restoreBackup(backup.path)"
                class="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Restore
              </button>
            </div>
          </div>
          <p v-else-if="backupsLoaded" class="text-sm text-gray-500 mt-2">No backups found</p>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const creatingBackup = ref(false);
const backups = ref<any[]>([]);
const backupsLoaded = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const exportData = async (type: 'invoices' | 'expenses' | 'customers' | 'products', format: 'csv' | 'excel') => {
  try {
    let data: any;
    
    if (type === 'invoices') {
      data = await window.api.export.invoices(format);
    } else if (type === 'expenses') {
      data = await window.api.export.expenses(format);
    } else if (type === 'customers') {
      data = await window.api.export.customers(format);
    } else if (type === 'products') {
      data = await window.api.export.products(format);
    }

    // Trigger download
    downloadFile(data, `${type}-export-${new Date().toISOString().split('T')[0]}`, format);
    
    successMessage.value = `${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`;
    setTimeout(() => successMessage.value = '', 3000);
  } catch (error) {
    console.error('Export error:', error);
    errorMessage.value = 'Failed to export data. Please try again.';
    setTimeout(() => errorMessage.value = '', 3000);
  }
};

const downloadFile = (data: any, filename: string, format: 'csv' | 'excel') => {
  const blob = format === 'csv' 
    ? new Blob([data], { type: 'text/csv' })
    : new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${format === 'csv' ? 'csv' : 'xlsx'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const createBackup = async () => {
  if (!confirm('Create a backup of your database? This may take a moment.')) {
    return;
  }

  creatingBackup.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const result = await window.api.backup.create();

    if (result.success) {
      successMessage.value = `Backup created successfully! Saved to: ${result.path}`;
      setTimeout(() => successMessage.value = '', 5000);
      
      // Reload backups list
      if (backupsLoaded.value) {
        await loadBackups();
      }
    } else {
      errorMessage.value = result.error || 'Failed to create backup';
      setTimeout(() => errorMessage.value = '', 3000);
    }
  } catch (error) {
    console.error('Backup error:', error);
    errorMessage.value = 'An unexpected error occurred';
    setTimeout(() => errorMessage.value = '', 3000);
  } finally {
    creatingBackup.value = false;
  }
};

const loadBackups = async () => {
  try {
    backups.value = await window.api.backup.list();
    backupsLoaded.value = true;
  } catch (error) {
    console.error('Error loading backups:', error);
    errorMessage.value = 'Failed to load backups';
    setTimeout(() => errorMessage.value = '', 3000);
  }
};

const restoreBackup = async (backupPath: string) => {
  if (!confirm('⚠️ WARNING: Restoring will replace ALL current data with the backup. This cannot be undone. A backup of your current data will be created first. Continue?')) {
    return;
  }

  try {
    const result = await window.api.backup.restore(backupPath);

    if (result.success) {
      successMessage.value = 'Backup restored successfully! Please restart the application.';
      setTimeout(() => {
        successMessage.value = '';
        alert('Backup restored! Please close and reopen Qalam to see the restored data.');
      }, 2000);
    } else {
      errorMessage.value = result.error || 'Failed to restore backup';
      setTimeout(() => errorMessage.value = '', 3000);
    }
  } catch (error) {
    console.error('Restore error:', error);
    errorMessage.value = 'An unexpected error occurred';
    setTimeout(() => errorMessage.value = '', 3000);
  }
};

const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
</script>
