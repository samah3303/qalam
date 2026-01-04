<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Add Product</h1>
        <p class="text-sm text-gray-600 mt-1">Create a new product</p>
      </div>
      <div class="flex gap-2">
        <button @click="emit('cancel')" class="btn-secondary">Cancel</button>
        <button @click="handleSubmit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Saving...' : 'Save Product' }}
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
      {{ errorMessage }}
    </div>

    <!-- Form -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="card">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
          <form @submit.prevent="handleSubmit" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input v-model="form.name" required class="input-field" placeholder="Enter product name" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input v-model="form.sku" class="input-field" placeholder="Auto-generated if empty" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input v-model="form.category" class="input-field" list="categories" placeholder="e.g., Electronics" />
              <datalist id="categories">
                <option value="Electronics" />
                <option value="Furniture" />
                <option value="Stationery" />
                <option value="Food & Beverage" />
                <option value="Clothing" />
              </datalist>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" rows="3" class="input-field" placeholder="Product description"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Unit Price (AED) *</label>
              <input v-model.number="form.unit_price" type="number" min="0" step="0.01" required class="input-field" placeholder="0.00" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price (AED)</label>
              <input v-model.number="form.cost_price" type="number" min="0" step="0.01" class="input-field" placeholder="0.00" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <input v-model="form.unit_of_measure" class="input-field" placeholder="unit, kg, liter, etc." />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
              <input v-model.number="form.tax_rate" type="number" min="0" max="100" step="0.01" class="input-field" placeholder="5.0" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Initial Stock Quantity</label>
              <input v-model.number="form.stock_quantity" type="number" min="0" class="input-field" placeholder="0" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input v-model.number="form.low_stock_threshold" type="number" min="0" class="input-field" placeholder="10" />
            </div>
          </form>
        </div>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-1">
        <div class="card sticky top-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Unit Price:</span>
              <span class="font-medium">AED {{ form.unit_price.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Tax Rate:</span>
              <span class="font-medium">{{ form.tax_rate }}%</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Price incl. Tax:</span>
              <span class="font-medium">AED {{ (form.unit_price * (1 + form.tax_rate / 100)).toFixed(2) }}</span>
            </div>
            <div class="border-t pt-3 flex justify-between text-sm">
              <span class="text-gray-600">Initial Stock:</span>
              <span class="font-semibold">{{ form.stock_quantity }} {{ form.unit_of_measure }}</span>
            </div>
          </div>
        </div>
      </div>
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
  sku: '',
  description: '',
  unit_price: 0,
  cost_price: 0,
  category: '',
  unit_of_measure: 'unit',
  tax_rate: 5.0,
  stock_quantity: 0,
  low_stock_threshold: 10,
});

const loading = ref(false);
const errorMessage = ref('');

const handleSubmit = async () => {
  errorMessage.value = '';

  if (!form.value.name.trim()) {
    errorMessage.value = 'Product name is required';
    return;
  }

  if (form.value.unit_price < 0) {
    errorMessage.value = 'Unit price must be positive';
    return;
  }

  loading.value = true;

  try {
    // ✅ FIX: Convert Vue reactive proxy to plain object for IPC
    const plainData = {
      name: form.value.name,
      sku: form.value.sku || undefined,
      description: form.value.description || undefined,
      unit_price: form.value.unit_price,
      cost_price: form.value.cost_price || undefined,
      category: form.value.category || undefined,
      unit_of_measure: form.value.unit_of_measure,
      tax_rate: form.value.tax_rate,
      stock_quantity: form.value.stock_quantity,
      low_stock_threshold: form.value.low_stock_threshold,
    };

    const result = await window.api.product.create(plainData);

    if (result.success) {
      emit('success');
    } else {
      errorMessage.value = result.error || 'Failed to create product';
    }
  } catch (error) {
    console.error('Error creating product:', error);
    errorMessage.value = 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
};
</script>
