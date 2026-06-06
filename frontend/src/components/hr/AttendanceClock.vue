<script setup>
/**
 * AttendanceClock.vue
 * Check-in/Check-out component with GPS capture.
 * Used by employees for web-based attendance.
 */
import { ref, onMounted } from 'vue';

const emit = defineEmits(['checkIn', 'checkOut']);

const currentTime = ref(new Date().toLocaleTimeString());
const gpsStatus = ref('idle');
const gpsCoords = ref({ latitude: null, longitude: null });
const checkingIn = ref(false);
const checkingOut = ref(false);
const notes = ref('');

onMounted(() => {
  updateClock();
  setInterval(updateClock, 1000);
});

function updateClock() {
  currentTime.value = new Date().toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Nairobi',
  });
}

async function captureGPS() {
  if (!navigator.geolocation) {
    gpsStatus.value = 'unavailable';
    return;
  }
  gpsStatus.value = 'capturing';
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
    gpsCoords.value = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    gpsStatus.value = 'captured';
  } catch (err) {
    gpsStatus.value = 'error';
    console.warn('GPS capture failed:', err.message);
  }
}

async function handleCheckIn() {
  checkingIn.value = true;
  await captureGPS();
  emit('checkIn', {
    gps_latitude: gpsCoords.value.latitude,
    gps_longitude: gpsCoords.value.longitude,
    source: 'web',
    notes: notes.value || undefined,
  });
  checkingIn.value = false;
}

async function handleCheckOut() {
  checkingOut.value = true;
  await captureGPS();
  emit('checkOut', {
    gps_latitude: gpsCoords.value.latitude,
    gps_longitude: gpsCoords.value.longitude,
    notes: notes.value || undefined,
  });
  checkingOut.value = false;
}
</script>

<template>
  <div class="card bg-base-100 shadow-sm">
    <div class="card-body items-center text-center">
      <!-- Clock Display -->
      <div class="text-4xl font-mono font-bold mb-2">{{ currentTime }}</div>
      <p class="text-sm text-base-content/60 mb-6">East Africa Time (EAT)</p>

      <!-- GPS Status -->
      <div class="badge mb-4" :class="{
        'badge-success': gpsStatus === 'captured',
        'badge-warning': gpsStatus === 'capturing',
        'badge-error': gpsStatus === 'error',
        'badge-ghost': gpsStatus === 'idle' || gpsStatus === 'unavailable',
      }">
        {{ gpsStatus === 'captured' ? '📍 GPS Captured' :
           gpsStatus === 'capturing' ? '📍 Capturing GPS...' :
           gpsStatus === 'error' ? '📍 GPS Error' :
           gpsStatus === 'unavailable' ? '📍 GPS Unavailable' :
           '📍 GPS Not Captured' }}
      </div>

      <!-- Notes -->
      <div class="form-control w-full max-w-xs mb-6">
        <input v-model="notes" type="text" placeholder="Optional notes..." class="input input-bordered input-sm" />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4">
        <button class="btn btn-success btn-lg" @click="handleCheckIn" :disabled="checkingIn">
          <span v-if="checkingIn" class="loading loading-spinner"></span>
          <span v-else>⬇️</span>
          Check In
        </button>
        <button class="btn btn-error btn-lg" @click="handleCheckOut" :disabled="checkingOut">
          <span v-if="checkingOut" class="loading loading-spinner"></span>
          <span v-else>⬆️</span>
          Check Out
        </button>
      </div>
    </div>
  </div>
</template>
