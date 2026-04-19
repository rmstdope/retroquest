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
  <div v-if="visible" class="action-sheet-overlay" @click.self="$emit('close')">
    <div class="action-sheet">
      <div class="action-sheet-handle"></div>
      <div class="action-sheet-header">{{ target }}</div>
      <div
        v-for="action in actions"
        :key="action.label"
        class="action-sheet-item"
        @click="$emit('executeAction', action)"
      >
        {{ action.label }}
      </div>
      <div class="action-sheet-cancel" @click="$emit('close')">Cancel</div>
    </div>
  </div>
</template>
