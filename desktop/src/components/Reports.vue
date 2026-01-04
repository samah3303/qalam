<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Financial Reports</h1>

    <!-- Report Type Selector -->
    <div class="mb-6 flex gap-4">
      <button
        @click="activeReport = 'pl'"
        :class="['px-4 py-2 rounded-lg font-medium', activeReport === 'pl' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700']"
      >
        Profit & Loss
      </button>
      <button
        @click="activeReport = 'bs'"
        :class="['px-4 py-2 rounded-lg font-medium', activeReport === 'bs' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700']"
      >
        Balance Sheet
      </button>
    </div>

    <!-- Profit & Loss Report -->
    <div v-if="activeReport === 'pl'" class="card">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Profit & Loss Statement</h2>
      
      <!-- Date Range -->
      <div class="flex gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input v-model="plStartDate" type="date" class="input-field" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input v-model="plEndDate" type="date" class="input-field" />
        </div>
        <div class="flex items-end">
          <button @click="loadPL" class="btn-primary">Generate Report</button>
        </div>
      </div>

      <div v-if="plData">
        <!-- Revenue -->
        <div class="mb-6">
          <h3 class="font-semibold text-lg text-gray-900 mb-2">Revenue</h3>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="item in plData.revenue" :key="item.account_code" class="border-b">
                <td class="py-2 text-gray-700">{{ item.account_name }}</td>
                <td class="py-2 text-right font-medium">AED {{ item.amount.toFixed(2) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="py-2">Total Revenue</td>
                <td class="py-2 text-right">AED {{ plData.totalRevenue.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Expenses -->
        <div class="mb-6">
          <h3 class="font-semibold text-lg text-gray-900 mb-2">Expenses</h3>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="item in plData.expenses" :key="item.account_code" class="border-b">
                <td class="py-2 text-gray-700">{{ item.account_name }}</td>
                <td class="py-2 text-right font-medium">AED {{ item.amount.toFixed(2) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="py-2">Total Expenses</td>
                <td class="py-2 text-right">AED {{ plData.totalExpenses.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Net Income -->
        <div class="border-t-2 border-gray-300 pt-4">
          <div class="flex justify-between items-center">
            <span class="text-xl font-bold text-gray-900">Net Income</span>
            <span :class="['text-2xl font-bold', plData.netIncome >= 0 ? 'text-green-600' : 'text-red-600']">
              AED {{ plData.netIncome.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Balance Sheet Report -->
    <div v-if="activeReport === 'bs'" class="card">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Balance Sheet</h2>
      
      <!-- As Of Date -->
      <div class="flex gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">As of Date</label>
          <input v-model="bsDate" type="date" class="input-field" />
        </div>
        <div class="flex items-end">
          <button @click="loadBS" class="btn-primary">Generate Report</button>
        </div>
      </div>

      <div v-if="bsData" class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Assets -->
        <div>
          <h3 class="font-semibold text-lg text-gray-900 mb-2">Assets</h3>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="item in bsData.assets" :key="item.account_code" class="border-b">
                <td class="py-2 text-gray-700">{{ item.account_name }}</td>
                <td class="py-2 text-right font-medium">AED {{ item.amount.toFixed(2) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="py-2">Total Assets</td>
                <td class="py-2 text-right">AED {{ bsData.totalAssets.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Liabilities & Equity -->
        <div>
          <h3 class="font-semibold text-lg text-gray-900 mb-2">Liabilities</h3>
          <table class="w-full text-sm mb-6">
            <tbody>
              <tr v-for="item in bsData.liabilities" :key="item.account_code" class="border-b">
                <td class="py-2 text-gray-700">{{ item.account_name }}</td>
                <td class="py-2 text-right font-medium">AED {{ item.amount.toFixed(2) }}</td>
              </tr>
              <tr class="font-bold">
                <td class="py-2">Total Liabilities</td>
                <td class="py-2 text-right">AED {{ bsData.totalLiabilities.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <h3 class="font-semibold text-lg text-gray-900 mb-2">Equity</h3>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="item in bsData.equity" :key="item.account_code" class="border-b">
                <td class="py-2 text-gray-700">{{ item.account_name }}</td>
                <td class="py-2 text-right font-medium">AED {{ item.amount.toFixed(2) }}</td>
              </tr>
              <tr class="font-bold border-t-2">
                <td class="py-2">Total Liabilities + Equity</td>
                <td class="py-2 text-right">AED {{ (bsData.totalLiabilities + bsData.totalEquity).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const activeReport = ref('pl');

// P&L State
const plStartDate = ref(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]); // Jan 1
const plEndDate = ref(new Date().toISOString().split('T')[0]); // Today
const plData = ref<any>(null);

// Balance Sheet State
const bsDate = ref(new Date().toISOString().split('T')[0]); // Today
const bsData = ref<any>(null);

const loadPL = async () => {
  try {
    plData.value = await window.api.accounting.getProfitAndLoss(plStartDate.value, plEndDate.value);
  } catch (error) {
    console.error('Error loading P&L:', error);
  }
};

const loadBS = async () => {
  try {
    bsData.value = await window.api.accounting.getBalanceSheet(bsDate.value);
  } catch (error) {
    console.error('Error loading Balance Sheet:', error);
  }
};

// Auto-load on mount
loadPL();
loadBS();
</script>
