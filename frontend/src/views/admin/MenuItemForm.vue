<script setup>
import { ref, watch, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'

const props = defineProps({
  item: { type: Object, default: null },
  menuId: { type: Number, required: true },
  parentOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const menuStore = useMenuStore()

const form = ref({
  title_en: '',
  title_sw: '',
  title_pok: '',
  type: 'page',
  target_id: null,
  url: '',
  parent_id: null,
  sort_order: 0,
  is_active: true,
})

const saving = ref(false)
const saveError = ref(null)

// Load lookup data on mount
onMounted(async () => {
  await Promise.all([
    menuStore.loadPublishedPages(),
    menuStore.loadCategories(),
  ])
  if (props.item) {
    const title = typeof props.item.title === 'object' ? props.item.title : { en: props.item.title || '' }
    form.value = {
      title_en: title.en || title[''] || '',
      title_sw: title.sw || '',
      title_pok: title.pok || '',
      type: props.item.type || 'page',
      target_id: props.item.target_id,
      url: props.item.url || '',
      parent_id: props.item.parent_id,
      sort_order: props.item.sort_order ?? 0,
      is_active: props.item.is_active ?? true,
    }
  }
})

async function handleSave() {
  saving.value = true
  saveError.value = null
  try {
    const payload = {
      title: {
        en: form.value.title_en,
        sw: form.value.title_sw,
        pok: form.value.title_pok,
      },
      type: form.value.type,
      target_id: form.value.type === 'page' || form.value.type === 'category' ? form.value.target_id : null,
      url: form.value.type === 'custom_url' || form.value.type === 'external_link' ? form.value.url : null,
      parent_id: form.value.parent_id || null,
      sort_order: parseInt(form.value.sort_order) || 0,
      is_active: form.value.is_active,
    }

    if (props.item) {
      await menuStore.updateMenuItem(props.menuId, props.item.id, payload)
    } else {
      await menuStore.createMenuItem(props.menuId, payload)
    }
    emit('saved')
  } catch (err) {
    saveError.value = err.response?.data?.error || err.message
  } finally {
    saving.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="handleClose">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-4">
        {{ item ? 'Edit Menu Item' : 'Add Menu Item' }}
      </h3>

      <div v-if="saveError" class="alert alert-error mb-4">
        <span>{{ saveError }}</span>
      </div>

      <form @submit.prevent="handleSave" class="space-y-3">
        <!-- Title (multilingual) -->
        <div class="form-control">
          <label class="label"><span class="label-text">Title (English) *</span></label>
          <input v-model="form.title_en" class="input input-bordered" required placeholder="e.g. About Us" />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Title (Swahili)</span></label>
          <input v-model="form.title_sw" class="input input-bordered" placeholder="e.g. Kuhusu Sisi" />
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text">Title (Pokot)</span></label>
          <input v-model="form.title_pok" class="input input-bordered" placeholder="e.g. Kipkano" />
        </div>

        <!-- Type -->
        <div class="form-control">
          <label class="label"><span class="label-text">Link Type *</span></label>
          <select v-model="form.type" class="select select-bordered" required>
            <option value="page">Page</option>
            <option value="category">Category</option>
            <option value="custom_url">Custom URL (relative)</option>
            <option value="external_link">External Link</option>
          </select>
        </div>

        <!-- Target (page or category) -->
        <div v-if="form.type === 'page'" class="form-control">
          <label class="label"><span class="label-text">Select Page *</span></label>
          <select v-model="form.target_id" class="select select-bordered" required>
            <option :value="null" disabled>-- Select a page --</option>
            <option v-for="p in menuStore.publishedPages" :key="p.id" :value="p.id">
              {{ p.title }}
            </option>
          </select>
        </div>

        <div v-if="form.type === 'category'" class="form-control">
          <label class="label"><span class="label-text">Select Category *</span></label>
          <select v-model="form.target_id" class="select select-bordered" required>
            <option :value="null" disabled>-- Select a category --</option>
            <option v-for="c in menuStore.categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
        </div>

        <!-- URL (custom or external) -->
        <div v-if="form.type === 'custom_url'" class="form-control">
          <label class="label"><span class="label-text">Relative URL *</span></label>
          <input v-model="form.url" class="input input-bordered" placeholder="e.g. /events" />
        </div>

        <div v-if="form.type === 'external_link'" class="form-control">
          <label class="label"><span class="label-text">External URL *</span></label>
          <input v-model="form.url" class="input input-bordered" placeholder="e.g. https://example.com" />
        </div>

        <!-- Parent Item (for nesting) -->
        <div class="form-control">
          <label class="label"><span class="label-text">Parent Item (optional)</span></label>
          <select v-model="form.parent_id" class="select select-bordered">
            <option :value="null">None (top-level)</option>
            <option v-for="p in parentOptions" :key="p.id" :value="p.id" :disabled="p.id === item?.id">
              {{ typeof p.title === 'object' ? (p.title.en || p.title[''] || 'Item #' + p.id) : (p.title || 'Item #' + p.id) }}
            </option>
          </select>
        </div>

        <!-- Sort Order -->
        <div class="form-control">
          <label class="label"><span class="label-text">Sort Order</span></label>
          <input v-model.number="form.sort_order" type="number" class="input input-bordered" min="0" />
        </div>

        <!-- Active -->
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">Active</span>
            <input v-model="form.is_active" type="checkbox" class="toggle toggle-primary" />
          </label>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="handleClose">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            {{ item ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
