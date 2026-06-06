<script setup>
/**
 * SettingsPage.vue - Admin settings panel for CMS configuration.
 * Manages LLM (DeepSeek) settings, site metadata, AI Assist, and general configuration.
 */
import { ref, onMounted } from 'vue'
import apiClient from '../../api/axios'
import { useToast } from '../../composables/useToast'

const { addToast } = useToast()

// Settings form
const settings = ref({})
const loading = ref(true)
const saving = ref(false)

// AI Assist usage summary
const aiUsageSummary = ref(null)
const aiUsageLoading = ref(false)

// Load settings
async function loadSettings() {
  loading.value = true
  try {
    const response = await apiClient.get('/admin/settings')
    settings.value = response.data.settings || {}
  } catch (err) {
    addToast('Failed to load settings.', 'error')
  } finally {
    loading.value = false
  }
}

// Save settings
async function saveSettings() {
  saving.value = true
  try {
    await apiClient.put('/admin/settings', { settings: settings.value })
    addToast('Settings saved successfully.', 'success')
  } catch (err) {
    addToast(err.response?.data?.message || 'Failed to save settings.', 'error')
  } finally {
    saving.value = false
  }
}

// Load AI Assist usage summary
async function loadAiUsage() {
  aiUsageLoading.value = true
  try {
    const response = await apiClient.get('/admin/llm-usage', {
      params: { page: 1, limit: 1 },
    })
    aiUsageSummary.value = response.data.totals || null
  } catch (err) {
    // Non-critical - just don't show usage
    aiUsageSummary.value = null
  } finally {
    aiUsageLoading.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadAiUsage()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Settings</h1>
        <p class="text-base-content/60">Configure CMS and AI settings</p>
      </div>
      <button
        class="btn btn-primary"
        :disabled="saving"
        @click="saveSettings"
      >
        {{ saving ? 'Saving...' : 'Save Settings' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Settings Form -->
    <div v-else class="space-y-6">
      <!-- Site Settings -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">Site Settings</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Site Name</span>
              </label>
              <input
                v-model="settings.site_name"
                type="text"
                class="input input-bordered"
                placeholder="West Pokot County"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Site Description</span>
              </label>
              <input
                v-model="settings.site_description"
                type="text"
                class="input input-bordered"
                placeholder="Official website of West Pokot County Government"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Default Locale</span>
              </label>
              <select v-model="settings.default_locale" class="select select-bordered">
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
                <option value="pok">Pokot</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- AI / LLM Settings -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">AI Summarisation (DeepSeek)</h2>
          <p class="text-sm text-base-content/60 mb-4">
            Configure the DeepSeek API for AI-powered content summarisation.
            Pricing: $0.435/1M input tokens, $0.87/1M output tokens.
            Exchange rate: 129.59 KES/USD.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  v-model="settings.llm_enabled"
                  type="checkbox"
                  class="toggle toggle-primary"
                  true-value="true"
                  false-value="false"
                />
                <span class="label-text">Enable AI Summarisation</span>
              </label>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">API Key</span>
              </label>
              <input
                v-model="settings.llm_api_key"
                type="password"
                class="input input-bordered"
                placeholder="sk-..."
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Model</span>
              </label>
              <input
                v-model="settings.llm_model"
                type="text"
                class="input input-bordered"
                placeholder="deepseek-chat"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Max Output Tokens</span>
              </label>
              <input
                v-model="settings.llm_max_tokens"
                type="number"
                class="input input-bordered"
                min="100"
                max="4000"
              />
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Temperature (0.0 - 1.0)</span>
              </label>
              <input
                v-model="settings.llm_temperature"
                type="number"
                class="input input-bordered"
                step="0.1"
                min="0"
                max="1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- AI Assist Settings -->
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">AI Assist Features</h2>
          <p class="text-sm text-base-content/60 mb-4">
            Enable AI-powered content editing tools: grammar check, translation, tag suggestions,
            SEO suggestions, alt text generation, and writing improvement.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label cursor-pointer justify-start gap-3">
                <input
                  v-model="settings.ai_assist_enabled"
                  type="checkbox"
                  class="toggle toggle-secondary"
                  true-value="true"
                  false-value="false"
                />
                <span class="label-text">Enable AI Assist</span>
              </label>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Monthly Budget (KES)</span>
              </label>
              <input
                v-model="settings.ai_assist_monthly_budget_kes"
                type="number"
                class="input input-bordered"
                min="0"
                step="100"
                placeholder="0 = unlimited"
              />
              <label class="label">
                <span class="label-text-alt text-base-content/50">Set to 0 for unlimited usage</span>
              </label>
            </div>
          </div>

          <!-- Usage Summary -->
          <div v-if="aiUsageSummary" class="mt-4 p-3 bg-base-200 rounded-box">
            <h3 class="text-sm font-semibold mb-2">Current Month Usage</h3>
            <div v-if="aiUsageLoading" class="flex items-center gap-2 text-sm text-base-content/60">
              <span class="loading loading-spinner loading-xs"></span>
              Loading usage...
            </div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span class="text-base-content/50">Total Requests</span>
                <p class="font-semibold">{{ aiUsageSummary.total_requests || 0 }}</p>
              </div>
              <div>
                <span class="text-base-content/50">Total Cost</span>
                <p class="font-semibold">KES {{ (aiUsageSummary.total_cost_kes || 0).toLocaleString() }}</p>
              </div>
              <div>
                <span class="text-base-content/50">Input Tokens</span>
                <p class="font-semibold">{{ (aiUsageSummary.total_input_tokens || 0).toLocaleString() }}</p>
              </div>
              <div>
                <span class="text-base-content/50">Output Tokens</span>
                <p class="font-semibold">{{ (aiUsageSummary.total_output_tokens || 0).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing Info -->
      <div class="card bg-base-200 shadow-sm">
        <div class="card-body">
          <h2 class="card-title text-sm">Pricing Reference</h2>
          <div class="text-sm space-y-1 text-base-content/70">
            <p>• Input tokens: $0.435 per 1M tokens</p>
            <p>• Output tokens: $0.87 per 1M tokens</p>
            <p>• Exchange rate: 129.59 KES/USD</p>
            <p>• Cost is calculated automatically and logged in LLM Usage Logs</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
