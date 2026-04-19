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
  <div v-if="store.loading" class="loading-screen">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-status">{{ store.loadingStatus }}</div>
    </div>
  </div>
  <GameLayout v-else />
</template>
