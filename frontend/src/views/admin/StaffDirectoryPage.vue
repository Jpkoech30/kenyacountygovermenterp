<script setup>
/**
 * StaffDirectoryPage.vue — Admin view of all staff members with linked user accounts.
 * Shows photo cards with name, title, department, and account status.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchStaffDirectory } from '../../api/persona'
import { fetchDepartments } from '../../api/public'
import { useToast } from '../../composables/useToast'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import apiClient from '../../api/axios'
import {
  Plus, UserCircle, Pencil, Trash2, Mail, Shield, Building2, Search, X
} from '@lucide/vue'

const router = useRouter()
const { addToast } = useToast()

const staff = ref([])
const departments = ref([])
const loading = ref(true)
const searchQuery = ref('')
const filterDepartment = ref(null)
const confirmDialog = ref(null)

async function loadData() {
  loading.value = true
  try {
    const [staffRes, deptRes] = await Promise.all([
      fetchStaffDirectory(filterDepartment.value ? { department_id: filterDepartment.value } : {}),
      fetchDepartments(),
    ])
    staff.value = staffRes.staff || []
    departments.value = deptRes || []
  } catch (err) {
    addToast('Failed to load staff directory.', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const filteredStaff = computed(() => {
  let result = staff.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.user?.email?.toLowerCase().includes(q)
    )
  }
  return result
})

function getInitials(name) {
  if (!name || !name.trim()) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function getPhotoUrl(person) {
  if (!person.photo) return null
  return `/media/${person.photo.disk_filename}`
}

function getDepartmentName(person) {
  return person.user?.department?.name || null
}

function navigateToCreate() {
  router.push({ name: 'StaffCreate' })
}

async function confirmDelete(person) {
  const confirmed = await confirmDialog.value?.confirm({
    title: 'Delete Staff Member',
    message: `Are you sure you want to delete "${person.name}"? This will remove their public profile.`,
    confirmLabel: 'Delete',
    variant: 'error',
  })
  if (!confirmed) return

  try {
    await apiClient.delete(`/admin/persons/${person.id}`)
    addToast('Staff member deleted.', 'success')
    staff.value = staff.value.filter((s) => s.id !== person.id)
  } catch (err) {
    addToast('Failed to delete staff member.', 'error')
  }
}
</script>

<template>
  <div class="content-section">
    <div class="content-section-header">
      <div>
        <h2 class="content-section-title">Staff Directory</h2>
        <p class="text-sm text-base-content/60">{{ staff.length }} staff members</p>
      </div>
      <button @click="navigateToCreate" class="btn btn-primary btn-sm gap-2">
        <Plus class="w-4 h-4" /> Create Staff
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="join flex-1 max-w-xs">
        <div class="join-item flex items-center px-3 bg-base-200 border border-base-300 border-r-0 rounded-l-lg">
          <Search class="w-4 h-4 text-base-content/40" />
        </div>
        <input
          v-model="searchQuery"
          type="text"
          class="input input-bordered join-item flex-1 min-w-0 border-l-0 rounded-r-lg"
          placeholder="Search by name, title, or email..."
        />
      </div>
      <select v-model="filterDepartment" class="select select-bordered select-sm">
        <option :value="null">All Departments</option>
        <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
      <button v-if="searchQuery || filterDepartment" @click="searchQuery = ''; filterDepartment = null; loadData()" class="btn btn-ghost btn-sm gap-1">
        <X class="w-3 h-3" /> Clear
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredStaff.length === 0" class="text-center py-12 text-base-content/50">
      <UserCircle class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p class="font-medium">No staff members found</p>
      <p class="text-sm mt-1">Create your first staff member using the wizard.</p>
    </div>

    <!-- Staff Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="person in filteredStaff"
        :key="person.id"
        class="card bg-base-100 border border-base-300 hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden group"
      >
        <!-- Photo -->
        <div class="h-32 bg-gradient-to-br from-primary/10 to-base-200 flex items-center justify-center relative">
          <img
            v-if="getPhotoUrl(person)"
            :src="getPhotoUrl(person)"
            :alt="person.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <span v-else class="text-2xl font-bold text-primary/60">{{ getInitials(person.name) }}</span>
          <!-- Actions overlay -->
          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              @click="router.push({ name: 'StaffCreate', query: { edit: person.id } })"
              class="btn btn-xs btn-circle btn-ghost bg-base-100/80 hover:bg-base-100"
              title="Edit"
            >
              <Pencil class="w-3 h-3" />
            </button>
            <button
              @click="confirmDelete(person)"
              class="btn btn-xs btn-circle btn-ghost bg-base-100/80 hover:bg-base-100 hover:text-error"
              title="Delete"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- Info -->
        <div class="p-4 space-y-2">
          <div>
            <h3 class="font-semibold text-sm truncate">{{ person.name }}</h3>
            <p class="text-xs text-base-content/60 truncate">{{ person.title }}</p>
          </div>

          <!-- Department -->
          <div v-if="getDepartmentName(person)" class="flex items-center gap-1.5 text-xs text-base-content/50">
            <Building2 class="w-3 h-3" />
            <span class="truncate">{{ getDepartmentName(person) }}</span>
          </div>

          <!-- Account Status -->
          <div class="flex items-center gap-2 pt-1">
            <div
              v-if="person.user"
              class="flex items-center gap-1 text-xs text-success"
            >
              <Shield class="w-3 h-3" />
              <span>Has Account</span>
            </div>
            <div
              v-else
              class="flex items-center gap-1 text-xs text-base-content/40"
            >
              <Mail class="w-3 h-3" />
              <span>No Login</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>
