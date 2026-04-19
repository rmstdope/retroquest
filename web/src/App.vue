<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from './stores/useGameStore'
import { useBridge } from './composables/useBridge'
import GameLayout from './components/GameLayout.vue'

const store = useGameStore()
const bridge = useBridge()

onMounted(() => {
  store.setBridge(bridge)
  store.initGame()
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
  <GameLayout v-else />
</template>
