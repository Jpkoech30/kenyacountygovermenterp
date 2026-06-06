<script setup>
/**
 * ChvHouseholdsPage.vue
 * CHV view of their assigned households with member details.
 */
import { ref, onMounted } from 'vue'
import { useCommunityHealthStore } from '../../../stores/communityHealth'

const store = useCommunityHealthStore()
const loading = ref(false)
const selectedHousehold = ref(null)
const showDetailModal = ref(false)

onMounted(async () => {
  await loadHouseholds()
})

async function loadHouseholds() {
  loading.value = true
  try {
    await store.fetchChvHouseholds()
  } finally {
    loading.value = false
  }
}

async function viewHousehold(hh) {
  selectedHousehold.value = hh
  await store.fetchHouseholdMembers(hh.id)
  showDetailModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">My Households</h1>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="store.chvHouseholds.length === 0" class="col-span-full text-center text-base-content/60 py-8">
        No households assigned to you.
      </div>
      <div v-for="hh in store.chvHouseholds" :key="hh.id" class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer" @click="viewHousehold(hh)">
        <div class="card-body">
          <div class="flex justify-between items-start">
            <h3 class="card-title text-lg">{{ hh.household_head }}</h3>
            <span class="badge badge-sm" :class="hh.status === 'active' ? 'badge-success' : 'badge-ghost'">{{ hh.status }}</span>
          </div>
          <p class="text-sm"><code>{{ hh.household_number }}</code></p>
          <p class="text-sm" v-if="hh.village">{{ hh.village }}</p>
          <div class="flex gap-4 mt-2 text-sm">
            <span>👨‍👩‍👧‍👦 {{ hh.family_size || 0 }}</span>
            <span>🛏️ {{ hh.number_of_rooms || 0 }}</span>
          </div>
          <div class="flex gap-2 mt-2">
            <span v-if="hh.has_electricity" class="badge badge-xs badge-info">Electricity</span>
            <span v-if="hh.has_improved_sanitation" class="badge badge-xs badge-success">Sanitation</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <dialog :open="showDetailModal" class="modal" @click.self="showDetailModal = false">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg">{{ selectedHousehold?.household_head }}'s Household</h3>
        <p class="text-sm"><code>{{ selectedHousehold?.household_number }}</code></p>

        <div v-if="selectedHousehold" class="grid grid-cols-2 gap-2 mt-4">
          <div><span class="font-semibold">Village:</span> {{ selectedHousehold.village || 'N/A' }}</div>
          <div><span class="font-semibold">Family Size:</span> {{ selectedHousehold.family_size || 0 }}</div>
          <div><span class="font-semibold">Electricity:</span> {{ selectedHousehold.has_electricity ? 'Yes' : 'No' }}</div>
          <div><span class="font-semibold">Sanitation:</span> {{ selectedHousehold.has_improved_sanitation ? 'Improved' : 'Basic' }}</div>
          <div><span class="font-semibold">Water Source:</span> {{ selectedHousehold.main_water_source || 'N/A' }}</div>
        </div>

        <div class="divider"></div>
        <h4 class="font-semibold mb-2">Members</h4>
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Relationship</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.householdMembers.length === 0">
                <td colspan="4" class="text-center text-base-content/60">No members.</td>
              </tr>
              <tr v-for="member in store.householdMembers" :key="member.id">
                <td>{{ member.full_name }} <span v-if="member.is_head" class="badge badge-xs badge-primary">Head</span></td>
                <td>{{ member.gender }}</td>
                <td>{{ member.date_of_birth ? new Date().getFullYear() - new Date(member.date_of_birth).getFullYear() : '-' }}</td>
                <td>{{ member.relationship_to_head }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-action">
          <button class="btn" @click="showDetailModal = false">Close</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showDetailModal = false">close</button></form>
    </dialog>
  </div>
</template>
