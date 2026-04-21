<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

defineProps<{
  title: string
  musicMuted: boolean
  soundMuted: boolean
}>()

defineEmits<{
  quickSave: []
  quickLoad: []
  save: []
  load: []
  toggleMute: []
  toggleSoundMute: []
  help: []
  toggleDrawer: []
}>()

const isFullscreen = ref(false)

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

onMounted(() => {
  isFullscreen.value = !!document.fullscreenElement
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<template>
  <div
    class="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border min-h-12"
  >
    <span class="text-xl font-bold text-accent tracking-wide"
      >⚔️ RetroQuest</span
    >
    <div class="flex items-center gap-2">
      <div class="flex gap-2">
        <button
          class="max-md:hidden bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          @click="$emit('quickSave')"
        >
          ⚡ Quicksave
        </button>
        <button
          class="max-md:hidden bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          @click="$emit('quickLoad')"
        >
          ⚡ Quickload
        </button>
        <button
          class="max-md:hidden bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          @click="$emit('save')"
        >
          💾 Save
        </button>
        <button
          class="max-md:hidden bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          @click="$emit('load')"
        >
          📂 Load
        </button>
        <button
          class="bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          :title="musicMuted ? 'Unmute music' : 'Mute music'"
          :aria-label="musicMuted ? 'Unmute music' : 'Mute music'"
          @click="$emit('toggleMute')"
        >
          {{ musicMuted ? '🔇' : '🎵' }}
        </button>
        <button
          class="bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          :title="soundMuted ? 'Unmute sounds' : 'Mute sounds'"
          :aria-label="soundMuted ? 'Unmute sounds' : 'Mute sounds'"
          @click="$emit('toggleSoundMute')"
        >
          {{ soundMuted ? '🔕' : '🔔' }}
        </button>
        <button
          class="bg-chip-bg text-text-primary border border-border rounded-md px-2 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover flex items-center justify-center"
          :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
          @click="toggleFullscreen"
        >
          <svg
            v-if="!isFullscreen"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="10" y1="14" x2="3" y2="21" />
            <line x1="21" y1="3" x2="14" y2="10" />
          </svg>
        </button>
        <button
          class="max-md:hidden bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          @click="$emit('help')"
        >
          ❓ Help
        </button>
      </div>
      <button
        class="hidden max-md:inline-flex bg-chip-bg text-text-primary border border-border rounded-md text-xl px-2.5 py-1.5 cursor-pointer transition-colors hover:bg-chip-hover"
        aria-label="Open sidebar"
        @click="$emit('toggleDrawer')"
      >
        ☰
      </button>
    </div>
  </div>
</template>
