<script setup lang="ts">
import { onScopeDispose, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

/**
 * A short notice in the top corner when the game is saved or loaded; it
 * fades out by itself and adds nothing to the story. Screen readers hear it
 * through the status region. A repeated notice pops up anew (a new pill), so
 * a second save is seen and announced again.
 */
const SHOW_MS = 2600

const game = useGameStore()
const text = ref('')
const id = ref(0)
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => game.notice?.id,
  () => {
    if (!game.notice) return
    text.value = game.notice.text
    id.value = game.notice.id
    clearTimeout(timer)
    timer = setTimeout(() => (text.value = ''), SHOW_MS)
  },
)
onScopeDispose(() => clearTimeout(timer))
</script>

<template>
  <div class="lq-toast-region" role="status" aria-live="polite">
    <Transition name="lq-toast" mode="out-in">
      <span v-if="text" :key="id" class="lq-toast">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        {{ text }}
      </span>
    </Transition>
  </div>
</template>

<style scoped>
.lq-toast-region {
  position: fixed;
  top: 72px;
  right: 16px;
  z-index: 60;
  pointer-events: none;
}
.lq-toast {
  height: 40px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 20px;
  background: var(--lq-fg);
  color: var(--lq-bg);
  font-family: var(--lq-font-ui);
  font-size: 14px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
}
.lq-toast-enter-active,
.lq-toast-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}
.lq-toast-enter-from,
.lq-toast-leave-to {
  opacity: 0;
  transform: translateY(calc(-8px * var(--lq-motion)));
}
</style>
