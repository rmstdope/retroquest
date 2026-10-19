<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from './stores/useGameStore'
import { useBridge } from './composables/useBridge'
import { useAppearance } from './composables/useAppearance'
import LanternLayout from './components/lantern/LanternLayout.vue'
import LanternLoading from './components/lantern/LanternLoading.vue'

const store = useGameStore()
const bridge = useBridge()
useAppearance()

/** Start over after a failed load: a fresh page restarts the engine cleanly. */
function reload(): void {
  window.location.reload()
}

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
  <LanternLoading
    v-if="store.loading"
    :status="store.loadingStatus"
    :failed="store.loadFailed"
    @retry="reload"
  />
  <LanternLayout v-else />
</template>
