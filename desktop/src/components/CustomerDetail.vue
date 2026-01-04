<template>
  <div class="p-8">
    <div v-if="loading" class="text-center py-8 text-gray-500">Loading customer details...</div>

    <div v-else-if="customer">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ customer.name }}</h1>
          <p class="text-sm text-gray-600 mt-1">{{ customer.company_name || 'Individual' }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="emit('back')" class="btn-secondary">Back</button>
          <button @click="toggleEdit" class="btn-primary">{{ isEditing ? 'Cancel' : 'Edit' }}</button>
        </div>
      </div>

      <!-- Customer Info Card -->
      <div class="card mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        
        <div v-if="!isEditing" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-600">Name</label>
            <p class="text-gray-900">{{ customer.name }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">Company</label>
            <p class="text-gray-900">{{ customer.company_name || '-' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">Email</label>
            <p class="text-gray-900">{{ customer.email || '-' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">Phone</label>
            <p class="text-gray-900">{{ customer.phone || '-' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">TRN</label>
            <p class="text-gray-900">{{ customer.trn || '-' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-600">Payment Terms</label>
            <p class="text-gray-900">{{ customer.payment_terms || '-' }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-600">Address</label>
            <p class="text-gray-900">{{ customer.address || '-' }}</p>
          </div>
          <div class="md:col-span-2">
            <label class="text-sm font-medium text-gray-600">Notes</label>
            <p class="text-gray-900">{{ customer.notes || '-' }}</p>
          </div>
        </div>

        <!-- Edit Form -->
        <form v-else @submit.prevent="handleSave" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input v-model="editForm.name" required class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input v-model="editForm.company_name" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="editForm.email" type="email" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input v-model="editForm.phone" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">TRN</label>
            <input v-model="editForm.trn" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
            <input v-model="editForm.payment_terms" placeholder="e.g., Net 30" class="input-field" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea v-model="editForm.address" rows="2" class="input-field"></textarea>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea v-model="editForm.notes" rows="3" class="input-field"></textarea>
          </div>
          <div class="md:col-span-2 flex gap-2">
            <button type="submit" class="btn-primary">Save Changes</button>
            <button type="button" @click="toggleEdit" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="card">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Total Invoices</h3>
          <p class="text-2xl font-bold text-gray-900">{{ stats.totalInvoices }}</p>
        </div>
        <div class="card">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Total Amount</h3>
          <p class="text-2xl font-bold text-gray-900">AED {{ stats.totalAmount.toFixed(2) }}</p>
        </div>
        <div class="card">
          <h3 class="text-sm font-medium text-gray-600 mb-1">Outstanding</h3>
          <p class="text-2xl font-bold text-red-600">AED {{ stats.outstandingAmount.toFixed(2) }}</p>
        </div>
      </div>

      <!-- Transaction History -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>
        
        <div v-if="invoices.length === 0" class="text-center py-6 text-gray-500">
          No invoices yet
        </div>
        
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200">
              <tr>
                <th class="text-left py-2 px-3 text-sm font-semibold text-gray-700">Invoice #</th>
                <th class="text-left py-2 px-3 text-sm font-semibold text-gray-700">Date</th>
                <th class="text-right py-2 px-3 text-sm font-semibold text-gray-700">Amount</th>
                <th class="text-center py-2 px-3 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in invoices" :key="invoice.invoice_id" class="border-b border-gray-100">
                <td class="py-2 px-3 text-sm text-primary-600">{{ invoice.invoice_number }}</td>
                <td class="py-2 px-3 text-sm text-gray-600">{{ formatDate(invoice.invoice_date) }}</td>
                <td class="py-2 px-3 text-sm text-right font-medium">AED {{ invoice.total_amount.toFixed(2) }}</td>
                <td class="py-2 px-3 text-center">
                  <span :class="getStatusClass(invoice.status)" class="px-2 py-1 rounded-full text-xs">{{
                    invoice.status
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  customerId: number;
}>();

const emit = defineEmits<{
  back: [];
}>();

const customer = ref<any>(null);
const stats = ref({ totalInvoices: 0, totalAmount: 0, paidAmount: 0, outstandingAmount: 0 });
const invoices = ref<any[]>([]);
const loading = ref(true);
const isEditing = ref(false);
const editForm = ref({
  name: '',
  company_name: '',
  email: '',
  phone: '',
  address: '',
  trn: '',
  payment_terms: '',
  notes: '',
});

const loadCustomerData = async () => {
  loading.value = true;
  try {
    // Load customer details
    customer.value = await window.api.customer.getById(props.customerId);
    
    // Load stats
    stats.value = await window.api.customer.getStats(props.customerId);
    
    // Load invoices
    invoices.value = await window.api.customer.getInvoices(props.customerId);
    
    // Initialize edit form
    if (customer.value) {
      editForm.value = {
        name: customer.value.name || '',
        company_name: customer.value.company_name || '',
        email: customer.value.email || '',
        phone: customer.value.phone || '',
        address: customer.value.address || '',
        trn: customer.value.trn || '',
        payment_terms: customer.value.payment_terms || '',
        notes: customer.value.notes || '',
      };
    }
  } catch (error) {
    console.error('Error loading customer data:', error);
  } finally {
    loading.value = false;
  }
};

const toggleEdit = () => {
  if (isEditing.value) {
    // Reset form
    loadCustomerData();
  }
  isEditing.value = !isEditing.value;
};

const handleSave = async () => {
  try {
    const result = await window.api.customer.update(props.customerId, editForm.value);
    if (result.success) {
      isEditing.value = false;
      await loadCustomerData();
    } else {
      alert(result.error || 'Failed to update customer');
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    alert('An error occurred while updating the customer');
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB');
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

onMounted(() => {
  loadCustomerData();
});
</script>
