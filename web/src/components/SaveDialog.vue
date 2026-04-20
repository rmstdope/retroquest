<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { SaveSlot } from '@/types/bridge'

defineProps<{
  visible: boolean
  slots: SaveSlot[]
}>()

const emit = defineEmits<{
  confirm: [slot: number]
  cancel: []
}>()

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('cancel')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function formatTimestamp(ts: string | null): string {
  if (!ts) return ''
  return new Date(ts).toLocaleString()
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[200] flex items-center justify-center bg-bg-overlay"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-bg-card border border-border rounded-xl p-6 max-w-[520px] w-[92%] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      <div class="text-[1.1rem] font-bold text-quest mb-4">💾 Save Game</div>

      <div class="text-sm text-text-secondary mb-3">Select a slot to save:</div>

      <div class="grid grid-cols-2 gap-2 mb-4">
        <button
          v-for="slot in slots"
          :key="slot.slot"
          class="flex flex-col items-start px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer"
          :class="
            slot.act
              ? 'border-accent bg-chip-bg hover:bg-chip-hover text-text-primary'
              : 'border-border bg-bg-secondary hover:bg-chip-hover text-text-secondary'
          "
          @click="emit('confirm', slot.slot)"
        >
          <span class="font-semibold text-xs text-text-secondary mb-0.5"
            >Slot {{ slot.slot }}</span
          >
          <template v-if="slot.act">
            <span class="text-xs font-medium truncate w-full">
              {{ slot.act }}, {{ slot.room }}
            </span>
            <span class="text-[0.65rem] text-text-secondary mt-0.5">{{
              formatTimestamp(slot.timestamp)
            }}</span>
          </template>
          <span v-else class="text-xs italic">Empty</span>
        </button>
      </div>

      <div class="flex justify-end">
        <button
          class="px-5 py-2 rounded-md bg-chip-bg text-text-primary border border-border cursor-pointer text-sm hover:bg-chip-hover"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
