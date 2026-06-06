<script setup>
/**
 * User List Page (Admin only)
 * Displays paginated table of users with filters and actions.
 * Actions: Edit, Delete (soft), Reset Guide, Toggle AI Assist.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/users'
import { useAuthStore } from '../../stores/auth'
import apiClient from '../../api/axios'
import { useToast } from '../../composables/useToast'

const { addToast } = useToast()

const userStore = useUserStore()
const authStore = useAuthStore()
const router = useRouter()

// Filters
const filters = ref({
  page: 1,
  limit: 10,
  role: '',
  department: '',
  is_active: '',
  search: '',
})

// Dropdown options (loaded from API)
const departments = ref([])
const roles = ref([])

// Delete confirmation modal
const showDeleteModal = ref(false)
const userToDelete = ref(null)

let searchTimeout = null

// Fetch users when filters change
async function loadUsers() {
  const params = { page: filters.value.page, limit: filters.value.limit }
  if (filters.value.role) params.role = filters.value.role
  if (filters.value.department) params.department = filters.value.department
  if (filters.value.is_active) params.is_active = filters.value.is_active
  if (filters.value.search) params.search = filters.value.search

  try {
    await userStore.fetchUsers(params)
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to load users', 'error')
  }
}

// Load filter dropdown options from API
async function loadFilterOptions() {
  try {
    const [deptRes, rolesRes] = await Promise.all([
      apiClient.get('/departments'),
      apiClient.get('/roles'),
    ])
    departments.value = deptRes.data
    roles.value = rolesRes.data
  } catch (err) {
    console.error('Failed to load filter options:', err)
  }
}

// Debounced search
function onSearchInput() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.page = 1
    loadUsers()
  }, 400)
}

// Pagination
function goToPage(page) {
  if (page < 1 || page > userStore.pagination.totalPages) return
  filters.value.page = page
  loadUsers()
}

// Delete user
function confirmDelete(user) {
  userToDelete.value = user
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!userToDelete.value) return
  try {
    await userStore.deleteUser(userToDelete.value.id)
    addToast(`User ${userToDelete.value.email} deactivated successfully`)
    showDeleteModal.value = false
    userToDelete.value = null
    // Reload current page
    loadUsers()
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to delete user', 'error')
  }
}

// Reset guide
async function handleResetGuide(user) {
  try {
    await userStore.resetGuide(user.id)
    addToast(`Guide progress reset for ${user.email}`)
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to reset guide', 'error')
  }
}

// Toggle AI Assist
async function handleToggleAiAssist(user) {
  try {
    const newValue = !user.allow_ai_assist
    await userStore.updateUser(user.id, { allow_ai_assist: newValue })
    user.allow_ai_assist = newValue
    addToast(`AI Assist ${newValue ? 'enabled' : 'disabled'} for ${user.email}`)
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to update AI Assist access', 'error')
  }
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadFilterOptions()
  loadUsers()
})
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold">User Management</h1>
        <p class="text-base-content/60 text-sm">Manage all system users</p>
      </div>
      <router-link to="/admin/users/add" class="btn btn-primary">
        ➕ Add User
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow-sm mb-4">
      <div class="card-body p-4">
        <div class="flex flex-wrap gap-3 items-end">
          <!-- Search -->
          <div class="form-control flex-1 min-w-[200px]">
            <label class="label py-1">
              <span class="label-text">Search</span>
            </label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Search by name or email..."
              class="input input-bordered input-sm"
              @input="onSearchInput"
            />
          </div>

          <!-- Role filter -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text">Role</span>
            </label>
            <select v-model="filters.role" class="select select-bordered select-sm" @change="loadUsers">
              <option value="">All Roles</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name.replace(/_/g, ' ') }}
              </option>
            </select>
          </div>

          <!-- Department filter -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text">Department</span>
            </label>
            <select v-model="filters.department" class="select select-bordered select-sm" @change="loadUsers">
              <option value="">All Departments</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </div>

          <!-- Status filter -->
          <div class="form-control">
            <label class="label py-1">
              <span class="label-text">Status</span>
            </label>
            <select v-model="filters.is_active" class="select select-bordered select-sm" @change="loadUsers">
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Users table -->
    <div class="card bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>AI Assist</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="userStore.loading && userStore.users.length === 0">
              <td colspan="8" class="text-center py-8">
                <span class="loading loading-spinner loading-md"></span>
                <p class="mt-2 text-sm text-base-content/60">Loading users...</p>
              </td>
            </tr>
            <tr v-else-if="userStore.users.length === 0">
              <td colspan="8" class="text-center py-8 text-base-content/60">
                No users found.
              </td>
            </tr>
            <tr v-for="user in userStore.users" :key="user.id">
              <td class="font-mono text-sm">{{ user.email }}</td>
              <td>{{ user.first_name }} {{ user.last_name }}</td>
              <td>{{ user.department?.name || '—' }}</td>
              <td>
                <span class="badge badge-outline badge-sm">{{ user.role?.name }}</span>
              </td>
              <td>
                <span
                  class="badge badge-sm"
                  :class="user.is_active ? 'badge-success' : 'badge-error'"
                >
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <input
                  type="checkbox"
                  class="toggle toggle-sm toggle-secondary"
                  :checked="user.allow_ai_assist"
                  :disabled="!user.is_active"
                  @change="handleToggleAiAssist(user)"
                  :title="user.allow_ai_assist ? 'Disable AI Assist' : 'Enable AI Assist'"
                />
              </td>
              <td class="text-sm text-base-content/60">{{ formatDate(user.last_login) }}</td>
              <td>
                <div class="flex gap-1">
                  <button
                    class="btn btn-ghost btn-xs"
                    title="Edit user"
                    @click="router.push(`/admin/users/${user.id}/edit`)"
                  >
                    ✏️
                  </button>
                  <button
                    class="btn btn-ghost btn-xs"
                    title="Reset guide"
                    @click="handleResetGuide(user)"
                  >
                    🔄
                  </button>
                  <button
                    class="btn btn-ghost btn-xs text-error"
                    title="Deactivate user"
                    @click="confirmDelete(user)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="userStore.pagination.totalPages > 1" class="flex justify-between items-center p-4 border-t border-base-200">
        <span class="text-sm text-base-content/60">
          Page {{ userStore.pagination.page }} of {{ userStore.pagination.totalPages }}
          ({{ userStore.pagination.total }} total)
        </span>
        <div class="join">
          <button
            class="join-item btn btn-sm"
            :disabled="userStore.pagination.page <= 1"
            @click="goToPage(userStore.pagination.page - 1)"
          >
            «
          </button>
          <button
            v-for="p in userStore.pagination.totalPages"
            :key="p"
            class="join-item btn btn-sm"
            :class="{ 'btn-active': p === userStore.pagination.page }"
            @click="goToPage(p)"
          >
            {{ p }}
          </button>
          <button
            class="join-item btn btn-sm"
            :disabled="userStore.pagination.page >= userStore.pagination.totalPages"
            @click="goToPage(userStore.pagination.page + 1)"
          >
            »
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <dialog :open="showDeleteModal" class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Confirm Deactivation</h3>
        <p class="py-4">
          Are you sure you want to deactivate
          <strong>{{ userToDelete?.first_name }} {{ userToDelete?.last_name }}</strong>
          ({{ userToDelete?.email }})?
        </p>
        <p class="text-sm text-base-content/60 mb-4">
          This will prevent the user from logging in. You can reactivate them later.
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showDeleteModal = false">Cancel</button>
          <button class="btn btn-error" @click="handleDelete">Deactivate</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showDeleteModal = false">close</button>
      </form>
    </dialog>

  </div>
</template>
