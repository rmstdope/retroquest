<script setup lang="ts">
import type { EntityMenuAction } from '@/composables/useEntityMenu'

export type MenuAction = EntityMenuAction

defineProps<{
  visible: boolean
  target: string
  actions: MenuAction[]
  x: number
  y: number
}>()

defineEmits<{
  close: []
  executeAction: [action: MenuAction]
}>()
</script>

<template>
  <div v-if="visible">
    <div class="fixed inset-0 z-[99]" @click="$emit('close')"></div>
    <div
      class="fixed z-[100] bg-bg-card border border-border rounded-lg py-1 min-w-[180px] shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      :style="`left:${x}px;top:${y}px`"
      @keydown.escape="$emit('close')"
    >
      <div
        class="px-3.5 py-2 font-bold text-sm text-text-secondary border-b border-border"
      >
        {{ target }}
      </div>
      <div
        v-for="action in actions"
        :key="action.label"
        class="px-3.5 py-2.5 cursor-pointer text-[0.9rem] transition-colors flex items-center gap-2 hover:bg-chip-hover"
        @click="$emit('executeAction', action)"
      >
        {{ action.label }}
      </div>
    </div>
  </div>
</template>
