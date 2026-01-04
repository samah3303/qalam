<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <!-- Dashboard Cards -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
        <p class="text-3xl font-bold text-primary-600">AED 0.00</p>
        <p class="text-sm text-gray-500 mt-1">This month</p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Pending Invoices</h3>
        <p class="text-3xl font-bold text-accent-600">0</p>
        <p class="text-sm text-gray-500 mt-1">Awaiting payment</p>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Expenses</h3>
        <p class="text-3xl font-bold text-red-600">AED 0.00</p>
        <p class="text-sm text-gray-500 mt-1">This month</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card mb-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button @click="emit('navigate', 'create-invoice')" class="btn-primary">New Invoice</button>
        <button @click="emit('navigate', 'add-expense')" class="btn-primary">Add Expense</button>
        <button @click="emit('navigate', 'invoices')" class="btn-secondary">View Invoices</button>
        <button @click="emit('navigate', 'expenses')" class="btn-secondary">View Expenses</button>
      </div>
    </div>

    <!-- Recent Invoices / Activity -->
    <div class="card">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div class="text-center py-8 text-gray-500">
        <p>No recent activity</p>
        <p class="text-sm mt-1">Create your first invoice to get started!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  navigate: [view: string];
}>();
</script>
