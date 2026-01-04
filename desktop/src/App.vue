<template>
  <div id="app">
    <Login v-if="!currentUser" @authenticated="handleAuthenticated" />
    <AppLayout
      v-else
      :user="currentUser"
      :currentView="currentView"
      @navigate="handleNavigate"
      @logout="handleLogout"
    >
      <Dashboard v-if="currentView === 'dashboard'" @navigate="handleNavigate" />
      <InvoiceList
        v-else-if="currentView === 'invoices'"
        @createNew="handleNavigate('create-invoice')"
        @view="handleViewInvoice"
      />
      <CreateInvoice
        v-else-if="currentView === 'create-invoice'"
        @cancel="handleNavigate('invoices')"
        @success="handleInvoiceCreated"
      />
      <ExpenseList v-else-if="currentView === 'expenses'" @addNew="handleNavigate('add-expense')" />
      <AddExpense
        v-else-if="currentView === 'add-expense'"
        @cancel="handleNavigate('expenses')"
        @success="handleExpenseAdded"
      />
      <CustomerList
        v-else-if="currentView === 'customers'"
        @createNew="handleNavigate('customer-add')"
        @view="handleViewCustomer"
        @edit="handleEditCustomer"
      />
      <AddCustomer
        v-else-if="currentView === 'customer-add'"
        @cancel="handleNavigate('customers')"
        @success="handleCustomerAdded"
      />
      <CustomerDetail
        v-else-if="currentView === 'customer-detail'"
        :customerId="selectedCustomerId!"
        @back="handleNavigate('customers')"
      />
      <ProductList
        v-else-if="currentView === 'products'"
        @createNew="handleNavigate('product-add')"
        @view="handleViewProduct"
        @edit="handleEditProduct"
        @adjustStock="handleAdjustStock"
      />
      <AddProduct
        v-else-if="currentView === 'product-add'"
        @cancel="handleNavigate('products')"
        @success="handleProductAdded"
      />
      <div v-else-if="currentView === 'reports'" class="p-8">
        <Reports />
      </div>
      <div v-else-if="currentView === 'settings'" class="p-8">
        <Settings />
      </div>
      <div v-else-if="currentView === 'import-export'" class="p-8">
        <ImportExport />
      </div>
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Login from './components/Login.vue';
import AppLayout from './components/AppLayout.vue';
import Dashboard from './components/Dashboard.vue';
import InvoiceList from './components/InvoiceList.vue';
import CreateInvoice from './components/CreateInvoice.vue';
import ExpenseList from './components/ExpenseList.vue';
import AddExpense from './components/AddExpense.vue';
import Reports from './components/Reports.vue';
import CustomerList from './components/CustomerList.vue';
import CustomerDetail from './components/CustomerDetail.vue';
import AddCustomer from './components/AddCustomer.vue';
import ProductList from './components/ProductList.vue';
import AddProduct from './components/AddProduct.vue';
import Settings from './components/Settings.vue';
import ImportExport from './components/ImportExport.vue';

const currentUser = ref<any>(null);
const currentView = ref<string>('dashboard');
const selectedCustomerId = ref<number | null>(null);

const handleAuthenticated = (user: any) => {
  currentUser.value = user;
  currentView.value = 'dashboard';
  console.log('User authenticated:', user);
};

const handleLogout = () => {
  currentUser.value = null;
  currentView.value = 'dashboard';
};

const handleNavigate = (view: string) => {
  currentView.value = view;
};

const handleViewInvoice = (invoiceId: number) => {
  console.log('View invoice:', invoiceId);
  // TODO: Implement invoice detail view
};

const handleViewCustomer = (customerId: number) => {
  selectedCustomerId.value = customerId;
  currentView.value = 'customer-detail';
};

const handleEditCustomer = (customerId: number) => {
  selectedCustomerId.value = customerId;
  currentView.value = 'customer-detail';
};

const handleInvoiceCreated = (invoice: any) => {
  console.log('Invoice created:', invoice);
  currentView.value = 'invoices';
};

const handleExpenseAdded = () => {
  currentView.value = 'expenses';
};

const handleCustomerAdded = () => {
  currentView.value = 'customers';
};

const handleViewProduct = (productId: number) => {
  console.log('View product:', productId);
  // TODO: Implement product detail view
};

const handleEditProduct = (productId: number) => {
  console.log('Edit product:', productId);
  // TODO: Implement edit view
};

const handleAdjustStock = (productId: number) => {
  console.log('Adjust stock:', productId);
  // TODO: Implement stock adjustment modal
};

const handleProductAdded = () => {
  currentView.value = 'products';
};
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>
