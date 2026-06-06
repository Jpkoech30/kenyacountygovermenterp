<script setup>
/**
 * LeaveRequestCard.vue
 * Self-service leave request form with balance display.
 * Used by employees to submit leave requests.
 */
import { ref, computed } from 'vue';

const props = defineProps({
  leaveBalance: { type: Object, default: null },
});

const emit = defineEmits(['submit', 'cancel']);

const form = ref({
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  reason: '',
});

const saving = ref(false);
const error = ref('');

const leaveTypes = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'compassionate', label: 'Compassionate Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'study', label: 'Study Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
];

const totalDays = computed(() => {
  if (!form.value.start_date || !form.value.end_date) return 0;
  const start = new Date(form.value.start_date);
  const end = new Date(form.value.end_date);
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
});

const exceedsBalance = computed(() => {
  if (!props.leaveBalance || form.value.leave_type !== 'annual') return false;
  return totalDays.value > props.leaveBalance.days_remaining;
});

function handleSubmit() {
  if (exceedsBalance.value) {
    error.value = `Insufficient leave balance. Available: ${props.leaveBalance.days_remaining} days`;
    return;
  }
  saving.value = true;
  error.value = '';
  emit('submit', { ...form.value });
}
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body">
      <h3 class="card-title">Request Leave</h3>

      <!-- Leave Balance Display -->
      <div v-if="leaveBalance" class="stats shadow mb-4">
        <div class="stat">
          <div class="stat-title">Days Entitled</div>
          <div class="stat-value text-primary">{{ leaveBalance.days_entitled }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Days Taken</div>
          <div class="stat-value text-warning">{{ leaveBalance.days_taken }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Days Remaining</div>
          <div class="stat-value text-success">{{ leaveBalance.days_remaining }}</div>
        </div>
      </div>

      <div v-if="error" class="alert alert-error shadow-lg text-sm mb-4">
        <span>{{ error }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-control">
          <label class="label"><span class="label-text">Leave Type *</span></label>
          <select v-model="form.leave_type" class="select select-bordered" required>
            <option v-for="lt in leaveTypes" :key="lt.value" :value="lt.value">{{ lt.label }}</option>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Start Date *</span></label>
            <input v-model="form.start_date" type="date" class="input input-bordered" required />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">End Date *</span></label>
            <input v-model="form.end_date" type="date" class="input input-bordered" required />
          </div>
        </div>

        <div class="alert" :class="exceedsBalance ? 'alert-error' : 'alert-info'" v-if="form.start_date && form.end_date">
          <span>Total days: <strong>{{ totalDays }}</strong></span>
          <span v-if="exceedsBalance" class="ml-2">⚠️ Exceeds available balance!</span>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Reason</span></label>
          <textarea v-model="form.reason" class="textarea textarea-bordered" rows="3"></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-ghost" @click="emit('cancel')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving || exceedsBalance">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            Submit Request
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
