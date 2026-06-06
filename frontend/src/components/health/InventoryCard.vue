<script setup>
/**
 * InventoryCard.vue
 * Dashboard widget showing low stock count and expiring items.
 * Uses DaisyUI card, badge, and stat components.
 */
defineProps({
  lowStockCount: { type: Number, default: 0 },
  expiringCount: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        Inventory Overview
      </h2>
      <div v-if="loading" class="flex justify-center py-4">
        <span class="loading loading-spinner loading-md"></span>
      </div>
      <div v-else class="stats stats-vertical shadow">
        <div class="stat">
          <div class="stat-title">Total Items</div>
          <div class="stat-value text-primary">{{ totalItems }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Low Stock</div>
          <div class="stat-value text-warning" :class="{ 'text-error': lowStockCount > 0 }">
            {{ lowStockCount }}
          </div>
          <div v-if="lowStockCount > 0" class="stat-desc">
            <span class="badge badge-warning badge-sm">Reorder needed</span>
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Expiring Soon</div>
          <div class="stat-value text-error">{{ expiringCount }}</div>
          <div v-if="expiringCount > 0" class="stat-desc">
            <span class="badge badge-error badge-sm">Check expiry dates</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
