<script setup>
/**
 * MenuItemEditor — Drag-and-drop menu item management.
 * Uses sortablejs for reordering, MenuItemForm for add/edit.
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useMenuStore } from '@/stores/menu'
import { useToast } from '@/composables/useToast'
import Sortable from 'sortablejs'
import MenuItemForm from './MenuItemForm.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { Plus, Pencil, Trash2, GripVertical } from '@lucide/vue'

const props = defineProps({
  menuId: { type: Number, required: true },
})

const emit = defineEmits(['back'])

const menuStore = useMenuStore()
const toast = useToast()

const showForm = ref(false)
const editingItem = ref(null)
const sortableInstance = ref(null)
const listEl = ref(null)

// Confirm dialog
const confirmDialog = ref(null)

// Compute parent options (all items except the one being edited)
const parentOptions = computed(() => {
  const excludeId = editingItem.value?.id
  return menuStore.currentMenuItems.filter((i) => i.id !== excludeId)
})

// Build a tree representation for display
const itemTree = computed(() => {
  const items = menuStore.currentMenuItems
  const map = {}
  const roots = []

  // Sort by sort_order
  const sorted = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  for (const item of sorted) {
    map[item.id] = { ...item, children: [] }
  }

  for (const item of sorted) {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id])
    } else {
      roots.push(map[item.id])
    }
  }

  return roots
})

function getTitle(item) {
  if (!item.title) return `Item #${item.id}`
  const title = typeof item.title === 'string' ? JSON.parse(item.title) : item.title
  return title.en || title.sw || title.pok || `Item #${item.id}`
}

function getTypeBadge(type) {
  const badges = {
    page: 'badge-info',
    category: 'badge-success',
    custom_url: 'badge-warning',
    external_link: 'badge-accent',
  }
  return badges[type] || 'badge-ghost'
}

function getUrl(item) {
  if (item.type === 'page') return `/page/${item.target_id}`
  if (item.type === 'category') return `/category/${item.target_id}`
  if (item.type === 'custom_url') return item.url || '/'
  if (item.type === 'external_link') return item.url || '#'
  return '#'
}

// ── SortableJS setup ──
async function initSortable() {
  await nextTick()
  if (!listEl.value) return

  sortableInstance.value = Sortable.create(listEl.value, {
    handle: '.drag-handle',
    animation: 200,
    ghostClass: 'opacity-30',
    onEnd: async (evt) => {
      const items = [...menuStore.currentMenuItems]
      const movedItem = items[evt.oldIndex]
      if (!movedItem) return

      // Remove from old position
      items.splice(evt.oldIndex, 1)
      // Insert at new position
      items.splice(evt.newIndex, 0, movedItem)

      // Update sort_order based on new positions
      const orderedIds = items.map((item, idx) => {
        item.sort_order = idx
        return item.id
      })

      try {
        await menuStore.reorderItems(props.menuId, orderedIds)
        toast.success('Menu items reordered')
      } catch (err) {
        toast.error('Failed to reorder items')
        // Reload to reset
        await menuStore.loadMenuItems(props.menuId)
      }
    },
  })
}

function destroySortable() {
  if (sortableInstance.value) {
    sortableInstance.value.destroy()
    sortableInstance.value = null
  }
}

// ── Lifecycle ──
onMounted(async () => {
  await menuStore.loadMenuItems(props.menuId)
  await initSortable()
})

onUnmounted(() => {
  destroySortable()
})

// ── Actions ──
function openAddForm() {
  editingItem.value = null
  showForm.value = true
}

function openEditForm(item) {
  editingItem.value = item
  showForm.value = true
}

async function handleDelete(item) {
  const confirmed = await confirmDialog.value.showDialog({
    title: 'Delete Menu Item',
    message: `Delete "${getTitle(item)}"? This will orphan any child items.`,
    variant: 'danger',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  })
  if (!confirmed) return
  try {
    await menuStore.deleteMenuItem(props.menuId, item.id)
    toast.success('Menu item deleted')
  } catch (err) {
    toast.error('Failed to delete menu item')
  }
}

function handleFormSaved() {
  showForm.value = false
  editingItem.value = null
  // Re-init sortable after items reload
  destroySortable()
  initSortable()
}

function handleFormClose() {
  showForm.value = false
  editingItem.value = null
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <button class="btn btn-ghost btn-sm" @click="$emit('back')">
          ← Back
        </button>
        <h2 class="text-xl font-bold">Menu Items</h2>
      </div>
      <button class="btn btn-primary btn-sm gap-2" @click="openAddForm">
        <Plus class="w-4 h-4" />
        Add Item
      </button>
    </div>

    <!-- Loading -->
    <div v-if="menuStore.itemsLoading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="menuStore.currentMenuItems.length === 0" class="text-center py-12 text-base-content/60">
      <p class="text-lg mb-2">No menu items yet</p>
      <p class="text-sm">Click "Add Item" to create the first menu link.</p>
    </div>

    <!-- Item list (sortable) -->
    <div v-else ref="listEl" class="space-y-1">
      <div
        v-for="item in menuStore.currentMenuItems"
        :key="item.id"
        class="flex items-center gap-2 p-3 bg-base-100 rounded-lg border border-base-200 hover:shadow-sm transition-shadow"
        :class="{ 'opacity-50': !item.is_active }"
      >
        <!-- Drag handle -->
        <button class="drag-handle cursor-grab active:cursor-grabbing btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content">
          <GripVertical class="w-4 h-4" />
        </button>

        <!-- Indentation for nested items -->
        <div v-if="item.parent_id" class="w-4 border-l-2 border-base-300 h-6 ml-1"></div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">{{ getTitle(item) }}</span>
            <span class="badge badge-xs" :class="getTypeBadge(item.type)">{{ item.type }}</span>
            <span v-if="!item.is_active" class="badge badge-ghost badge-xs">inactive</span>
          </div>
          <div class="text-xs text-base-content/50 truncate mt-0.5">
            {{ getUrl(item) }}
          </div>
        </div>

        <!-- Sort order -->
        <span class="text-xs text-base-content/40 w-8 text-right">{{ item.sort_order }}</span>

        <!-- Actions -->
        <button class="btn btn-ghost btn-xs btn-square" @click="openEditForm(item)" title="Edit">
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button class="btn btn-ghost btn-xs btn-square text-error" @click="handleDelete(item)" title="Delete">
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Item Form Modal -->
    <MenuItemForm
      v-if="showForm"
      :item="editingItem"
      :menu-id="menuId"
      :parent-options="parentOptions"
      @saved="handleFormSaved"
      @close="handleFormClose"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>
