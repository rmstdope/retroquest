<script setup lang="ts">
/**
 * The dev build's Room effects button in the header, pressed while its panel
 * (`DevEffectsPanel.vue`) is open. The header loads it only in the dev build,
 * so the production build carries none of it.
 */
defineProps<{
  /** Whether the room effects panel is open. */
  open: boolean
}>()
</script>

<template>
  <button
    type="button"
    aria-label="Room effects"
    title="Room effects (dev)"
    :aria-pressed="open"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1 14h6M9 8h6M17 16h6" />
    </svg>
  </button>
</template>
