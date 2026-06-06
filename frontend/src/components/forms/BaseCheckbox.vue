<script setup>
/**
 * BaseCheckbox.vue – Reusable single checkbox with vee-validate integration.
 * Uses DaisyUI classes with conditional error styling.
 */
import { useField } from 'vee-validate'
import { computed, toRef } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
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

const checked = computed({
  get: () => !!value.value,
  set: (val) => {
    value.value = val
    emit('update:modelValue', val)
  },
})

const errorId = computed(() => `${props.name}-error`)
</script>

<template>
  <div class="form-control w-full">
    <label class="label cursor-pointer justify-start gap-3">
      <input
        :id="name"
        :name="name"
        type="checkbox"
        :checked="checked"
        :disabled="disabled"
        :aria-describedby="errorMessage ? errorId : undefined"
        :aria-invalid="!!errorMessage"
        class="checkbox"
        :class="{ 'checkbox-error': errorMessage }"
        @change="checked = $event.target.checked"
        @blur="handleBlur"
      />
      <span class="label-text">{{ label }}</span>
    </label>
    <label v-if="errorMessage" :id="errorId" :for="name" class="label pt-0" aria-live="assertive">
      <span class="label-text-alt text-error">{{ errorMessage }}</span>
    </label>
  </div>
</template>
