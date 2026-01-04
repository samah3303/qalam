<template>
  <div class="p-8">
    <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Expenses</h2>
      <button @click="emit('addNew')" class="btn-primary text-sm">+ Add Expense</button>
    </div>

    <!-- Expense List -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-500">Loading expenses...</div>

      <div v-else-if="expenses.length === 0" class="text-center py-8 text-gray-500">
        <p>No expenses recorded yet</p>
        <p class="text-sm mt-1">Add your first expense to start tracking!</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200">
            <tr>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="expense in expenses"
              :key="expense.expense_id"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="py-3 px-4 text-sm text-gray-600">{{ formatDate(expense.date) }}</td>
              <td class="py-3 px-4 text-sm text-gray-900">{{ expense.category_name }}</td>
              <td class="py-3 px-4 text-sm text-gray-900">{{ expense.description }}</td>
              <td class="py-3 px-4 text-sm text-gray-600">{{ expense.vendor || '-' }}</td>
              <td class="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                AED {{ expense.amount?.toFixed(2) }}
              </td>
              <td class="py-3 px-4 text-right">
                <button @click="handleDelete(expense.expense_id)" class="text-red-600 hover:text-red-700 text-sm">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Total Summary -->
    <div class="card bg-primary-50 border-primary-200">
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold text-gray-900">Total Expenses:</span>
        <span class="text-2xl font-bold text-primary-600">AED {{ totalExpenses.toFixed(2) }}</span>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits<{
  addNew: [];
}>();

const expenses = ref<any[]>([]);
const loading = ref(true);

const totalExpenses = computed(() => {
  return expenses.value.reduce((sum, expense) => sum + (expense.amount || 0), 0);
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-GB');
};

const loadExpenses = async () => {
  loading.value = true;
  try {
    expenses.value = await window.api.expense.list(100, 0);
  } catch (error) {
    console.error('Error loading expenses:', error);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (expenseId: number) => {
  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    const result = await window.api.expense.delete(expenseId);
    if (result.success) {
      await loadExpenses();
    } else {
      alert(result.error || 'Failed to delete expense');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
    alert('An error occurred while deleting the expense');
  }
};

onMounted(() => {
  loadExpenses();
});

// Expose reload method
defineExpose({ loadExpenses });
</script>
