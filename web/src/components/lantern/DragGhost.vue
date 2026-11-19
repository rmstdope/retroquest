<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { Hand } from '@/lantern/belt'
import BeltFace from './BeltFace.vue'

/**
 * What follows the pointer while a picture of the belt is dragged: a round
 * copy of the picture (brass rim lit amber) and, just under it, a small amber
 * pill saying what letting go will do ("Use Bread with…"). The pill is one
 * line, kept wholly inside `bounds` (the room's picture, in window pixels), so
 * near an edge it slides along rather than being cut off, and ends in "…"
 * when it is wider than the picture; for a finger it sits above, so the
 * finger does not hide it. Given `to` (the pocket's middle) the copy glides
 * there, instantly under reduced motion, and says `done`. It never takes a
 * press, and a screen reader hears nothing of it.
 */
const props = defineProps<{
  hand: Hand
  /** The pointer, in window pixels. */
  x: number
  y: number
  /** What the pill says. */
  pill: string
  /** The drag is a finger's: the pill rides above it. */
  touch?: boolean
  /** The room's picture in window pixels: the pill stays inside it. */
  bounds: { left: number; top: number; right: number; bottom: number }
  /** Where the copy glides back to (the pocket's middle); null while it follows the pointer. */
  to?: { x: number; y: number } | null
}>()
const emit = defineEmits<{ done: [] }>()

/** How long the glide back takes (ms), before reduced motion. */
const GLIDE_MS = 250
/** How far (px) the pill stands from the copy's middle. */
const PILL_GAP = 42
/** The pill's own breadth kept from the picture's edge (px). */
const EDGE = 8

const pillEl = ref<HTMLElement | null>(null)
const pillWidth = ref(0)
const pillHeight = ref(0)
function measure(): void {
  pillWidth.value = pillEl.value?.offsetWidth ?? 0
  pillHeight.value = pillEl.value?.offsetHeight ?? 0
}
onMounted(measure)
watch(
  () => props.pill,
  () => void nextTick(measure),
)

const at = computed(() => props.to ?? { x: props.x, y: props.y })
const maxWidth = computed(() =>
  Math.max(0, props.bounds.right - props.bounds.left - EDGE * 2),
)
const pillStyle = computed(() => {
  const width = Math.min(pillWidth.value, maxWidth.value)
  const low = props.bounds.left + EDGE
  const high = Math.max(low, props.bounds.right - EDGE - width)
  const left = Math.min(Math.max(at.value.x - width / 2, low), high)
  // Under the pointer for a mouse, above a finger; flipped to the other side where it would leave the picture.
  const below =
    at.value.y + PILL_GAP + pillHeight.value <= props.bounds.bottom - EDGE
  const above =
    at.value.y - PILL_GAP - pillHeight.value >= props.bounds.top + EDGE
  const under = props.touch ? !above && below : below || !above
  return {
    left: `${left - at.value.x}px`,
    top: under ? `${PILL_GAP}px` : undefined,
    bottom: under ? undefined : `${PILL_GAP}px`,
    maxWidth: `${maxWidth.value}px`,
  }
})

/** The glide's length (ms): 0 when the player chose reduced motion. */
function glideMs(): number {
  const motion = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--lq-motion'),
  )
  return Number.isNaN(motion) ? GLIDE_MS : GLIDE_MS * motion
}
const gliding = ref(false)
let glideTimer: ReturnType<typeof setTimeout> | undefined
watch(
  () => props.to,
  (to) => {
    clearTimeout(glideTimer)
    if (!to) {
      gliding.value = false
      return
    }
    const ms = glideMs()
    gliding.value = ms > 0
    glideTimer = setTimeout(() => emit('done'), ms)
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="lq-drag"
    :class="{ 'lq-drag-glide': gliding }"
    :style="{ left: `${at.x}px`, top: `${at.y}px` }"
    data-drag-ghost
    aria-hidden="true"
  >
    <span class="lq-drag-copy" :class="`lq-drag-${hand.kind}`">
      <BeltFace
        :kind="hand.kind"
        :name="hand.name"
        picture-class="lq-drag-face"
      >
        <span class="lq-drag-letter">{{
          hand.label.charAt(0).toUpperCase()
        }}</span>
      </BeltFace>
    </span>
    <span ref="pillEl" class="lq-drag-pill" :style="pillStyle" data-drag-pill>{{
      pill
    }}</span>
  </div>
</template>

<style scoped>
.lq-drag {
  position: fixed;
  z-index: 60; /* local */
  width: 0;
  height: 0;
  pointer-events: none;
}
.lq-drag-glide {
  transition:
    left calc(250ms * var(--lq-motion)) ease-out,
    top calc(250ms * var(--lq-motion)) ease-out;
}
.lq-drag-copy {
  position: absolute;
  left: -28px;
  top: -28px;
  box-sizing: border-box;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #ffd77a;
  border-radius: 999px;
  font: 600 24px var(--lq-font-display);
  box-shadow:
    0 0 0 1px #4a3110,
    0 0 16px rgb(255 190 80 / 0.85),
    0 6px 14px rgb(0 0 0 / 0.5);
}
.lq-drag-item {
  background: #18261b;
  color: #8fcf7a;
}
.lq-drag-spell {
  background: #241a33;
  color: #c79bf0;
}
.lq-drag-face {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}
.lq-drag-pill {
  position: absolute;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: max-content;
  padding: 5px 11px;
  border-radius: 999px;
  background: linear-gradient(#ffcf6a, #e49a1c);
  color: #3a250b;
  font: 700 13px/1 var(--lq-font-ui);
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.45);
}
</style>
