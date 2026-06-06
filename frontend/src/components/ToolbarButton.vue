<script setup>
/**
 * ToolbarButton.vue - Reusable icon-only toolbar button with tooltip.
 * Uses Lucide icons via dynamic component and DaisyUI tooltip class.
 */
import {
  Bold, Italic, Underline,
  Heading1, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Code, Minus,
  Link, Image,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Eye, Keyboard,
  MoreHorizontal, Type, Pilcrow,
} from '@lucide/vue'

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  tooltip: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: 'sm',
  },
})

const emit = defineEmits(['click'])

const iconMap = {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Eye,
  Keyboard,
  MoreHorizontal,
  Type,
  Pilcrow,
}
</script>

<template>
  <button
    class="btn btn-ghost btn-square tooltip"
    :class="{
      'btn-active': active,
      'btn-disabled': disabled,
      'btn-xs': size === 'xs',
      'btn-sm': size === 'sm',
      'btn-md': size === 'md',
    }"
    :data-tip="tooltip"
    :aria-label="tooltip || icon"
    :disabled="disabled"
    @click="emit('click', $event)"
  >
    <component :is="iconMap[icon]" :size="size === 'xs' ? 14 : size === 'sm' ? 18 : 20" />
  </button>
</template>
