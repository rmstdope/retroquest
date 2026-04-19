<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NamedSave } from '@/types/bridge'

const props = defineProps<{
  visible: boolean
  existingSaves: NamedSave[]
  defaultName: string
}>()

const emit = defineEmits<{
  confirm: [name: string]
  cancel: []
}>()

const saveName = ref('')

watch(
  () => [props.visible, props.defaultName] as const,
  ([visible, defaultName]) => {
    if (visible) {
      saveName.value = defaultName
    }
  },
)

function onSlotClick(save: NamedSave) {
  saveName.value = save.name
}

function onConfirm() {
  const trimmed = saveName.value.trim()
  if (!trimmed) return
  emit('confirm', trimmed)
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
      <div class="text-[1.1rem] font-bold text-quest mb-4">💾 Save Game</div>

      <label
        class="block text-sm text-text-secondary mb-1"
        for="save-name-input"
      >
        Save name
      </label>
      <input
        id="save-name-input"
        v-model="saveName"
        type="text"
        class="w-full bg-bg-secondary border border-border rounded-md px-3 py-2 text-text-primary text-sm mb-4 focus:outline-none focus:border-accent"
        placeholder="Enter save name…"
        @keydown.enter="onConfirm"
        @keydown.escape="$emit('cancel')"
      />

      <div v-if="existingSaves.length > 0" class="mb-4">
        <div class="text-sm text-text-secondary mb-2">
          Existing saves (click to overwrite):
        </div>
        <div class="max-h-40 overflow-y-auto border border-border rounded-md">
          <div
            v-for="save in existingSaves"
            :key="save.name"
            class="px-3 py-2 cursor-pointer text-sm flex justify-between items-center transition-colors hover:bg-chip-hover"
            @click="onSlotClick(save)"
          >
            <span class="font-medium text-text-primary">{{ save.name }}</span>
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
          :disabled="!saveName.trim()"
          @click="onConfirm"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>
