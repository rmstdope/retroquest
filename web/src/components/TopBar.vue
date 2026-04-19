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
  <div
    class="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border min-h-12"
  >
    <span class="text-xl font-bold text-accent tracking-wide"
      >⚔️ RetroQuest</span
    >
    <div class="flex items-center gap-2">
      <div class="flex gap-2">
        <button
          class="bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
          @click="$emit('save')"
        >
          💾 Save
        </button>
        <button
          class="bg-chip-bg text-text-primary border border-border rounded-md px-3.5 py-1.5 cursor-pointer text-sm transition-colors hover:bg-chip-hover"
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
