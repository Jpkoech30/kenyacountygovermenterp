<script setup>
/**
 * BaseRadioGroup.vue – Reusable radio button group with vee-validate integration.
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

const selectedValue = computed({
  get: () => value.value,
  set: (val) => {
    value.value = val
    emit('update:modelValue', val)
  },
})

const errorId = computed(() => `${props.name}-error`)
</script>

<template>
  <div class="form-control w-full">
    <label class="label">
      <span class="label-text">
        {{ label }}
        <span v-if="required" class="text-error">*</span>
      </span>
    </label>
    <div
      class="flex flex-wrap gap-4"
      :aria-describedby="errorMessage ? errorId : undefined"
      role="radiogroup"
      :aria-label="label"
    >
      <label
        v-for="opt in options"
        :key="opt.value"
        class="label cursor-pointer gap-2 justify-start"
        :class="{ 'opacity-50': disabled }"
      >
        <input
          :name="name"
          type="radio"
          :value="opt.value"
          :checked="selectedValue === opt.value"
          :disabled="disabled"
          class="radio"
          :class="{ 'radio-error': errorMessage }"
          @change="selectedValue = opt.value"
          @blur="handleBlur"
        />
        <span class="label-text">{{ opt.label }}</span>
      </label>
    </div>
    <label v-if="errorMessage" :id="errorId" class="label" aria-live="assertive">
      <span class="label-text-alt text-error">{{ errorMessage }}</span>
    </label>
  </div>
</template>
