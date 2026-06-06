<script setup>
/**
 * MenuManager — Main admin page for managing navigation menus.
 * Lists all menus (header/footer), allows CRUD, and provides access to
 * MenuItemEditor for each menu. Also includes a button to open the
 * AIPageCreator wizard for creating pages with AI assistance.
 */
import { ref, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { useToast } from '@/composables/useToast'
import MenuItemEditor from './MenuItemEditor.vue'
import AIPageCreator from './AIPageCreator.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { Plus, Pencil, Trash2, ListTree, Sparkles } from '@lucide/vue'

const menuStore = useMenuStore()
const toast = useToast()

const showCreateForm = ref(false)
const editingMenu = ref(null)
const selectedMenuId = ref(null)
const showAiCreator = ref(false)

const createForm = ref({
  name: '',
  location: 'header',
})

const saving = ref(false)

// Confirm dialog
const confirmDialog = ref(null)

onMounted(async () => {
  await menuStore.loadMenus()
})

// ── Menu CRUD ──
function openCreateForm() {
  editingMenu.value = null
  createForm.value = { name: '', location: 'header' }
  showCreateForm.value = true
}

function openEditForm(menu) {
  editingMenu.value = menu
  createForm.value = { name: menu.name, location: menu.location }
  showCreateForm.value = true
}

async function handleSaveMenu() {
  saving.value = true
  try {
    if (editingMenu.value) {
      await menuStore.updateMenu(editingMenu.value.id, { name: createForm.value.name })
      toast.success('Menu updated')
    } else {
      await menuStore.createMenu(createForm.value)
      toast.success('Menu created')
    }
    showCreateForm.value = false
    editingMenu.value = null
  } catch (err) {
    toast.error(err.response?.data?.error || err.message)
  } finally {
    saving.value = false
  }
}

async function handleDeleteMenu(menu) {
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Delete Menu',
    message: `Delete menu "${menu.name}"? This will also delete all its items.`,
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  try {
    await menuStore.deleteMenu(menu.id)
    if (selectedMenuId.value === menu.id) {
      selectedMenuId.value = null
    }
    toast.success('Menu deleted')
  } catch (err) {
    toast.error('Failed to delete menu')
  }
}

function selectMenu(menuId) {
  selectedMenuId.value = menuId
}

function goBack() {
  selectedMenuId.value = null
}

// ── AI Page Creator ──
function openAiCreator() {
  showAiCreator.value = true
}

function handleAiPageCreated() {
  showAiCreator.value = false
  toast.success('Page created as draft! You can now link it in menu items.')
  // Refresh published pages in the store
  menuStore.loadPublishedPages()
}

// ── Helpers ──
function locationLabel(loc) {
  return loc === 'header' ? 'Header Navigation' : 'Footer Navigation'
}

function itemCount(menu) {
  return menu.items_count ?? menu.items?.length ?? 0
}
</script>

<template>
  <div>
    <!-- If a menu is selected, show the item editor -->
    <MenuItemEditor
      v-if="selectedMenuId"
      :menu-id="selectedMenuId"
      @back="goBack"
    />

    <!-- Otherwise show the menu list -->
    <template v-else>
      <!-- Page header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">Navigation Menus</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Manage header and footer navigation menus for the public website.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="btn btn-outline btn-sm gap-2" @click="openAiCreator">
            <Sparkles class="w-4 h-4" />
            AI Page Creator
          </button>
          <button class="btn btn-primary btn-sm gap-2" @click="openCreateForm">
            <Plus class="w-4 h-4" />
            New Menu
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="menuStore.loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Empty state -->
      <div v-else-if="menuStore.menus.length === 0" class="text-center py-16 text-base-content/60">
        <p class="text-lg mb-2">No menus yet</p>
        <p class="text-sm">Create a header and footer menu to get started.</p>
      </div>

      <!-- Menu cards -->
      <div v-else class="grid gap-4 md:grid-cols-2">
        <div
          v-for="menu in menuStore.menus"
          :key="menu.id"
          class="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="card-body p-5">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="card-title text-lg">{{ menu.name }}</h3>
                <span class="badge badge-sm mt-1" :class="menu.location === 'header' ? 'badge-primary' : 'badge-secondary'">
                  {{ locationLabel(menu.location) }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <button class="btn btn-ghost btn-xs btn-square" @click="openEditForm(menu)" title="Edit menu">
                  <Pencil class="w-3.5 h-3.5" />
                </button>
                <button class="btn btn-ghost btn-xs btn-square text-error" @click="handleDeleteMenu(menu)" title="Delete menu">
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <span class="text-sm text-base-content/60">
                {{ itemCount(menu) }} item{{ itemCount(menu) !== 1 ? 's' : '' }}
              </span>
              <button class="btn btn-outline btn-sm gap-2" @click="selectMenu(menu.id)">
                <ListTree class="w-4 h-4" />
                Manage Items
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Create/Edit Menu Modal (DaisyUI dialog) -->
      <dialog
        :open="showCreateForm"
        class="modal modal-bottom sm:modal-middle"
        @click.self="showCreateForm = false"
      >
        <div class="modal-box max-w-md">
          <h3 class="font-bold text-lg mb-4">
            {{ editingMenu ? 'Edit Menu' : 'Create Menu' }}
          </h3>

          <form @submit.prevent="handleSaveMenu" class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Menu Name *</span></label>
              <input
                v-model="createForm.name"
                class="input input-bordered"
                required
                placeholder="e.g. Main Navigation"
              />
            </div>

            <div v-if="!editingMenu" class="form-control">
              <label class="label"><span class="label-text">Location *</span></label>
              <select v-model="createForm.location" class="select select-bordered" required>
                <option value="header">Header Navigation</option>
                <option value="footer">Footer Navigation</option>
              </select>
            </div>

            <div class="modal-action">
              <button type="button" class="btn btn-ghost" @click="showCreateForm = false">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                <span v-if="saving" class="loading loading-spinner loading-sm"></span>
                {{ editingMenu ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button @click="showCreateForm = false">close</button>
        </form>
      </dialog>

      <!-- AI Page Creator Modal -->
      <AIPageCreator
        v-if="showAiCreator"
        @close="showAiCreator = false"
        @created="handleAiPageCreated"
      />
    </template>

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>
