<script setup>
/**
 * BaseSelect.vue – Reusable select dropdown with vee-validate integration.
 * Uses DaisyUI classes with conditional error styling.
 */
import { useField } from 'vee-validate'
import { computed, toRef } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Select...' },
})

const emit = defineEmits(['update:modelValue'])

const { value, errorMessage, handleBlur } = useField(
  toRef(props, 'name'),
  undefined,
  {
    initialValue: props.modelValue,
    syncVModel: false,
  }
)

const selectValue = computed({
  get: () => value.value,
  set: (val) => {
    value.value = val
    emit('update:modelValue', val)
  },
})

const selectClasses = computed(() => [
  'select select-bordered w-full',
  { 'select-error': errorMessage.value },
])

const errorId = computed(() => `${props.name}-error`)
</script>

<template>
  <div class="form-control w-full">
    <label :for="name" class="label">
      <span class="label-text">
        {{ label }}
        <span v-if="required" class="text-error">*</span>
      </span>
    </label>
    <select
      :id="name"
      :name="name"
      :value="selectValue"
      :disabled="disabled"
      :required="required"
      :aria-describedby="errorMessage ? errorId : undefined"
      :aria-invalid="!!errorMessage"
      :class="selectClasses"
      @change="selectValue = $event.target.value"
      @blur="handleBlur"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
    <label v-if="errorMessage" :id="errorId" :for="name" class="label" aria-live="assertive">
      <span class="label-text-alt text-error">{{ errorMessage }}</span>
    </label>
  </div>
</template>
