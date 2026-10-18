<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from './stores/useGameStore'
import { useBridge } from './composables/useBridge'
import { useAppearance } from './composables/useAppearance'
import GameLayout from './components/GameLayout.vue'
import LanternLayout from './components/lantern/LanternLayout.vue'
import { useUiMode } from './composables/useUiMode'

const store = useGameStore()
const bridge = useBridge()
useAppearance()
const uiMode = useUiMode()

function requestFullscreenOnFirstInteraction() {
  if (
    !('ontouchstart' in window) ||
    !document.documentElement.requestFullscreen
  )
    return

  function onFirstInteraction() {
    document.documentElement.requestFullscreen().catch(() => {})
    window.removeEventListener('touchstart', onFirstInteraction)
    window.removeEventListener('click', onFirstInteraction)
  }

  window.addEventListener('touchstart', onFirstInteraction, { once: true })
  window.addEventListener('click', onFirstInteraction, { once: true })
}

onMounted(() => {
  store.setBridge(bridge)
  store.initGame()
  requestFullscreenOnFirstInteraction()
})
</script>

<template>
  <div
    v-if="store.loading"
    class="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-bg-primary gap-6"
  >
    <div class="text-[2.5rem] font-bold text-accent tracking-wide">
      RetroQuest
    </div>
    <div class="loading-spinner"></div>
    <div class="text-text-secondary text-sm">
      {{ store.loadingStatus }}
    </div>
  </div>
  <LanternLayout v-else-if="uiMode === 'lantern'" />
  <GameLayout v-else />
</template>
