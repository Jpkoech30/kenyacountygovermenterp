<script setup>
/**
 * EmploymentHistoryForm.vue
 * Modal form for adding employment history entries.
 * Used by HR officers to record position/department changes.
 */
import { ref, computed, onMounted } from 'vue';
import api from '../../api/axios';

const props = defineProps({
  employeeId: { type: Number, required: true },
  currentPosition: { type: Object, default: null },
  currentDepartment: { type: Object, default: null },
});

const emit = defineEmits(['saved', 'close']);

const form = ref({
  effective_from: '',
  effective_to: '',
  position_id: '',
  department_id: '',
  supervisor_id: '',
  change_reason: 'reshuffle',
  notes: '',
});

const positions = ref([]);
const departments = ref([]);
const supervisors = ref([]);
const saving = ref(false);
const error = ref('');

const changeReasons = [
  'new_hire', 'promotion', 'transfer', 'demotion',
  'reshuffle', 'resignation', 'termination', 'retirement',
];

onMounted(async () => {
  try {
    const [posRes, deptRes, supRes] = await Promise.all([
      api.get('/api/positions'),
      api.get('/api/departments'),
      api.get('/api/hr/employees', { params: { limit: 100 } }),
    ]);
    positions.value = posRes.data.positions || [];
    departments.value = deptRes.data.departments || [];
    supervisors.value = supRes.data.employees || [];

    // Pre-fill with current values
    if (props.currentPosition) form.value.position_id = props.currentPosition.id;
    if (props.currentDepartment) form.value.department_id = props.currentDepartment.id;
  } catch (e) {
    console.error('Failed to load form data', e);
  }
});

async function handleSubmit() {
  saving.value = true;
  error.value = '';
  try {
    await api.post(`/api/hr/employees/${props.employeeId}/employment-history`, form.value);
    emit('saved');
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to add employment history';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Add Employment History Entry</h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="error" class="alert alert-error shadow-lg text-sm">
          <span>{{ error }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Effective From *</span></label>
            <input v-model="form.effective_from" type="date" class="input input-bordered" required />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Effective To (leave empty if current)</span></label>
            <input v-model="form.effective_to" type="date" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Position</span></label>
            <select v-model="form.position_id" class="select select-bordered">
              <option value="">Select...</option>
              <option v-for="p in positions" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Department</span></label>
            <select v-model="form.department_id" class="select select-bordered">
              <option value="">Select...</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Supervisor</span></label>
            <select v-model="form.supervisor_id" class="select select-bordered">
              <option value="">None</option>
              <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.first_name }} {{ s.last_name }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Change Reason *</span></label>
            <select v-model="form.change_reason" class="select select-bordered" required>
              <option v-for="r in changeReasons" :key="r" :value="r">{{ r.replace('_', ' ') }}</option>
            </select>
          </div>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Notes</span></label>
          <textarea v-model="form.notes" class="textarea textarea-bordered" rows="2"></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            Add Entry
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
