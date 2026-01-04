<template>
  <div class="p-8">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Customers</h1>
        <button @click="emit('createNew')" class="btn-primary">+ New Customer</button>
      </div>

      <!-- Search & Filter -->
      <div class="flex gap-4 mb-4">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Search customers..."
          class="input-field flex-1"
        />
        <select v-model="statusFilter" @change="loadCustomers" class="input-field w-48">
          <option value="active">Active Only</option>
          <option value="all">All Customers</option>
        </select>
      </div>

      <!-- Customer List -->
      <div class="card">
        <div v-if="loading" class="text-center py-8 text-gray-500">Loading customers...</div>

        <div v-else-if="customers.length === 0" class="text-center py-8 text-gray-500">
          <p>No customers found</p>
          <p class="text-sm mt-1">Add your first customer to get started!</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200">
              <tr>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Company</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Balance</th>
                <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="customer in customers"
                :key="customer.customer_id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4">
                  <button
                    @click="emit('view', customer.customer_id)"
                    class="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    {{ customer.name }}
                  </button>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">{{ customer.company_name || '-' }}</td>
                <td class="py-3 px-4 text-sm text-gray-600">{{ customer.email || '-' }}</td>
                <td class="py-3 px-4 text-sm text-gray-600">{{ customer.phone || '-' }}</td>
                <td class="py-3 px-4 text-sm text-right font-medium">
                  <span v-if="balances[customer.customer_id]">
                    AED {{ balances[customer.customer_id].outstanding.toFixed(2) }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="py-3 px-4 text-center">
                  <span
                    :class="customer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ customer.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    @click="emit('edit', customer.customer_id)"
                    class="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    @click="handleDelete(customer.customer_id)"
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

const emit = defineEmits<{
  createNew: [];
  view: [customerId: number];
  edit: [customerId: number];
}>();

const customers = ref<any[]>([]);
const balances = ref<Record<number, any>>({});
const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref<'active' | 'all'>('active');

const loadCustomers = async () => {
  loading.value = true;
  try {
    customers.value = await window.api.customer.list(statusFilter.value === 'active');
    
    // Load balances for each customer
    for (const customer of customers.value) {
      try {
        balances.value[customer.customer_id] = await window.api.customer.getBalance(customer.customer_id);
      } catch (error) {
        console.error(`Error loading balance for customer ${customer.customer_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading customers:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    loading.value = true;
    try {
      customers.value = await window.api.customer.search(searchQuery.value);
      
      // Load balances
      for (const customer of customers.value) {
        balances.value[customer.customer_id] = await window.api.customer.getBalance(customer.customer_id);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      loading.value = false;
    }
  } else {
    loadCustomers();
  }
};

const handleDelete = async (customerId: number) => {
  if (!confirm('Are you sure you want to delete this customer?')) return;

  try {
    const result = await window.api.customer.delete(customerId);
    if (result.success) {
      await loadCustomers();
    } else {
      alert(result.error || 'Failed to delete customer');
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    alert('An error occurred while deleting the customer');
  }
};

onMounted(() => {
  loadCustomers();
});

defineExpose({ loadCustomers });
</script>
