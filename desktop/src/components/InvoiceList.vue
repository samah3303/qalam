<template>
  <div class="p-8">
    <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Invoices</h2>
      <button @click="emit('createNew')" class="btn-primary text-sm">+ New Invoice</button>
    </div>

    <!-- Invoice List -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        Loading invoices...
      </div>

      <div v-else-if="invoices.length === 0" class="text-center py-8 text-gray-500">
        <p>No invoices yet</p>
        <p class="text-sm mt-1">Create your first invoice to get started!</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice #</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
              <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="invoice in invoices"
              :key="invoice.invoice_id"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-3 px-4">
                <button
                  @click="emit('view', invoice.invoice_id)"
                  class="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  {{ invoice.invoice_number }}
                </button>
              </td>
              <td class="py-3 px-4 text-sm text-gray-900">{{ invoice.customer_name || 'N/A' }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(invoice.invoice_date) }}</td>
              <td class="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                AED {{ invoice.total_amount?.toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-center">
                <span :class="getStatusClass(invoice.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ invoice.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  @click="handleDownloadPDF(invoice)"
                  class="text-primary-600 hover:text-primary-700 text-sm"
                >
                  PDF
                </button>
                <button
                  @click="handleDelete(invoice.invoice_id)"
                  class="text-red-600 hover:text-red-700 text-sm ml-2"
                >
                  Delete
                </button>
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
import { generateInvoicePDF } from '../utils/pdfGenerator';

const emit = defineEmits<{
  createNew: [];
  view: [invoiceId: number];
}>();

const invoices = ref<any[]>([]);
const loading = ref(true);

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB');
};

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
};

const loadInvoices = async () => {
  loading.value = true;
  try {
    invoices.value = await window.api.invoice.list(50, 0);
  } catch (error) {
    console.error('Error loading invoices:', error);
  } finally {
    loading.value = false;
  }
};

const handleDownloadPDF = async (invoice: any) => {
  try {
    // Fetch full invoice details with items
    const fullInvoice = await window.api.invoice.getById(invoice.invoice_id);
    
    if (!fullInvoice) {
      alert('Failed to load invoice details');
      return;
    }

    // Generate PDF
    generateInvoicePDF({
      invoice_number: fullInvoice.invoice_number,
      invoice_date: fullInvoice.invoice_date,
      due_date: fullInvoice.due_date,
      customer_name: fullInvoice.customer_name,
      customer_email: fullInvoice.customer_email,
      customer_address: fullInvoice.customer_address,
      items: fullInvoice.items || [],
      subtotal: fullInvoice.subtotal,
      tax_amount: fullInvoice.tax_amount,
      total_amount: fullInvoice.total_amount,
      status: fullInvoice.status,
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF');
  }
};

const handleDelete = async (invoiceId: number) => {
  if (!confirm('Are you sure you want to delete this invoice?')) return;

  try {
    const result = await window.api.invoice.delete(invoiceId);
    if (result.success) {
      await loadInvoices();
    } else {
      alert(result.error || 'Failed to delete invoice');
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    alert('An error occurred while deleting the invoice');
  }
};

onMounted(() => {
  loadInvoices();
});

// Expose reload method for parent component
defineExpose({ loadInvoices });
</script>
