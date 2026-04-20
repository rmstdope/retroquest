<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { NamedSave } from '@/types/bridge'

const props = defineProps<{
  visible: boolean
  saves: NamedSave[]
}>()

const emit = defineEmits<{
  confirm: [name: string]
  cancel: []
}>()

const selectedName = ref<string | null>(null)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      selectedName.value = null
      window.addEventListener('keydown', onKeyDown)
    } else {
      window.removeEventListener('keydown', onKeyDown)
    }
  },
)

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('cancel')
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function onConfirm() {
  if (!selectedName.value) return
  emit('confirm', selectedName.value)
}
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[200] flex items-center justify-center bg-bg-overlay"
    @click.self="$emit('cancel')"
  >
    <div
      class="bg-bg-card border border-border rounded-xl p-6 max-w-[480px] w-[90%] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      <div class="text-[1.1rem] font-bold text-quest mb-4">📂 Load Game</div>

      <div v-if="saves.length === 0" class="text-text-secondary text-sm mb-4">
        No saved games found.
      </div>

      <div v-else class="mb-4">
        <div class="text-sm text-text-secondary mb-2">
          Select a save to load:
        </div>
        <div class="max-h-48 overflow-y-auto border border-border rounded-md">
          <div
            v-for="save in saves"
            :key="save.name"
            class="px-3 py-2 cursor-pointer text-sm flex justify-between items-center transition-colors hover:bg-chip-hover"
            :class="
              selectedName === save.name ? 'bg-chip-hover font-semibold' : ''
            "
            @click="selectedName = save.name"
          >
            <span class="text-text-primary">{{ save.name }}</span>
            <span class="text-text-secondary text-xs ml-2">
              {{ new Date(save.timestamp).toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <button
          class="px-5 py-2 rounded-md bg-chip-bg text-text-primary border border-border cursor-pointer text-sm hover:bg-chip-hover"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="px-5 py-2 rounded-md bg-accent text-white border-none cursor-pointer text-sm hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!selectedName"
          @click="onConfirm"
        >
          Load
        </button>
      </div>
    </div>
  </div>
</template>
