<script setup>
/**
 * QRCodeDisplay.vue
 * Renders a QR code from a base64 data URL or permit ID.
 * Falls back to generating a QR code client-side using the qrcode library.
 */
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'

const props = defineProps({
  /** Base64 data URL of the QR code (from backend) */
  qrDataUrl: { type: String, default: null },
  /** Permit ID to generate QR code from (fallback) */
  permitId: { type: String, default: null },
  /** Size of the QR code in pixels */
  size: { type: Number, default: 200 },
  /** Color of the QR code */
  color: { type: String, default: '#003366' },
})

const qrSrc = ref(null)
const loading = ref(true)

async function generateQR() {
  loading.value = true
  try {
    if (props.qrDataUrl) {
      qrSrc.value = props.qrDataUrl
    } else if (props.permitId) {
      const verificationUrl = `https://westpokot.go.ke/verify/${props.permitId}`
      qrSrc.value = await QRCode.toDataURL(verificationUrl, {
        width: props.size,
        margin: 2,
        color: { dark: props.color, light: '#ffffff' },
      })
    }
  } catch (err) {
    console.error('QR generation failed:', err)
    qrSrc.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.qrDataUrl, generateQR)
watch(() => props.permitId, generateQR)
onMounted(generateQR)
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <div v-if="loading" class="loading loading-spinner loading-md text-primary"></div>
    <img
      v-else-if="qrSrc"
      :src="qrSrc"
      :width="size"
      :height="size"
      alt="QR Code"
      class="rounded-lg shadow-sm"
    />
    <p v-else class="text-sm text-gray-400">QR code unavailable</p>
    <p v-if="permitId" class="text-xs text-gray-500">Scan to verify permit</p>
  </div>
</template>
