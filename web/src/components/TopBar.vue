<script setup lang="ts">
defineProps<{
  title: string
  musicMuted: boolean
}>()

defineEmits<{
  save: []
  load: []
  toggleMute: []
  help: []
  toggleDrawer: []
}>()
</script>

<template>
  <div class="top-bar">
    <span class="top-bar-title">⚔️ RetroQuest</span>
    <div style="display: flex; align-items: center; gap: 8px">
      <div class="top-bar-actions">
        <button @click="$emit('save')">💾 Save</button>
        <button @click="$emit('load')">📂 Load</button>
        <button
          :title="musicMuted ? 'Unmute music' : 'Mute music'"
          :aria-label="musicMuted ? 'Unmute music' : 'Mute music'"
          @click="$emit('toggleMute')"
        >
          {{ musicMuted ? '🔇' : '🎵' }}
        </button>
        <button @click="$emit('help')">❓ Help</button>
      </div>
      <button
        class="hamburger-btn"
        aria-label="Open sidebar"
        @click="$emit('toggleDrawer')"
      >
        ☰
      </button>
    </div>
  </div>
</template>
