<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { NameAction } from '@/lantern/nameActions'

/**
 * A small menu next to a name clicked in the story: the actions that fit
 * it. Picking one runs it; an action with choices (Give…, Cast…) shows
 * them in its place, named after it (Escape there goes back to the
 * actions); Escape, a click elsewhere, Tab or scrolling (the name would
 * move away from it) closes it.
 * Arrow keys move between the actions.
 */
/** `x`, `top` and `bottom` are where the clicked name is in the window. */
const props = defineProps<{
  actions: NameAction[]
  x: number
  top: number
  bottom: number
}>()
/** `close` says whether a key (Escape, Tab) closed it. */
const emit = defineEmits<{ pick: [command: string]; close: [byKey: boolean] }>()
const menu = ref<HTMLElement | null>(null)
/** The action whose choices are shown, if one was picked. */
const opened = ref<NameAction | null>(null)
const shown = computed(() => opened.value?.choices ?? props.actions)
const heading = computed(() => opened.value?.label.replace('…', '') ?? '')

function pick(action: NameAction): void {
  if (action.command) {
    emit('pick', action.command)
    return
  }
  opened.value = action
  void nextTick(() => items()[0]?.focus())
}

const MENU_WIDTH = 180
const ITEM_HEIGHT = 44
const HEADING_HEIGHT = 28
/**
 * Below the name, or above it when it would not fit below; a list too long
 * for the window is kept inside it (over the name) and scrolls.
 */
const position = computed(() => {
  const maxHeight = window.innerHeight - 16
  const height = Math.min(
    maxHeight,
    shown.value.length * ITEM_HEIGHT +
      (heading.value ? HEADING_HEIGHT : 0) +
      10,
  )
  const fitsBelow = props.bottom + 4 + height <= window.innerHeight - 8
  const top = fitsBelow ? props.bottom + 4 : props.top - 4 - height
  return {
    left: `${Math.max(8, Math.min(props.x, window.innerWidth - MENU_WIDTH - 8))}px`,
    top: `${Math.max(8, Math.min(top, window.innerHeight - 8 - height))}px`,
    maxHeight: `${maxHeight}px`,
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
  if (event.key === 'Escape' && opened.value) {
    event.preventDefault()
    event.stopPropagation()
    const back = opened.value
    opened.value = null
    void nextTick(() =>
      items()
        .find((item) => item.textContent?.trim() === back.label)
        ?.focus(),
    )
  } else if (event.key === 'Escape' || event.key === 'Tab') {
    event.preventDefault()
    event.stopPropagation()
    emit('close', true)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    list[(index + 1) % list.length]?.focus()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    list[(index - 1 + list.length) % list.length]?.focus()
  }
}

function onPointerDown(event: PointerEvent): void {
  if (!menu.value?.contains(event.target as Node)) emit('close', false)
}

/** The story scrolling closes it; its own long list scrolling does not. */
function onScroll(event: Event): void {
  if (!menu.value?.contains(event.target as Node)) emit('close', false)
}

onMounted(() => {
  void nextTick(() => items()[0]?.focus())
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('scroll', onScroll, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('scroll', onScroll, true)
})
</script>

<template>
  <div
    ref="menu"
    class="lq-name-menu"
    role="menu"
    :aria-label="heading || undefined"
    :style="position"
    @keydown="onKeydown"
  >
    <span v-if="heading" class="lq-name-heading" aria-hidden="true">{{
      heading
    }}</span>
    <button
      v-for="action in shown"
      :key="action.label"
      type="button"
      role="menuitem"
      class="lq-name-action"
      :aria-haspopup="action.choices ? 'menu' : undefined"
      @click="pick(action)"
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
  overflow-y: auto;
  overscroll-behavior: contain;
}
.lq-name-heading {
  flex-shrink: 0;
  padding: 6px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
.lq-name-action {
  flex-shrink: 0;
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
