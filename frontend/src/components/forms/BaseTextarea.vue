<script setup>
/**
 * BaseTextarea.vue – Reusable textarea with vee-validate integration.
 * Uses DaisyUI classes with conditional error styling.
 */
import { useField } from 'vee-validate'
import { computed, toRef } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  rows: { type: Number, default: 3 },
  placeholder: { type: String, default: '' },
  hint: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
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

const textareaValue = computed({
  get: () => value.value,
  set: (val) => {
    value.value = val
    emit('update:modelValue', val)
  },
})

const textareaClasses = computed(() => [
  'textarea textarea-bordered w-full',
  { 'textarea-error': errorMessage.value },
])

const errorId = computed(() => `${props.name}-error`)
const hintId = computed(() => `${props.name}-hint`)
const describedBy = computed(() => {
  const ids = []
  if (errorMessage.value) ids.push(errorId.value)
  if (props.hint) ids.push(hintId.value)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="form-control w-full">
    <label :for="name" class="label">
      <span class="label-text">
        {{ label }}
        <span v-if="required" class="text-error">*</span>
      </span>
    </label>
    <textarea
      :id="name"
      :name="name"
      :rows="rows"
      :placeholder="placeholder"
      :value="textareaValue"
      :disabled="disabled"
      :required="required"
      :aria-describedby="describedBy"
      :aria-invalid="!!errorMessage"
      :class="textareaClasses"
      @input="textareaValue = $event.target.value"
      @blur="handleBlur"
    ></textarea>
    <label v-if="hint && !errorMessage" :id="hintId" class="label">
      <span class="label-text-alt text-base-content/60">{{ hint }}</span>
    </label>
    <label v-if="errorMessage" :id="errorId" :for="name" class="label" aria-live="assertive">
      <span class="label-text-alt text-error">{{ errorMessage }}</span>
    </label>
  </div>
</template>
