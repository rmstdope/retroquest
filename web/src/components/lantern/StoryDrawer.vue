<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import StoryTurn from './StoryTurn.vue'

/**
 * The stage's story drawer from the right: the whole story so far, every turn
 * as the story band shows it. It opens at the newest turn (at the foot, older
 * ones above) and moves focus into the scrolling story, so the arrow keys and
 * Page Up/Down scroll it. While the newest turn is out of sight a "Newest ↓"
 * pill at the foot scrolls back to it. ✕ and Escape ask the layout to close
 * it (which hands focus back to the button that opened it); Escape closes
 * only the drawer, so it does not also skip the narration. Opening or closing
 * it never touches the narration, and the narration's follow-the-word scroll
 * (which belongs to the story band) does not pull this reader off an older turn.
 * Every name with a menu is a Tab stop (the layout marks them); the first Tab
 * from the drawer lands on the newest turn's first name (or, when that turn has none,
 * the last name before it).
 */
const emit = defineEmits<{ close: [] }>()
const game = useGameStore()
const body = ref<HTMLElement | null>(null)
const pill = ref(false)
let resize: ResizeObserver | undefined

/** Slack so rounding never leaves the pill up at the very end. */
const END_SLACK = 8

/** Whether the foot of the newest turn is below the visible part. */
function updatePill(): void {
  const el = body.value
  pill.value =
    !!el && el.scrollTop + el.clientHeight < el.scrollHeight - END_SLACK
}

/** Scroll to the newest turn (at once with Reduce motion on). */
function toNewest(smooth: boolean): void {
  const el = body.value
  if (!el) return
  // The pill goes once the end is reached: keep focus (and Escape) in the drawer.
  if (document.activeElement?.closest('.lq-newest'))
    el.focus({ preventScroll: true })
  const still =
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lq-motion')
      .trim() === '0'
  if (smooth && !still && typeof el.scrollTo === 'function')
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  else el.scrollTop = el.scrollHeight
  updatePill()
}

onMounted(async () => {
  toNewest(false)
  body.value?.focus({ preventScroll: true })
  if (typeof ResizeObserver !== 'undefined' && body.value) {
    resize = new ResizeObserver(updatePill)
    resize.observe(body.value)
  }
  await nextTick()
  updatePill()
})
onUnmounted(() => resize?.disconnect())

/**
 * Tab from the drawer's own body (where it opens) lands on the first name of
 * the newest turn, not the oldest at the top, so the reader keeps their place.
 */
function onBodyKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab' || event.shiftKey || event.target !== body.value)
    return
  const turns = body.value?.querySelectorAll('.lq-turn')
  const stop = '[role="button"][tabindex]'
  const first = turns?.[turns.length - 1]?.querySelector<HTMLElement>(stop)
  // The newest turn names nobody reachable: the nearest stop before it.
  const nearest = [...(body.value?.querySelectorAll<HTMLElement>(stop) ?? [])]
  const target = first ?? nearest[nearest.length - 1]
  if (!target) return
  event.preventDefault()
  target.focus()
}

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
    class="lq-story-drawer"
    aria-label="Story so far drawer"
    @keydown="onKeydown"
  >
    <header class="lq-story-drawer-head">
      <h2>Story so far</h2>
      <button
        type="button"
        class="lq-drawer-close"
        aria-label="Close"
        @click="emit('close')"
      >
        ✕
      </button>
    </header>
    <div
      ref="body"
      class="lq-story-drawer-body"
      role="region"
      aria-label="Story so far"
      tabindex="-1"
      @lq-follow.prevent
      @keydown="onBodyKeydown"
      @scroll.passive="updatePill"
    >
      <StoryTurn v-for="turn in game.turns" :key="turn.id" :turn="turn" />
    </div>
    <button v-if="pill" type="button" class="lq-newest" @click="toNewest(true)">
      Newest <span aria-hidden="true">↓</span>
    </button>
  </aside>
</template>

<style scoped>
.lq-story-drawer {
  position: absolute;
  /* Under the buttons, so the lit one stays in sight and can be pressed again;
     above the action row, so every action stays in reach. */
  top: 76px;
  right: 0;
  bottom: var(--lq-actions-h, 0px);
  z-index: 6;
  width: 50%;
  display: flex;
  flex-direction: column;
  background: var(--lq-surface);
  border: 1px solid var(--lq-line);
  border-right: none;
  border-radius: 10px 0 0 10px;
  box-shadow: -8px 0 28px rgb(0 0 0 / 0.3);
  animation: lq-story-drawer-in calc(0.2s * var(--lq-motion)) ease;
}
.lq-story-drawer-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 8px 24px;
  border-bottom: 1px solid var(--lq-line);
}
.lq-story-drawer-head h2 {
  margin: 0;
  font-family: var(--lq-font-ui);
  font-size: 15px;
  font-weight: 600;
  color: var(--lq-fg);
}
.lq-drawer-close {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  cursor: pointer;
}
.lq-story-drawer-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: calc(18px * var(--lq-density));
  padding: 16px 28px 16px 24px;
}
.lq-story-drawer-body:focus {
  outline: none;
}
.lq-newest {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  border: 1px solid var(--lq-accent-line);
  background: var(--lq-surface);
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.3);
}
/* The pill stays slim; its touch target is 44px tall like the other controls. */
.lq-newest::before {
  content: '';
  position: absolute;
  inset: -4px 0;
}
@keyframes lq-story-drawer-in {
  from {
    transform: translateX(24px);
    opacity: 0;
  }
}
</style>
