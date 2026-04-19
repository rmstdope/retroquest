<script setup lang="ts">
import type { MenuAction } from './ContextMenu.vue'

defineProps<{
  visible: boolean
  target: string
  actions: MenuAction[]
}>()

defineEmits<{
  close: []
  executeAction: [action: MenuAction]
}>()
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[150] bg-bg-overlay flex items-end"
    @click.self="$emit('close')"
  >
    <div
      class="w-full bg-bg-card rounded-t-2xl pt-2 pb-4 max-h-[60vh] overflow-y-auto"
    >
      <div class="w-10 h-1 bg-border rounded-full mx-auto mt-2 mb-3"></div>
      <div class="px-5 py-2 pb-3 font-bold text-base border-b border-border">
        {{ target }}
      </div>
      <div
        v-for="action in actions"
        :key="action.label"
        class="px-5 py-3.5 cursor-pointer text-base flex items-center gap-3 min-h-12 transition-colors hover:bg-chip-hover"
        @click="$emit('executeAction', action)"
      >
        {{ action.label }}
      </div>
      <div
        class="px-5 py-3.5 cursor-pointer text-base text-center text-failure font-semibold border-t border-border mt-1 min-h-12 flex items-center justify-center"
        @click="$emit('close')"
      >
        Cancel
      </div>
    </div>
  </div>
</template>
