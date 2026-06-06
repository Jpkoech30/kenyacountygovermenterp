<script setup>
/**
 * ChvSuppliesPage.vue
 * CHV view to request supplies and view their request history.
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
const showModal = ref(false)

const schema = yup.object({
  kit_id: yup.string().required('Kit is required'),
  quantity: yup.number().required('Quantity is required').min(1, 'Minimum 1').typeError('Must be a number'),
  reason: yup.string().required('Reason is required'),
})

const { handleSubmit, isSubmitting, resetForm } = useFormValidation(schema, {
  kit_id: '',
  quantity: 1,
  reason: '',
})

onMounted(async () => {
  await Promise.all([
    loadRequests(),
    store.fetchKits(),
  ])
})

async function loadRequests() {
  loading.value = true
  try {
    await store.fetchSupplyRequests({ limit: 50 })
  } finally {
    loading.value = false
  }
}

function openRequestModal() {
  resetForm({ values: { kit_id: '', quantity: 1, reason: '' } })
  showModal.value = true
}

const onSubmit = handleSubmit(async (values) => {
  try {
    await store.createSupplyRequest(values)
    showModal.value = false
    await loadRequests()
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to submit request'
    resetForm({ errors: { reason: msg } })
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 class="text-2xl font-bold">My Supply Requests</h1>
      <button class="btn btn-primary" @click="openRequestModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Request
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Kit</th>
            <th>Qty</th>
            <th>Date</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="store.supplyRequests.length === 0">
            <td colspan="5" class="text-center text-base-content/60 py-8">No supply requests.</td>
          </tr>
          <tr v-for="req in store.supplyRequests" :key="req.id">
            <td class="font-medium">{{ req.kit?.kit_name || req.kit_id }}</td>
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
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Request Modal -->
    <dialog :open="showModal" class="modal" @click.self="showModal = false">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg">New Supply Request</h3>
        <form @submit.prevent="onSubmit" class="space-y-4 mt-4">

          <BaseSelect name="kit_id" label="Kit" required :options="[{value:'',label:'Select kit...'},...store.kits.map(k=>({value:k.id,label:k.kit_name+' (KES '+k.unit_cost+')'}))]" />

          <BaseInput name="quantity" label="Quantity" type="number" required />

          <BaseTextarea name="reason" label="Reason" required rows="3" />

          <div class="modal-action">
            <button type="button" class="btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="loading loading-spinner loading-xs"></span>
              Submit Request
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showModal = false">close</button></form>
    </dialog>
  </div>
</template>
