<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

/**
 * The Lantern UI's loading screen while the game engine starts: the
 * RetroQuest wordmark, a lantern-glow spinner and the loading status. A
 * polite live region announces each step once, without its running file
 * count. It switches the page to Lantern's look at once, so there is no
 * classic dark screen before a light Lantern; the layout keeps it on after
 * loading. When loading `failed`, the spinner stops, the error is an alert
 * and Try again (focused) emits `retry`.
 */
const props = defineProps<{ status: string; failed?: boolean }>()
const emit = defineEmits<{ retry: [] }>()
const retryButton = ref<HTMLButtonElement | null>(null)

/** A trailing progress count such as " (10/363)". */
const PROGRESS_COUNT = /\s*\(\d+\/\d+\)$/

const step = computed(() => props.status.replace(PROGRESS_COUNT, ''))

onMounted(() => document.documentElement.setAttribute('data-ui', 'lantern'))

watch(
  () => props.failed,
  (failed) => {
    if (failed) void nextTick(() => retryButton.value?.focus())
  },
  { immediate: true },
)
</script>

<template>
  <div class="lq-loading">
    <h1 class="lq-loading-title">RetroQuest</h1>
    <template v-if="failed">
      <p class="lq-loading-status" role="alert">
        RetroQuest could not start. {{ status }}
      </p>
      <button
        ref="retryButton"
        type="button"
        class="lq-loading-retry"
        @click="emit('retry')"
      >
        Try again
      </button>
    </template>
    <template v-else>
      <span class="lq-loading-spinner" aria-hidden="true"></span>
      <p class="lq-loading-status" aria-hidden="true">{{ status }}</p>
      <p class="lq-sr-only" role="status">{{ step }}</p>
    </template>
  </div>
</template>

<style scoped>
.lq-loading {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-loading-title {
  margin: 0;
  font-family: var(--lq-font-display);
  font-size: 40px;
  font-weight: 500;
  color: var(--lq-accent-text);
}
.lq-loading-retry {
  min-height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: 12px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.lq-loading-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid var(--lq-line2);
  border-top-color: var(--lq-accent);
  animation: lq-loading-spin 1s linear infinite;
}
.lq-loading-status {
  margin: 0;
  max-width: 36ch;
  text-align: center;
  font-size: 14px;
  color: var(--lq-muted);
}
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
/* Turns with --lq-motion, so reduced motion keeps it still. */
@keyframes lq-loading-spin {
  to {
    transform: rotate(calc(360deg * var(--lq-motion)));
  }
}
</style>
