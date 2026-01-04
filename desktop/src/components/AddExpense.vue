<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Add Expense</h1>
        <p class="text-sm text-gray-600 mt-1">Record a new expense</p>
      </div>
      <div class="flex gap-2">
        <button @click="emit('cancel')" class="btn-secondary">Cancel</button>
        <button @click="handleSubmit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Saving...' : 'Save Expense' }}
        </button>
      </div>
    </div>
      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {{ errorMessage }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
        {{ successMessage }}
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Expense Details</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input v-model="expenseDate" type="date" required class="input-field" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select v-model="selectedCategoryId" required class="input-field">
                <option value="">Select category...</option>
                <option v-for="category in categories" :key="category.category_id" :value="category.category_id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount (AED) *</label>
              <input
                v-model.number="amount"
                type="number"
                min="0"
                step="0.01"
                required
                class="input-field"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Vendor/Supplier</label>
              <input v-model="vendor" type="text" class="input-field" placeholder="Optional" />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                v-model="description"
                rows="3"
                required
                class="input-field"
                placeholder="Enter expense description..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select v-model="paymentMethod" class="input-field">
                <option value="">Select...</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Check">Check</option>
              </select>
            </div>
          </div>
        </form>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const emit = defineEmits<{
  cancel: [];
  success: [];
}>();

// State
const expenseDate = ref(new Date().toISOString().split('T')[0]);
const selectedCategoryId = ref('');
const amount = ref(0);
const description = ref('');
const vendor = ref('');
const paymentMethod = ref('');
const categories = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Methods
const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validation
  if (!selectedCategoryId.value || !amount.value || !description.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  if (amount.value <= 0) {
    errorMessage.value = 'Amount must be greater than zero';
    return;
  }

  loading.value = true;

  try {
    const result = await window.api.expense.create(
      expenseDate.value,
      parseInt(selectedCategoryId.value),
      amount.value,
      description.value,
      vendor.value || undefined,
      paymentMethod.value || undefined
    );

    if (result.success) {
      successMessage.value = 'Expense saved successfully!';
      setTimeout(() => {
        emit('success');
      }, 1000);
    } else {
      errorMessage.value = result.error || 'Failed to save expense';
    }
  } catch (error) {
    console.error('Error saving expense:', error);
    errorMessage.value = 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
};

// Load categories on mount
onMounted(async () => {
  try {
    categories.value = await window.api.expense.getCategories();
  } catch (error) {
    console.error('Error loading categories:', error);
    errorMessage.value = 'Failed to load expense categories';
  }
});
</script>
