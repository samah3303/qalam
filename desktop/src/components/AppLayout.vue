<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside
      class="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col shadow-xl fixed lg:static inset-y-0 left-0 z-20 transition-transform duration-300 lg:translate-x-0"
      :class="{ '-translate-x-full': !isSidebarOpen, 'translate-x-0': isSidebarOpen }"
    >
      <!-- Logo/Brand -->
      <div class="p-6 border-b border-blue-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span class="text-2xl">✒️</span>
          </div>
          <div>
            <h1 class="text-xl font-bold">Qalam</h1>
            <p class="text-xs text-blue-200">قلم • Accounting</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 overflow-y-auto">
        <div
          v-for="item in navigationItems"
          :key="item.id"
          @click="handleNavigate(item.id)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all mb-1',
            currentView === item.id
              ? 'bg-white text-blue-900 shadow-lg font-semibold'
              : 'text-blue-200 hover:bg-blue-700 hover:text-white'
          ]"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </nav>

      <!-- User Profile -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center space-x-3 mb-3">
          <div class="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
            <span class="text-white font-semibold">{{ userInitials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ user.username }}</p>
            <p class="text-xs text-gray-500">{{ user.email || 'User' }}</p>
          </div>
        </div>
        <button @click="emit('logout')" class="btn-secondary w-full text-sm">
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Mobile Header -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:hidden">
        <button @click="toggleSidebar" class="p-2 rounded-lg hover:bg-gray-100">
          <span class="text-2xl">☰</span>
        </button>
        <span class="ml-4 font-bold text-gray-900 text-lg">AccountPro</span>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div
      v-if="isSidebarOpen"
      @click="toggleSidebar"
      class="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-10"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  user: any;
  currentView: string;
}>();

const emit = defineEmits<{
  navigate: [view: string];
  logout: [];
}>();

const isSidebarOpen = ref(false);

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'invoices', label: 'Invoices', icon: '📝' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'products', label: 'Products', icon: '📦' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'import-export', label: 'Import/Export', icon: '📂' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const userInitials = computed(() => {
  const name = props.user.username || 'U';
  return name.substring(0, 2).toUpperCase();
});

const handleNavigate = (view: string) => {
  emit('navigate', view);
  if (window.innerWidth < 1024) {
    isSidebarOpen.value = false;
  }
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
</script>
