<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Add Customer</h1>
        <p class="text-sm text-gray-600 mt-1">Create a new customer</p>
      </div>
      <div class="flex gap-2">
        <button @click="emit('cancel')" class="btn-secondary">Cancel</button>
        <button @click="handleSubmit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Saving...' : 'Save Customer' }}
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {{ errorMessage }}
    </div>

    <!-- Form -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
      <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input v-model="form.name" required class="input-field" placeholder="Customer name" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input v-model="form.company_name" class="input-field" placeholder="Optional" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input v-model="form.email" type="email" class="input-field" placeholder="email@example.com" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input v-model="form.phone" class="input-field" placeholder="+971 XX XXX XXXX" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">TRN (Tax Registration Number)</label>
          <input v-model="form.trn" class="input-field" placeholder="Optional" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea v-model="form.address" rows="3" class="input-field" placeholder="Complete address"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
          <input v-model="form.payment_terms" class="input-field" placeholder="e.g., Net 30" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Credit Limit (AED)</label>
          <input v-model.number="form.credit_limit" type="number" min="0" step="0.01" class="input-field" placeholder="0.00" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
          <input v-model="form.contact_person" class="input-field" placeholder="Optional" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea v-model="form.notes" rows="3" class="input-field" placeholder="Additional information"></textarea>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  cancel: [];
  success: [];
}>();

const form = ref({
  name: '',
  company_name: '',
  email: '',
  phone: '',
  address: '',
  trn: '',
  payment_terms: '',
  credit_limit: 0,
  contact_person: '',
  notes: '',
});

const loading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!form.value.name.trim()) {
    errorMessage.value = 'Customer name is required';
    return;
  }

  loading.value = true;

  try {
    // ✅ FIX: Convert Vue reactive proxy to plain object for IPC
    const plainData = {
      name: form.value.name,
      email: form.value.email || undefined,
      phone: form.value.phone || undefined,
      address: form.value.address || undefined,
      company_name: form.value.company_name || undefined,
      trn: form.value.trn || undefined,
      credit_limit: form.value.credit_limit || 0,
      payment_terms: form.value.payment_terms || undefined,
      contact_person: form.value.contact_person || undefined,
      notes: form.value.notes || undefined,
    };

    const result = await window.api.customer.create(plainData);

    if (result.success) {
      emit('success');
    } else {
      errorMessage.value = result.error || 'Failed to create customer';
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    errorMessage.value = 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
};
</script>
