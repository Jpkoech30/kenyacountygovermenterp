<script setup>
/**
 * SuppliesPage.vue
 * Manage CHV kits and supply requests - list kits, create/edit kits,
 * view and manage supply requests with approval workflow.
 */
import { ref, onMounted } from 'vue'
import * as yup from 'yup'
import { useCommunityHealthStore } from '../../../stores/communityHealth'
import { useFormValidation } from '../../../composables/useFormValidation'
import BaseInput from '../../../components/forms/BaseInput.vue'
import BaseSelect from '../../../components/forms/BaseSelect.vue'
import BaseTextarea from '../../../components/forms/BaseTextarea.vue'

const store = useCommunityHealthStore()

const loading = ref(false)
const activeTab = ref('kits')
const showKitModal = ref(false)
const showRequestModal = ref(false)
const editingKit = ref(null)

// Kit form schema
const kitSchema = yup.object({
  kit_name: yup.string().required('Kit name is required'),
  description: yup.string(),
  items_included: yup.string(),
  unit_cost: yup.number().min(0, 'Cost cannot be negative').typeError('Must be a number'),
})

const { handleSubmit: handleKitSubmit, isSubmitting: kitSubmitting, resetForm: resetKitForm } = useFormValidation(kitSchema, {
  kit_name: '',
  description: '',
  items_included: '',
  unit_cost: 0,
})

// Supply request form schema
const requestSchema = yup.object({
  chv_id: yup.string().required('CHV is required'),
  kit_id: yup.string().required('Kit is required'),
  quantity: yup.number().required('Quantity is required').min(1, 'Minimum 1').typeError('Must be a number'),
  reason: yup.string().required('Reason is required'),
})

const { handleSubmit: handleRequestSubmit, isSubmitting: requestSubmitting, resetForm: resetRequestForm } = useFormValidation(requestSchema, {
  chv_id: '',
  kit_id: '',
  quantity: 1,
  reason: '',
})

onMounted(async () => {
  await Promise.all([
    loadKits(),
    loadSupplyRequests(),
    store.fetchVolunteers({ limit: 200 }),
  ])
})

async function loadKits() {
  loading.value = true
  try {
    await store.fetchKits()
  } finally {
    loading.value = false
  }
}

async function loadSupplyRequests() {
  loading.value = true
  try {
    const params = { page: store.supplyRequestsPagination.page }
    await store.fetchSupplyRequests(params)
  } finally {
    loading.value = false
  }
}

function openAddKitModal() {
  editingKit.value = null
  resetKitForm({ values: { kit_name: '', description: '', items_included: '', unit_cost: 0 } })
  showKitModal.value = true
}

function openEditKitModal(kit) {
  editingKit.value = kit
  resetKitForm({ values: {
    kit_name: kit.kit_name,
    description: kit.description || '',
    items_included: kit.items_included ? JSON.stringify(kit.items_included) : '',
    unit_cost: kit.unit_cost || 0,
  } })
  showKitModal.value = true
}

const onKitSubmit = handleKitSubmit(async (values) => {
  try {
    const payload = { ...values }
    if (payload.items_included) {
      try { payload.items_included = JSON.parse(payload.items_included) } catch { payload.items_included = [] }
    }
    if (editingKit.value) {
      await store.updateKit(editingKit.value.id, payload)
    } else {
      await store.createKit(payload)
    }
    showKitModal.value = false
    await loadKits()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to save kit'
    resetKitForm({ errors: { kit_name: msg } })
  }
})

function openRequestModal() {
  resetRequestForm({ values: { chv_id: '', kit_id: '', quantity: 1, reason: '' } })
  showRequestModal.value = true
}

const onRequestSubmit = handleRequestSubmit(async (values) => {
  try {
    await store.createSupplyRequest(values)
    showRequestModal.value = false
    await loadSupplyRequests()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to create request'
    resetRequestForm({ errors: { reason: msg } })
  }
})

async function approveRequest(id) {
  try {
    await store.approveSupplyRequest(id)
    await loadSupplyRequests()
  } catch (err) {
    console.error('Failed to approve request:', err)
  }
}

async function fulfillRequest(id) {
  try {
    await store.fulfillSupplyRequest(id)
    await loadSupplyRequests()
  } catch (err) {
    console.error('Failed to fulfill request:', err)
  }
}

async function rejectRequest(id) {
  if (!confirm('Reject this supply request?')) return
  try {
    await store.rejectSupplyRequest(id)
    await loadSupplyRequests()
  } catch (err) {
    console.error('Failed to reject request:', err)
  }
}

function goToPage(page) {
  store.supplyRequestsPagination.page = page
  loadSupplyRequests()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">Supplies & Kits</h1>
      <div class="flex gap-2">
        <button class="btn btn-primary" @click="openRequestModal">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Request
        </button>
        <button class="btn btn-outline" @click="openAddKitModal">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          New Kit
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div role="tablist" class="tabs tabs-boxed">
      <a role="tab" class="tab" :class="{'tab-active': activeTab === 'kits'}" @click="activeTab = 'kits'">Kits</a>
      <a role="tab" class="tab" :class="{'tab-active': activeTab === 'requests'}" @click="activeTab = 'requests'">Supply Requests</a>
    </div>

    <!-- Kits Tab -->
    <div v-if="activeTab === 'kits'">
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-if="store.kits.length === 0" class="col-span-full text-center text-base-content/60 py-8">
          No kits defined yet.
        </div>
        <div v-for="kit in store.kits" :key="kit.id" class="card bg-base-100 shadow">
          <div class="card-body">
            <h3 class="card-title text-lg">{{ kit.kit_name }}</h3>
            <p v-if="kit.description" class="text-sm text-base-content/70">{{ kit.description }}</p>
            <div class="text-sm mt-2">
              <span class="font-semibold">Cost:</span> KES {{ kit.unit_cost?.toLocaleString() || 0 }}
            </div>
            <div v-if="kit.items_included" class="mt-2">
              <span class="text-sm font-semibold">Items:</span>
              <ul class="list-disc list-inside text-sm">
                <li v-for="(item, idx) in (typeof kit.items_included === 'string' ? JSON.parse(kit.items_included) : kit.items_included)" :key="idx">{{ item }}</li>
              </ul>
            </div>
            <div class="card-actions justify-end mt-2">
              <button class="btn btn-xs btn-ghost" @click="openEditKitModal(kit)">Edit</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Supply Requests Tab -->
    <div v-if="activeTab === 'requests'">
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>CHV</th>
              <th>Kit</th>
              <th>Qty</th>
              <th>Date</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.supplyRequests.length === 0">
              <td colspan="7" class="text-center text-base-content/60 py-8">No supply requests found.</td>
            </tr>
            <tr v-for="req in store.supplyRequests" :key="req.id">
              <td class="font-medium">{{ req.chv?.full_name || req.chv_id }}</td>
              <td>{{ req.kit?.kit_name || req.kit_id }}</td>
              <td>{{ req.quantity }}</td>
              <td>{{ req.request_date ? new Date(req.request_date).toLocaleDateString() : '-' }}</td>
              <td class="max-w-xs truncate">{{ req.reason }}</td>
              <td>
                <span class="badge badge-sm" :class="{
                  'badge-warning': req.status === 'pending',
                  'badge-info': req.status === 'approved',
                  'badge-success': req.status === 'fulfilled',
                  'badge-error': req.status === 'rejected',
                }">{{ req.status }}</span>
              </td>
              <td>
                <div class="flex gap-1" v-if="req.status === 'pending'">
                  <button class="btn btn-xs btn-success" @click="approveRequest(req.id)">Approve</button>
                  <button class="btn btn-xs btn-error" @click="rejectRequest(req.id)">Reject</button>
                </div>
                <div v-else-if="req.status === 'approved'">
                  <button class="btn btn-xs btn-primary" @click="fulfillRequest(req.id)">Fulfill</button>
                </div>
                <span v-else class="text-xs text-base-content/50">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="store.supplyRequestsPagination.totalPages > 1" class="flex justify-center">
        <div class="join">
          <button class="join-item btn btn-sm" :disabled="store.supplyRequestsPagination.page <= 1" @click="goToPage(store.supplyRequestsPagination.page - 1)">«</button>
          <button class="join-item btn btn-sm" v-for="p in store.supplyRequestsPagination.totalPages" :key="p" :class="{'btn-active': p === store.supplyRequestsPagination.page}" @click="goToPage(p)">{{ p }}</button>
          <button class="join-item btn btn-sm" :disabled="store.supplyRequestsPagination.page >= store.supplyRequestsPagination.totalPages" @click="goToPage(store.supplyRequestsPagination.page + 1)">»</button>
        </div>
      </div>
    </div>

    <!-- Kit Modal -->
    <dialog :open="showKitModal" class="modal" @click.self="showKitModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">{{ editingKit ? 'Edit' : 'New' }} Kit</h3>
        <form @submit.prevent="onKitSubmit" class="space-y-4 mt-4">

          <BaseInput name="kit_name" label="Kit Name" required placeholder="Enter kit name" />

          <BaseTextarea name="description" label="Description" rows="2" />

          <BaseTextarea name="items_included" label="Items Included (JSON array)" rows="3" placeholder='["Gloves","Masks","Thermometer","Blood pressure cuff"]' />

          <BaseInput name="unit_cost" label="Unit Cost (KES)" type="number" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showKitModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="kitSubmitting">
              <span v-if="kitSubmitting" class="loading loading-spinner loading-xs"></span>
              {{ editingKit ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showKitModal = false">close</button></form>
    </dialog>

    <!-- Supply Request Modal -->
    <dialog :open="showRequestModal" class="modal" @click.self="showRequestModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">New Supply Request</h3>
        <form @submit.prevent="onRequestSubmit" class="space-y-4 mt-4">

          <BaseSelect name="chv_id" label="CHV" required :options="[{value:'',label:'Select CHV...'},...store.volunteers.map(v=>({value:v.id,label:v.full_name}))]" />

          <BaseSelect name="kit_id" label="Kit" required :options="[{value:'',label:'Select kit...'},...store.kits.map(k=>({value:k.id,label:k.kit_name+' (KES '+k.unit_cost+')'}))]" />

          <BaseInput name="quantity" label="Quantity" type="number" required />

          <BaseTextarea name="reason" label="Reason" required rows="3" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showRequestModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="requestSubmitting">
              <span v-if="requestSubmitting" class="loading loading-spinner loading-xs"></span>
              Submit Request
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showRequestModal = false">close</button></form>
    </dialog>
  </div>
</template>
