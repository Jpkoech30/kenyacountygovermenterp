<script setup>
/**
 * Root App component.
 * Provides the router-view outlet with route transition animations.
 *
 * Uses Vue's <Transition> with mode="out-in" and a 200ms fade + vertical
 * slide animation for smooth route transitions.
 */
</script>

<template>
  <router-view v-slot="{ Component }">
    <Transition name="route" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>

<style>
.route-enter-active,
.route-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.route-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.route-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
