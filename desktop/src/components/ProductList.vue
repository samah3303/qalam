<template>
  <div class="p-8">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Products</h1>
        <button @click="emit('createNew')" class="btn-primary">+ New Product</button>
      </div>

      <!-- Search & Filter -->
      <div class="flex gap-4 mb-4">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Search products by name, SKU, category..."
          class="input-field flex-1"
        />
        <select v-model="statusFilter" @change="loadProducts" class="input-field w-48">
          <option value="active">Active Only</option>
          <option value="all">All Products</option>
        </select>
        <button @click="showLowStockOnly = !showLowStockOnly; loadProducts()" class="btn-secondary">
          {{ showLowStockOnly ? 'Show All' : 'Low Stock Only' }}
        </button>
      </div>

      <!-- Product List -->
      <div class="card">
        <div v-if="loading" class="text-center py-8 text-gray-500">Loading products...</div>

        <div v-else-if="displayProducts.length === 0" class="text-center py-8 text-gray-500">
          <p>No products found</p>
          <p class="text-sm mt-1">Add your first product to get started!</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200">
              <tr>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
                <th class="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th class="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in displayProducts"
                :key="product.product_id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="py-3 px-4">
                  <button
                    @click="emit('view', product.product_id)"
                    class="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    {{ product.name }}
                  </button>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">{{ product.sku || '-' }}</td>
                <td class="py-3 px-4 text-sm text-gray-600">{{ product.category || '-' }}</td>
                <td class="py-3 px-4 text-sm text-right font-medium">AED {{ product.unit_price.toFixed(2) }}</td>
                <td class="py-3 px-4 text-center">
                  <span
                    :class="getStockClass(product)"
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ product.stock_quantity }} {{ product.unit_of_measure }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <span
                    :class="product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    class="px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {{ product.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    @click="emit('edit', product.product_id)"
                    class="text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    @click="emit('adjustStock', product.product_id)"
                    class="text-blue-600 hover:text-blue-700 text-sm ml-2"
                  >
                    Adjust
                  </button>
                  <button
                    @click="handleDelete(product.product_id)"
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
import { ref, computed, onMounted } from 'vue';

const emit = defineEmits<{
  createNew: [];
  view: [productId: number];
  edit: [productId: number];
  adjustStock: [productId: number];
}>();

const products = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref<'active' | 'all'>('active');
const showLowStockOnly = ref(false);

const displayProducts = computed(() => {
  if (showLowStockOnly.value) {
    return products.value.filter(p => p.stock_quantity <= p.low_stock_threshold);
  }
  return products.value;
});

const loadProducts = async () => {
  loading.value = true;
  try {
    if (showLowStockOnly.value) {
      products.value = await window.api.product.getLowStock();
    } else {
      products.value = await window.api.product.list(statusFilter.value === 'active');
    }
  } catch (error) {
    console.error('Error loading products:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    loading.value = true;
    try {
      products.value = await window.api.product.search(searchQuery.value);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      loading.value = false;
    }
  } else {
    loadProducts();
  }
};

const handleDelete = async (productId: number) => {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const result = await window.api.product.delete(productId);
    if (result.success) {
      await loadProducts();
    } else {
      alert(result.error || 'Failed to delete product');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('An error occurred while deleting the product');
  }
};

const getStockClass = (product: any) => {
  if (product.stock_quantity === 0) {
    return 'bg-red-100 text-red-700';
  } else if (product.stock_quantity <= product.low_stock_threshold) {
    return 'bg-yellow-100 text-yellow-700';
  } else {
    return 'bg-green-100 text-green-700';
  }
};

onMounted(() => {
  loadProducts();
});

defineExpose({ loadProducts });
</script>
