<script setup>
/**
 * CampaignCoverageChart.vue
 * Bar chart component for reached vs target campaign coverage.
 * Uses Chart.js via a canvas element with a simple bar chart implementation.
 * DaisyUI card and badge components for the container.
 */
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  coverage: {
    type: Object,
    default: () => ({ campaign: null, totalTarget: 0, totalReached: 0, participants: [] }),
  },
  loading: { type: Boolean, default: false },
})

const canvasRef = ref(null)
let chartInstance = null

const coveragePercent = computed(() => {
  if (!props.coverage.totalTarget || props.coverage.totalTarget === 0) return 0
  return Math.round((props.coverage.totalReached / props.coverage.totalTarget) * 100)
})

const locations = computed(() => {
  if (!props.coverage.participants || props.coverage.participants.length === 0) return []
  const locMap = {}
  props.coverage.participants.forEach((p) => {
    const loc = p.patient?.village || 'Unknown'
    locMap[loc] = (locMap[loc] || 0) + 1
  })
  return Object.entries(locMap).map(([name, count]) => ({ name, count }))
})

async function initChart() {
  if (!canvasRef.value) return

  // Dynamically import Chart.js
  const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } = await import('chart.js')
  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const labels = locations.value.length > 0
    ? locations.value.map((l) => l.name)
    : ['No data']

  const data = locations.value.length > 0
    ? locations.value.map((l) => l.count)
    : [0]

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Participants',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
        },
      },
    },
  })
}

onMounted(() => {
  if (!props.loading) initChart()
})

watch(
  () => props.coverage,
  () => {
    if (!props.loading) initChart()
  },
  { deep: true }
)
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
        Campaign Coverage
      </h2>

      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <template v-else-if="coverage.campaign">
        <div class="stats stats-vertical shadow mb-4">
          <div class="stat">
            <div class="stat-title">Campaign</div>
            <div class="stat-value text-lg">{{ coverage.campaign.name }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">Coverage</div>
            <div class="stat-value">{{ coverage.totalReached }} / {{ coverage.totalTarget }}</div>
            <div class="stat-desc">
              <div class="radial-progress text-primary" :style="{ '--value': coveragePercent }" role="progressbar">
                {{ coveragePercent }}%
              </div>
            </div>
          </div>
        </div>

        <!-- Bar chart -->
        <div v-if="locations.length > 0" class="h-64">
          <canvas ref="canvasRef"></canvas>
        </div>
        <div v-else class="text-center py-8 text-base-content/60">
          No participant data available for this campaign.
        </div>
      </template>

      <div v-else class="text-center py-8 text-base-content/60">
        Select a campaign to view coverage details.
      </div>
    </div>
  </div>
</template>
