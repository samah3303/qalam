<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p class="text-sm text-gray-600 mt-1">Invoice #{{ invoiceNumber }}</p>
      </div>
      <div class="flex gap-2">
        <button @click="emit('cancel')" class="btn-secondary">Cancel</button>
        <button @click="handleSubmit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Creating...' : 'Create Invoice' }}
        </button>
      </div>
    </div>
      <!-- Success Message with PDF Option -->
      <div v-if="successMessage" class="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-green-700 font-medium mb-2">{{ successMessage }}</p>
        <button @click="downloadCreatedInvoicePDF" class="btn-primary text-sm">Download PDF</button>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {{ errorMessage }}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Invoice Details Form -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Selection -->
          <div class="card">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <select v-model="selectedCustomerId" required class="input-field">
                  <option value="">Select a customer...</option>
                  <option v-for="customer in customers" :key="customer.customer_id" :value="customer.customer_id">
                    {{ customer.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Date *</label>
                <input v-model="invoiceDate" type="date" required class="input-field" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input v-model="dueDate" type="date" class="input-field" />
              </div>
            </div>
          </div>

          <!-- Invoice Items -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Line Items</h2>
              <button @click="addLineItem" class="btn-secondary text-sm">+ Add Item</button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, index) in lineItems"
                :key="index"
                class="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg"
              >
                <div class="col-span-5">
                  <input
                    v-model="item.description"
                    type="text"
                    placeholder="Item description"
                    required
                    class="input-field text-sm"
                  />
                </div>
                <div class="col-span-2">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Qty"
                    required
                    class="input-field text-sm"
                  />
                </div>
                <div class="col-span-2">
                  <input
                    v-model.number="item.unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    required
                    class="input-field text-sm"
                  />
                </div>
                <div class="col-span-2">
                  <span class="text-sm font-medium text-gray-700">AED {{ calculateLineTotal(item).toFixed(2) }}</span>
                </div>
                <div class="col-span-1 flex justify-end">
                  <button
                    @click="removeLineItem(index)"
                    v-if="lineItems.length > 1"
                    class="text-red-600 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoice Summary -->
        <div class="lg:col-span-1">
          <div class="card sticky top-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">AED {{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">VAT (5%):</span>
                <span class="font-medium">AED {{ taxAmount.toFixed(2) }}</span>
              </div>
              <div class="border-t pt-3 flex justify-between">
                <span class="font-semibold text-gray-900">Total:</span>
                <span class="font-bold text-primary-600 text-xl">AED {{ totalAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { generateInvoicePDF } from '../utils/pdfGenerator';

const emit = defineEmits<{
  cancel: [];
  success: [invoice: any];
}>();

// State
const invoiceNumber = ref('Loading...');
const selectedCustomerId = ref('');
const invoiceDate = ref(new Date().toISOString().split('T')[0]);
const dueDate = ref('');
const lineItems = ref([
  { description: '', quantity: 1, unit_price: 0, tax_rate: 5 }
]);
const customers = ref<any[]>([]);
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const createdInvoice = ref<any>(null);

// Computed
const subtotal = computed(() => {
  return lineItems.value.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
});

const taxAmount = computed(() => {
  return subtotal.value * 0.05; // 5% UAE VAT
});

const totalAmount = computed(() => {
  return subtotal.value + taxAmount.value;
});

// Methods
const calculateLineTotal = (item: any) => {
  const itemSubtotal = item.quantity * item.unit_price;
  const itemTax = itemSubtotal * 0.05;
  return itemSubtotal + itemTax;
};

const addLineItem = () => {
  lineItems.value.push({ description: '', quantity: 1, unit_price: 0, tax_rate: 5 });
};

const removeLineItem = (index: number) => {
  lineItems.value.splice(index, 1);
};

const downloadCreatedInvoicePDF = () => {
  if (!createdInvoice.value) return;

  generateInvoicePDF({
    invoice_number: createdInvoice.value.invoice_number,
    invoice_date: createdInvoice.value.invoice_date,
    due_date: createdInvoice.value.due_date,
    customer_name: createdInvoice.value.customer_name,
    customer_email: createdInvoice.value.customer_email,
    customer_address: createdInvoice.value.customer_address,
    items: createdInvoice.value.items || [],
    subtotal: createdInvoice.value.subtotal,
    tax_amount: createdInvoice.value.tax_amount,
    total_amount: createdInvoice.value.total_amount,
    status: createdInvoice.value.status,
  });
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!selectedCustomerId.value) {
    errorMessage.value = 'Please select a customer';
    return;
  }

  if (lineItems.value.some(item => !item.description || item.quantity <= 0 || item.unit_price < 0)) {
    errorMessage.value = 'Please fill in all line items correctly';
    return;
  }

  loading.value = true;

  try {
    // ✅ FIX: Convert Vue reactive array to plain objects for IPC
    const plainItems = lineItems.value.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate || 5.0,
    }));

    const result = await window.api.invoice.create(
      parseInt(selectedCustomerId.value), // Use selectedCustomerId as per original code
      invoiceDate.value,
      dueDate.value || null,
      plainItems
    );

    if (result.success) {
      createdInvoice.value = result.invoice; // Keep this for downloadCreatedInvoicePDF
      successMessage.value = `Invoice ${result.invoice.invoice_number} created successfully! You can download the PDF or return to the list.`;
      
      // Reset form
      selectedCustomerId.value = ''; // Reset selectedCustomerId
      lineItems.value = [{ description: '', quantity: 1, unit_price: 0, tax_rate: 5.0 }];
      invoiceDate.value = new Date().toISOString().split('T')[0];
      dueDate.value = '';

      // Auto-emit success after 3 seconds if user doesn't download PDF
      setTimeout(() => {
        if (successMessage.value) {
          emit('success', result.invoice);
        }
      }, 5000);
    } else {
      errorMessage.value = result.error || 'Failed to create invoice';
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    errorMessage.value = 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
};

// Load data on mount
onMounted(async () => {
  try {
    // Get next invoice number
    invoiceNumber.value = await window.api.invoice.getNextNumber();

    // Load customers
    customers.value = await window.api.customer.list();
  } catch (error) {
    console.error('Error loading data:', error);
    errorMessage.value = 'Failed to load invoice data';
  }
});
</script>
