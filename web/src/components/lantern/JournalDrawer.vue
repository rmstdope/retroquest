<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import JournalPanel from './JournalPanel.vue'

/**
 * The stage's drawer from the right: today's journal panel (Bag, Spells and
 * Quests tabs) opened on the tab of the button pressed. On opening, focus
 * moves into it (the open tab). A tab chosen inside it is passed on
 * (`select`), so the layout lights that tab's button. ✕ and Escape ask the
 * layout to close it (which also hands focus back to the lit button). Escape
 * closes only the drawer, so it does not also skip the narration.
 */
defineProps<{ tab: 'bag' | 'spells' | 'quests' }>()
const emit = defineEmits<{
  close: []
  select: [tab: 'bag' | 'spells' | 'quests']
}>()
const root = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  root.value?.querySelector<HTMLElement>('[role="tab"][tabindex="0"]')?.focus()
})

/** Escape closes the drawer and goes no further. */
function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  event.stopPropagation()
  event.preventDefault()
  emit('close')
}
</script>

<template>
  <aside
    ref="root"
    class="lq-drawer"
    aria-label="Journal drawer"
    data-panel
    @keydown="onKeydown"
  >
    <button
      type="button"
      class="lq-drawer-close"
      aria-label="Close"
      @click="emit('close')"
    >
      ✕
    </button>
    <JournalPanel
      :start="tab"
      class="lq-drawer-journal"
      @select="emit('select', $event)"
    />
  </aside>
</template>

<style scoped>
.lq-drawer {
  position: absolute;
  /* Under the buttons, so the lit one stays in sight and can be pressed again;
     above the action row, so every action stays in reach. */
  top: 76px;
  right: 0;
  bottom: var(--lq-actions-h, 0px);
  z-index: 6;
  width: min(380px, 92%);
  display: flex;
  flex-direction: column;
  background: var(--lq-surface);
  border: 1px solid var(--lq-line);
  border-right: none;
  border-radius: 10px 0 0 10px;
  box-shadow: -8px 0 28px rgb(0 0 0 / 0.3);
  animation: lq-drawer-in calc(0.2s * var(--lq-motion)) ease;
}
.lq-drawer-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  cursor: pointer;
}
.lq-drawer-journal {
  flex: 1;
  border: none;
  border-radius: 0;
  padding-top: 52px;
}
@keyframes lq-drawer-in {
  from {
    transform: translateX(24px);
    opacity: 0;
  }
}
</style>
