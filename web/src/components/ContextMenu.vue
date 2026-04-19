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
    <div
      style="position: fixed; inset: 0; z-index: 99"
      @click="$emit('close')"
    ></div>
    <div
      class="context-menu"
      :style="`left:${x}px;top:${y}px`"
      @keydown.escape="$emit('close')"
    >
      <div class="context-menu-header">{{ target }}</div>
      <div
        v-for="action in actions"
        :key="action.label"
        class="context-menu-item"
        @click="$emit('executeAction', action)"
      >
        {{ action.label }}
      </div>
    </div>
  </div>
</template>
