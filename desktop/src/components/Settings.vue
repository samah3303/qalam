<template>
  <div class="p-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-sm text-gray-600 mt-1">Manage your company profile and application preferences</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200 mb-6">
      <nav class="flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          <span class="mr-2">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="text-gray-500">Loading settings...</div>
    </div>

    <div v-else>
      <!-- Company Profile Tab -->
      <div v-if="activeTab === 'company'" class="space-y-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input v-model="settings.company.name" class="input-field" placeholder="Enter company name" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea v-model="settings.company.address" rows="3" class="input-field" placeholder="Company address"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input v-model="settings.company.phone" class="input-field" placeholder="+971 XX XXX XXXX" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input v-model="settings.company.email" type="email" class="input-field" placeholder="info@company.com" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">TRN (Tax Registration Number)</label>
              <input v-model="settings.company.trn" class="input-field" placeholder="Enter TRN" />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="resetSettings" class="btn-secondary">Reset to Defaults</button>
          <button @click="saveSettings" :disabled="saving" class="btn-primary">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Invoice Settings Tab -->
      <div v-if="activeTab === 'invoice'" class="space-y-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Invoice Preferences</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Default VAT Rate (%)</label>
              <input v-model.number="settings.invoice.default_vat_rate" type="number" min="0" max="100" step="0.1" class="input-field" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Default Payment Terms</label>
              <input v-model="settings.invoice.default_payment_terms" class="input-field" placeholder="e.g., Net 30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number Prefix</label>
              <input v-model="settings.invoice.number_prefix" class="input-field" placeholder="INV" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
              <textarea v-model="settings.invoice.terms_and_conditions" rows="4" class="input-field" placeholder="Enter invoice terms and conditions"></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <textarea v-model="settings.invoice.footer_text" rows="2" class="input-field" placeholder="Thank you for your business!"></textarea>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="resetSettings" class="btn-secondary">Reset to Defaults</button>
          <button @click="saveSettings" :disabled="saving" class="btn-primary">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Application Settings Tab -->
      <div v-if="activeTab === 'application'" class="space-y-6">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Application Preferences</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select v-model="settings.application.currency" class="input-field">
                <option value="AED">AED (UAE Dirham)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select v-model="settings.application.date_format" class="input-field">
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select v-model="settings.application.language" class="input-field">
                <option value="en">English</option>
                <option value="ar">Arabic (العربية)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="resetSettings" class="btn-secondary">Reset to Defaults</button>
          <button @click="saveSettings" :disabled="saving" class="btn-primary">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const activeTab = ref('company');
const loading = ref(true);
const saving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const tabs = [
  { id: 'company', label: 'Company Profile', icon: '🏢' },
  { id: 'invoice', label: 'Invoice Settings', icon: '📄' },
  { id: 'application', label: 'Application', icon: '⚙️' },
];

const settings = ref({
  company: {
    name: '',
    address: '',
    phone: '',
    email: '',
    trn: '',
    logo: '',
  },
  invoice: {
    default_vat_rate: 5.0,
    default_payment_terms: 'Net 30',
    terms_and_conditions: '',
    footer_text: 'Thank you for your business!',
    number_prefix: 'INV',
  },
  application: {
    currency: 'AED',
    language: 'en',
    date_format: 'YYYY-MM-DD',
    theme: 'light',
  },
});

const loadSettings = async () => {
  loading.value = true;
  try {
    const allSettings = await window.api.settings.getAll();
    settings.value = allSettings as typeof settings.value;
  } catch (error) {
    console.error('Error loading settings:', error);
    errorMessage.value = 'Failed to load settings';
    setTimeout(() => errorMessage.value = '', 3000);
  } finally {
    loading.value = false;
  }
};

const saveSettings = async () => {
  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    // Flatten settings for update
    const flatSettings: Record<string, any> = {};
    for (const [category, values] of Object.entries(settings.value)) {
      for (const [key, value] of Object.entries(values)) {
        flatSettings[`${category}.${key}`] = value;
      }
    }

    const result = await window.api.settings.update(flatSettings);

    if (result.success) {
      successMessage.value = 'Settings saved successfully!';
      setTimeout(() => successMessage.value = '', 3000);
    } else {
      errorMessage.value = result.error || 'Failed to save settings';
      setTimeout(() => errorMessage.value = '', 3000);
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    errorMessage.value = 'An unexpected error occurred';
    setTimeout(() => errorMessage.value = '', 3000);
  } finally {
    saving.value = false;
  }
};

const resetSettings = async () => {
  if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
    return;
  }

  loading.value = true;
  try {
    const result = await window.api.settings.reset();

    if (result.success) {
      await loadSettings();
      successMessage.value = 'Settings reset to defaults';
      setTimeout(() => successMessage.value = '', 3000);
    } else {
      errorMessage.value = result.error || 'Failed to reset settings';
      setTimeout(() => errorMessage.value = '', 3000);
    }
  } catch (error) {
    console.error('Error resetting settings:', error);
    errorMessage.value = 'An unexpected error occurred';
    setTimeout(() => errorMessage.value = '', 3000);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadSettings();
});
</script>
