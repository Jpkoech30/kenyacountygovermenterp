<script setup>
/**
 * AttendancePage.vue
 * Attendance management page.
 * Shows attendance logs and allows check-in/check-out.
 */
import { ref, onMounted } from 'vue';
import { useHrStore } from '../../../stores/hr';
import AttendanceClock from '../../../components/hr/AttendanceClock.vue';

const hrStore = useHrStore();
const dateRange = ref({
  start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
});

onMounted(async () => {
  await hrStore.fetchMyAttendance(dateRange.value);
});

async function handleCheckIn(data) {
  try {
    await hrStore.checkIn(data);
    await hrStore.fetchMyAttendance(dateRange.value);
  } catch (err) {
    alert(err.response?.data?.error || 'Check-in failed');
  }
}

async function handleCheckOut(data) {
  try {
    await hrStore.checkOut(data);
    await hrStore.fetchMyAttendance(dateRange.value);
  } catch (err) {
    alert(err.response?.data?.error || 'Check-out failed');
  }
}

async function refreshLogs() {
  await hrStore.fetchMyAttendance(dateRange.value);
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Attendance</h1>
      <p class="text-base-content/60">Check in/out and view attendance logs</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Attendance Clock -->
      <div class="lg:col-span-1">
        <AttendanceClock @check-in="handleCheckIn" @check-out="handleCheckOut" />
      </div>

      <!-- Attendance Logs -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <h3 class="card-title">Attendance Logs</h3>
              <button class="btn btn-sm btn-ghost" @click="refreshLogs">Refresh</button>
            </div>

            <!-- Date Filter -->
            <div class="flex gap-4 mb-4">
              <div class="form-control">
                <label class="label"><span class="label-text">From</span></label>
                <input v-model="dateRange.start_date" type="date" class="input input-bordered input-sm"
                  @change="refreshLogs" />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">To</span></label>
                <input v-model="dateRange.end_date" type="date" class="input input-bordered input-sm"
                  @change="refreshLogs" />
              </div>
            </div>

            <!-- Loading -->
            <div v-if="hrStore.loading" class="flex justify-center py-8">
              <span class="loading loading-spinner loading-md"></span>
            </div>

            <!-- Logs Table -->
            <div v-else class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Duration</th>
                    <th>Source</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in hrStore.attendanceLogs" :key="log.id">
                    <td>{{ new Date(log.check_in).toLocaleDateString() }}</td>
                    <td>{{ new Date(log.check_in).toLocaleTimeString() }}</td>
                    <td>{{ log.check_out ? new Date(log.check_out).toLocaleTimeString() : '-' }}</td>
                    <td>
                      <span v-if="log.check_out" class="badge badge-ghost badge-sm">
                        {{ Math.round((new Date(log.check_out) - new Date(log.check_in)) / 3600000) }}h
                      </span>
                      <span v-else class="badge badge-warning badge-sm">Active</span>
                    </td>
                    <td><span class="badge badge-ghost badge-sm">{{ log.source }}</span></td>
                    <td class="max-w-xs truncate">{{ log.notes || '-' }}</td>
                  </tr>
                  <tr v-if="hrStore.attendanceLogs.length === 0">
                    <td colspan="6" class="text-center py-8 text-base-content/60">No attendance records</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
