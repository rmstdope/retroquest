<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { NameAction } from '@/lantern/nameActions'

/**
 * A small menu next to a name clicked in the story: the actions that fit
 * it. Picking one runs it; Escape, a click elsewhere or Tab closes it.
 * Arrow keys move between the actions.
 */
const props = defineProps<{ actions: NameAction[]; x: number; y: number }>()
const emit = defineEmits<{ pick: [command: string]; close: [] }>()
const menu = ref<HTMLElement | null>(null)

const MENU_WIDTH = 180
const ITEM_HEIGHT = 44
/** Below the name, kept inside the window (above it near the bottom). */
const position = computed(() => {
  const height = props.actions.length * ITEM_HEIGHT + 10
  return {
    left: `${Math.max(8, Math.min(props.x, window.innerWidth - MENU_WIDTH - 8))}px`,
    top: `${Math.max(8, Math.min(props.y + 4, window.innerHeight - height - 8))}px`,
  }
})

function items(): HTMLElement[] {
  return [
    ...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
  ]
}

function onKeydown(event: KeyboardEvent): void {
  const list = items()
  const index = list.indexOf(document.activeElement as HTMLElement)
  if (event.key === 'Escape' || event.key === 'Tab') {
    event.preventDefault()
    event.stopPropagation()
    emit('close')
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    list[(index + 1) % list.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    list[(index - 1 + list.length) % list.length]?.focus()
  }
}

function onPointerDown(event: PointerEvent): void {
  if (!menu.value?.contains(event.target as Node)) emit('close')
}

onMounted(() => {
  void nextTick(() => items()[0]?.focus())
  document.addEventListener('pointerdown', onPointerDown, true)
})
onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', onPointerDown, true),
)
</script>

<template>
  <div
    ref="menu"
    class="lq-name-menu"
    role="menu"
    :style="position"
    @keydown="onKeydown"
  >
    <button
      v-for="action in actions"
      :key="action.command"
      type="button"
      role="menuitem"
      class="lq-name-action"
      @click="emit('pick', action.command)"
    >
      {{ action.label }}
    </button>
  </div>
</template>

<style scoped>
.lq-name-menu {
  position: fixed;
  z-index: 40;
  min-width: 140px;
  max-width: 180px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--lq-line2);
  background: var(--lq-surface);
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.3);
  font-family: var(--lq-font-ui);
}
.lq-name-action {
  min-height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.lq-name-action:hover,
.lq-name-action:focus-visible {
  background: var(--lq-accent-soft);
}
</style>
