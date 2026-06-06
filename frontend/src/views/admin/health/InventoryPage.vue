<script setup>
/**
 * InventoryPage.vue
 * Inventory management page with list, add/edit modal, and transaction recording.
 * Uses vee-validate + Yup validation with base form components.
 */
import { ref, computed, onMounted } from 'vue'
import * as yup from 'yup'
import { useHealthStore } from '../../../stores/health'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseSelect from '../../../components/forms/BaseSelect.vue'
import BaseTextarea from '../../../components/forms/BaseTextarea.vue'

const healthStore = useHealthStore()

const loading = ref(false)
const showAddModal = ref(false)
const showTransactionModal = ref(false)
const editingItem = ref(null)
const selectedItem = ref(null)
const activeTab = ref('items')
const filterCategory = ref('')
const filterLowStock = ref(false)
const filterExpiring = ref(false)

const formError = ref('')
const saving = ref(false)

// Item form schema
const itemSchema = yup.object({
  name: yup.string().required('Item name is required').min(2, 'Name must be at least 2 characters'),
  code: yup.string().required('Item code is required'),
  category: yup.string().required('Category is required'),
  unit_of_measure: yup.string().required('Unit of measure is required'),
  reorder_level: yup.number().required('Reorder level is required').min(0, 'Must be 0 or more').typeError('Must be a number'),
  current_stock: yup.number().required('Current stock is required').min(0, 'Must be 0 or more').typeError('Must be a number'),
  expiry_date: yup.string(),
  supplier_id: yup.string(),
})

const {
  handleSubmit: handleItemSubmit,
  isSubmitting: isItemSubmitting,
  resetForm: resetItemForm,
  errors: itemErrors,
  setFieldValue: setItemFieldValue,
} = useFormValidation(itemSchema, {
  name: '',
  code: '',
  category: 'pharmaceuticals',
  unit_of_measure: '',
  reorder_level: 10,
  current_stock: 0,
  expiry_date: '',
  supplier_id: '',
})

// Transaction form schema
const transactionSchema = yup.object({
  item_id: yup.number().required('Item is required').typeError('Item is required'),
  transaction_type: yup.string().required('Transaction type is required'),
  quantity: yup.number().required('Quantity is required').min(1, 'Quantity must be at least 1').typeError('Must be a number'),
  reference: yup.string(),
  notes: yup.string(),
})

const {
  handleSubmit: handleTransactionSubmit,
  isSubmitting: isTransactionSubmitting,
  resetForm: resetTransactionForm,
  errors: transactionErrors,
} = useFormValidation(transactionSchema, {
  item_id: '',
  transaction_type: 'receipt',
  quantity: 1,
  reference: '',
  notes: '',
})

onMounted(async () => {
  await loadItems()
  await healthStore.fetchSuppliers()
})

async function loadItems() {
  loading.value = true
  try {
    const params = { page: healthStore.inventoryPagination.page }
    if (filterCategory.value) params.category = filterCategory.value
    if (filterLowStock.value) params.lowStock = true
    if (filterExpiring.value) params.expiring = true
    await healthStore.fetchInventoryItems(params)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingItem.value = null
  resetItemForm({
    values: {
      name: '',
      code: '',
      category: 'pharmaceuticals',
      unit_of_measure: '',
      reorder_level: 10,
      current_stock: 0,
      expiry_date: '',
      supplier_id: '',
    },
  })
  formError.value = ''
  showAddModal.value = true
}

function openEditModal(item) {
  editingItem.value = item
  resetItemForm({
    values: {
      name: item.name,
      code: item.code,
      category: item.category,
      unit_of_measure: item.unit_of_measure,
      reorder_level: item.reorder_level,
      current_stock: item.current_stock,
      expiry_date: item.expiry_date ? item.expiry_date.slice(0, 10) : '',
      supplier_id: item.supplier_id || '',
    },
  })
  formError.value = ''
  showAddModal.value = true
}

function openTransactionModal(item) {
  selectedItem.value = item
  resetTransactionForm({
    values: {
      item_id: item.id,
      transaction_type: 'receipt',
      quantity: 1,
      reference: '',
      notes: '',
    },
  })
  formError.value = ''
  showTransactionModal.value = true
}

const onSaveItem = handleItemSubmit(async (formValues) => {
  saving.value = true
  formError.value = ''
  try {
    if (editingItem.value) {
      await healthStore.updateInventoryItem(editingItem.value.id, { ...formValues })
    } else {
      await healthStore.createInventoryItem({ ...formValues })
    }
    showAddModal.value = false
    await loadItems()
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to save item'
  } finally {
    saving.value = false
  }
})

const onRecordTransaction = handleTransactionSubmit(async (formValues) => {
  saving.value = true
  formError.value = ''
  try {
    await healthStore.recordTransaction({ ...formValues })
    showTransactionModal.value = false
    await loadItems()
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to record transaction'
  } finally {
    saving.value = false
  }
})

function changePage(page) {
  healthStore.inventoryPagination.page = page
  loadItems()
}

const items = healthStore.inventoryItems
const pagination = healthStore.inventoryPagination
const suppliers = healthStore.suppliers

const categoryOptions = [
  { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'equipment', label: 'Equipment' },
]

const transactionTypeOptions = [
  { value: 'receipt', label: 'Receipt (stock in)' },
  { value: 'issue', label: 'Issue (stock out)' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'return', label: 'Return' },
]

const supplierOptions = computed(() => {
  const opts = [{ value: '', label: 'None' }]
  if (suppliers) {
    suppliers.forEach((s) => opts.push({ value: s.id, label: s.name }))
  }
  return opts
})

</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Inventory Management</h1>
      <button class="btn btn-primary" @click="openAddModal">+ Add Item</button>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-boxed">
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'items' }" @click="activeTab = 'items'">Items</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'alerts' }" @click="activeTab = 'alerts'">Stock Alerts</a>
    </div>

    <!-- Items Tab -->
    <div v-if="activeTab === 'items'">
      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mb-4">
        <select v-model="filterCategory" class="select select-bordered select-sm" @change="loadItems">
          <option value="">All Categories</option>
          <option value="pharmaceuticals">Pharmaceuticals</option>
          <option value="consumables">Consumables</option>
          <option value="equipment">Equipment</option>
        </select>
        <label class="label cursor-pointer gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" v-model="filterLowStock" @change="loadItems" />
          <span class="label-text">Low stock only</span>
        </label>
        <label class="label cursor-pointer gap-2">
          <input type="checkbox" class="checkbox checkbox-sm" v-model="filterExpiring" @change="loadItems" />
          <span class="label-text">Expiring soon</span>
        </label>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Reorder Level</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td class="font-mono text-sm">{{ item.code }}</td>
              <td class="font-medium">{{ item.name }}</td>
              <td><span class="badge badge-sm">{{ item.category }}</span></td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-error': item.current_stock <= 0,
                    'badge-warning': item.current_stock > 0 && item.current_stock <= item.reorder_level,
                    'badge-success': item.current_stock > item.reorder_level,
                  }"
                >
                  {{ item.current_stock }} {{ item.unit_of_measure }}
                </span>
              </td>
              <td>{{ item.reorder_level }}</td>
              <td>
                <span v-if="item.expiry_date" class="text-sm" :class="{ 'text-error font-semibold': new Date(item.expiry_date) < new Date() }">
                  {{ new Date(item.expiry_date).toLocaleDateString() }}
                </span>
                <span v-else class="text-base-content/50">—</span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-ghost btn-xs" @click="openEditModal(item)">Edit</button>
                  <button class="btn btn-ghost btn-xs" @click="openTransactionModal(item)">Stock</button>
                </div>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="7" class="text-center text-base-content/60 py-8">No inventory items found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="flex justify-center mt-4">
        <div class="join">
          <button class="join-item btn btn-sm" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">«</button>
          <button class="join-item btn btn-sm" v-for="p in pagination.totalPages" :key="p" :class="{ 'btn-active': p === pagination.page }" @click="changePage(p)">{{ p }}</button>
          <button class="join-item btn btn-sm" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">»</button>
        </div>
      </div>
    </div>

    <!-- Alerts Tab -->
    <div v-if="activeTab === 'alerts'">
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Low Stock -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-warning">Low Stock Items</h2>
              <div v-if="healthStore.stockAlerts.lowStockItems.length === 0" class="text-base-content/60 text-center py-4">
                No low stock items.
              </div>
              <div v-else class="space-y-2">
                <div v-for="item in healthStore.stockAlerts.lowStockItems" :key="item.id" class="flex items-center justify-between p-2 bg-base-200 rounded">
                  <div>
                    <div class="font-medium">{{ item.name }}</div>
                    <div class="text-sm text-base-content/60">Stock: {{ item.current_stock }} / Reorder: {{ item.reorder_level }}</div>
                  </div>
                  <span class="badge badge-warning">{{ item.current_stock }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Expiring -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h2 class="card-title text-error">Expiring Soon</h2>
              <div v-if="healthStore.stockAlerts.expiringItems.length === 0" class="text-base-content/60 text-center py-4">
                No items expiring soon.
              </div>
              <div v-else class="space-y-2">
                <div v-for="item in healthStore.stockAlerts.expiringItems" :key="item.id" class="flex items-center justify-between p-2 bg-base-200 rounded">
                  <div>
                    <div class="font-medium">{{ item.name }}</div>
                    <div class="text-sm text-base-content/60">Expires: {{ new Date(item.expiry_date).toLocaleDateString() }}</div>
                  </div>
                  <span class="badge badge-error">{{ item.current_stock }} {{ item.unit_of_measure }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Add/Edit Modal -->
    <dialog :open="showAddModal" class="modal" @click.self="showAddModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingItem ? 'Edit Item' : 'Add Inventory Item' }}</h3>

        <div v-if="formError" class="alert alert-error mt-4">
          <span>{{ formError }}</span>
        </div>

        <form @submit.prevent="onSaveItem" class="space-y-4 mt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="name" label="Name *" placeholder="Item name" />
            <BaseInput name="code" label="Code *" placeholder="Item code" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseSelect name="category" label="Category" :options="categoryOptions" />
            <BaseInput name="unit_of_measure" label="Unit of Measure" placeholder="e.g. tablets, boxes, units" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="current_stock" label="Current Stock" type="number" />
            <BaseInput name="reorder_level" label="Reorder Level" type="number" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput name="expiry_date" label="Expiry Date" type="date" />
            <BaseSelect name="supplier_id" label="Supplier" :options="supplierOptions" />
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="showAddModal = false" :disabled="saving">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              {{ editingItem ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAddModal = false">close</button>
      </form>
    </dialog>

    <!-- Transaction Modal -->
    <dialog :open="showTransactionModal" class="modal" @click.self="showTransactionModal = false">
      <div class="modal-box max-w-md">
        <h3 class="font-bold text-lg">Record Stock Movement</h3>
        <p v-if="selectedItem" class="text-sm text-base-content/70">Item: <strong>{{ selectedItem.name }}</strong> (Current: {{ selectedItem.current_stock }})</p>

        <div v-if="formError" class="alert alert-error mt-4">
          <span>{{ formError }}</span>
        </div>

        <form @submit.prevent="onRecordTransaction" class="space-y-4 mt-4">
          <BaseSelect name="transaction_type" label="Transaction Type" :options="transactionTypeOptions" />
          <BaseInput name="quantity" label="Quantity *" type="number" />
          <BaseInput name="reference" label="Reference" placeholder="e.g. Invoice #123" />
          <BaseTextarea name="notes" label="Notes" :rows="2" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showTransactionModal = false" :disabled="saving">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              Record
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showTransactionModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>
