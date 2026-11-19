<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { useFlightStore } from '@/stores/useFlightStore'
import { useSizeWatch } from '@/composables/useSizeWatch'
import BeltFace from './BeltFace.vue'
import {
  beltPictures,
  withoutOwed,
  type BeltList,
  type BeltPicture,
} from '@/lantern/belt'

/**
 * The strap of pictures across the foot of the room's picture: a stitched
 * leather band holding the things carried (the Bag) or the spells known, each
 * in a round brass-rimmed pocket (no name beneath: the caption says what it
 * is), in its usual colour, a count as a small brass tag on a counted thing,
 * and the first letter of the name until the picture is made (then the
 * picture, `BeltFace`). A pouch and a star, brass studs with pictures only,
 * sit at its left end: pressing the lit one folds the strap away into a short
 * leather tab that keeps the studs, pressing either while it is folded
 * unfurls it on that list, and pressing the other while one list shows folds
 * it, then unfurls the other (0.6 s each way, at once under reduced motion;
 * presses during the movement are ignored). ‹ and › show when more pictures
 * are carried than fit; the strip also scrolls by wheel, swipe and arrow keys.
 * The pictures are one Tab stop (arrows walk, Home and End jump); Enter or
 * Space presses. A press says which picture and where (a key: its middle);
 * what it does is the layout's. The picture in hand stays lit. A caption for
 * the picture pointed at (a mouse resting on it), focused, held down by a
 * finger for a moment, or `captionFor` (the one whose ring is open) is told
 * to the layout, which draws it above the strap and the words. The list
 * showing counts as seen, so the amber dot only sits on the stud of the list
 * not showing, and on both while the strap is folded. Which list and whether
 * it is folded are the belt store's, remembered on this device.
 */
const props = defineProps<{
  /** A sideways phone: smaller pictures (48px) on a slimmer strap. */
  compact?: boolean
  /** The key of the picture whose ring is open, whose caption shows. */
  captionFor?: string | null
}>()
const emit = defineEmits<{
  press: [picture: BeltPicture, at: { x: number; y: number }]
  /** The height the strap takes at the foot of the picture (the folded tab's height while folded away). */
  measure: [height: number]
  /** The picture whose caption shows (null: none). The layout draws it, over the words. */
  caption: [picture: BeltPicture | null]
}>()
const game = useGameStore()
const belt = useBeltStore()
const flights = useFlightStore()

const root = ref<HTMLElement | null>(null)
const strip = ref<HTMLElement | null>(null)
const pictures = computed(() =>
  beltPictures(
    withoutOwed(game.rawInventory, (name) => flights.owing('item', name)),
    withoutOwed(game.rawSpells, (name) => flights.owing('spell', name)),
    belt.list,
  ),
)
/** The picture a key walks from: the last one focused, else the first. */
const roving = ref<string | null>(null)
const rovingKey = computed(() =>
  pictures.value.some((p) => p.key === roving.value)
    ? roving.value
    : (pictures.value[0]?.key ?? null),
)
const pointed = ref<string | null>(null)
const focused = ref<string | null>(null)
/** The picture a finger has been held on, whose caption shows until it lets go. */
const held = ref<string | null>(null)
const captionKey = computed(
  () =>
    pointed.value ?? focused.value ?? held.value ?? props.captionFor ?? null,
)
const caption = computed(() =>
  belt.away
    ? null
    : (pictures.value.find((p) => p.key === captionKey.value) ?? null),
)

/** How long the strap takes to unfurl or fold (ms), before reduced motion. */
const STRAP_MS = 600
/** How long a finger rests on a picture before it counts as a hold (ms). */
const HOLD_MS = 450
/** How far a finger may drift (px) and still be a hold, not a swipe. */
const HOLD_SLOP = 10
/** The strap's movement: it shows pictures except once folded all the way. */
type Phase = 'open' | 'folding' | 'away' | 'unfurling'
const phase = ref<Phase>(belt.away ? 'away' : 'open')
/** The folded look (a short tab): the CSS transition runs between it and the unfurled one. */
const folded = ref(belt.away)
/** A switch of lists is under way (fold, then unfurl). */
const switching = ref(false)
const locked = computed(
  () =>
    switching.value || phase.value === 'folding' || phase.value === 'unfurling',
)
let moveTimer: ReturnType<typeof setTimeout> | undefined
let switchTimer: ReturnType<typeof setTimeout> | undefined
let holdTimer: ReturnType<typeof setTimeout> | undefined
let holdFrom: { x: number; y: number } | null = null
/** The press that follows a hold's release is not a press. */
let swallowClick = false

/** The movement's duration (ms): 0 when the player chose reduced motion. */
function strapMs(): number {
  const motion = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--lq-motion'),
  )
  return Number.isNaN(motion) ? STRAP_MS : STRAP_MS * motion
}
watch(caption, (picture) => emit('caption', picture), { immediate: true })
/** More pictures lie out of sight to the left or to the right. */
const more = ref({ prev: false, next: false })

/** A description as plain words, for a screen reader. */
function plain(note: string): string {
  return note.replace(/\[\/?[a-z_]+\]/g, '')
}

/** Work out whether ‹ and › are wanted from how far the strip is scrolled. */
function measureScroll(): void {
  const el = strip.value
  if (!el) {
    more.value = { prev: false, next: false }
    return
  }
  more.value = {
    prev: el.scrollLeft > 1,
    next: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
  }
}

/** Scroll the strip a screenful toward `way`. */
function page(way: 'prev' | 'next'): void {
  const el = strip.value
  if (!el) return
  const by = Math.max(60, el.clientWidth - 60) * (way === 'next' ? 1 : -1)
  if (typeof el.scrollBy === 'function') el.scrollBy({ left: by })
  else el.scrollLeft += by
}

/** A stud was pressed: fold the strap (the lit one), unfurl it on that list (folded away), or fold, then unfurl the other list. */
function pick(list: BeltList): void {
  if (locked.value) return
  if (belt.away) return belt.bringBack(list)
  if (list === belt.list) return belt.putAway()
  const ms = strapMs()
  if (ms === 0) {
    belt.show(list)
    return
  }
  // The folded state is the store's (and so remembered) for the 0.6 s between the fold and the unfurl; a reload in that moment comes back folded.
  switching.value = true
  belt.putAway()
  switchTimer = setTimeout(() => {
    belt.bringBack(list)
    void nextTick(() => (switching.value = false))
  }, ms)
}

// The strap follows the store's `away`: fold, or unfurl from the folded look.
watch(
  () => belt.away,
  (away) => {
    clearTimeout(moveTimer)
    const ms = strapMs()
    if (away) {
      const active = document.activeElement
      if (
        active instanceof HTMLElement &&
        active.dataset.beltPic &&
        root.value?.contains(active)
      )
        root.value
          ?.querySelector<HTMLElement>(`[data-belt-switch="${belt.list}"]`)
          ?.focus()
      folded.value = true
      if (ms === 0) phase.value = 'away'
      else {
        phase.value = 'folding'
        moveTimer = setTimeout(() => (phase.value = 'away'), ms)
      }
      return
    }
    if (ms === 0) {
      phase.value = 'open'
      folded.value = false
      return
    }
    phase.value = 'unfurling'
    moveTimer = setTimeout(() => (phase.value = 'open'), ms)
    void nextTick(() => {
      void root.value?.offsetWidth
      folded.value = false
    })
  },
)

/** A pointer went down on a picture: a finger held there for a moment shows its caption. */
function onPicDown(key: string, event: PointerEvent): void {
  swallowClick = false
  if (event.pointerType !== 'touch') return
  holdFrom = { x: event.clientX, y: event.clientY }
  clearTimeout(holdTimer)
  holdTimer = setTimeout(() => {
    held.value = key
    swallowClick = true
  }, HOLD_MS)
}

/** The finger drifted: a swipe, not a hold. */
function onPicMove(event: PointerEvent): void {
  if (!holdFrom || held.value) return
  if (
    Math.hypot(event.clientX - holdFrom.x, event.clientY - holdFrom.y) >
    HOLD_SLOP
  )
    endHold()
}

/** The finger let go or was taken over: the hold's caption goes. */
function endHold(): void {
  clearTimeout(holdTimer)
  holdFrom = null
  held.value = null
  // The click that follows a release comes at once; one that never comes must not eat a later key press.
  if (swallowClick) setTimeout(() => (swallowClick = false), 0)
}

/** A hold would raise the system's menu on a phone; it is the caption's. */
function onPicMenu(event: Event): void {
  if (holdFrom || held.value) event.preventDefault()
}

/** A mouse or pen resting on a picture points at it; a touch does not (a tap opens its ring). */
function onPicEnter(key: string, event: PointerEvent): void {
  if (event.pointerType !== 'touch') pointed.value = key
}

/** The tiles in the strip, left to right. */
function tiles(): HTMLElement[] {
  return [
    ...(strip.value?.querySelectorAll<HTMLElement>('[data-belt-pic]') ?? []),
  ]
}

/** Focus a picture (the first when no key is given) and scroll it into view. */
async function focusPicture(key?: string): Promise<void> {
  await nextTick()
  const all = tiles()
  const el = key ? all.find((t) => t.dataset.beltPic === key) : all[0]
  el?.focus()
  el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}

/** Whether a picture of this key is on the belt now. */
function has(key: string): boolean {
  return pictures.value.some((p) => p.key === key)
}

/** A picture took focus: keys walk from it, and its caption shows. */
function onTileFocus(key: string): void {
  roving.value = key
  focused.value = key
}

/** Arrow keys, Home and End walk the pictures. */
function onTileKey(event: KeyboardEvent): void {
  const all = tiles()
  const at = all.indexOf(event.currentTarget as HTMLElement)
  const to =
    event.key === 'ArrowRight'
      ? at + 1
      : event.key === 'ArrowLeft'
        ? at - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? all.length - 1
            : -1
  if (to < 0 || to >= all.length) return
  event.preventDefault()
  all[to].focus()
  all[to].scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
}

/** A press or key on a picture; a key (no pointer, `detail` 0) opens at the picture's middle. */
function onPress(picture: BeltPicture, event: MouseEvent): void {
  if (swallowClick) {
    swallowClick = false
    return
  }
  const el =
    event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  const box = el?.getBoundingClientRect()
  const at =
    event.detail === 0 && box
      ? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      : { x: event.clientX, y: event.clientY }
  emit('press', picture, at)
}

// A gained thing's flight begins: scroll the picture it will land on into view, on the list that shows it.
watch(
  () => [flights.current?.key, flights.phase] as const,
  async ([key, phase]) => {
    const flight = flights.current
    if (key === undefined || !flight || flight.leaving || phase !== 'show')
      return
    if (belt.away || pictures.value.every((p) => p.kind !== flight.kind)) return
    await nextTick()
    const el = tiles().find(
      (t) => t.dataset.beltPic === `${flight.kind}:${flight.name}`,
    )
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  },
)

// The list showing counts as seen, news that comes while it shows too.
watch(
  [
    () => belt.away,
    () => belt.list,
    () => game.bagHasNew,
    () => game.spellsHaveNew,
  ],
  () => {
    if (belt.away) return
    if (belt.list === 'bag' && game.bagHasNew) game.markSeen('bag')
    if (belt.list === 'spells' && game.spellsHaveNew) game.markSeen('spells')
  },
  { immediate: true },
)

watch(pictures, () => void nextTick(measureScroll))

/** Tell the layout how tall the belt stands now: the folded tab too, so the story keeps clear of it. */
function reportHeight(): void {
  emit('measure', root.value?.offsetHeight ?? 0)
}

/** A new size is applied on the next frame, so the layout it moves is not measured in the same one. */
const sizeWatch = useSizeWatch(() => {
  measureScroll()
  reportHeight()
})
onMounted(() => {
  measureScroll()
  if (root.value) sizeWatch.observe(root.value)
  reportHeight()
})
onUnmounted(() => {
  clearTimeout(moveTimer)
  clearTimeout(switchTimer)
  clearTimeout(holdTimer)
  emit('caption', null)
  emit('measure', 0)
})
watch(phase, async () => {
  await nextTick()
  reportHeight()
  measureScroll()
})

/** Focus the first picture, the stud of the list showing when none is carried. */
async function focusBelt(): Promise<void> {
  await nextTick()
  if (pictures.value.length) return focusPicture()
  root.value
    ?.querySelector<HTMLElement>(`[data-belt-switch="${belt.list}"]`)
    ?.focus()
}
defineExpose({ focusBelt, focusPicture, has, root })
</script>

<template>
  <section
    ref="root"
    class="lq-belt"
    :class="{
      'lq-belt-compact': compact,
      'lq-belt-folded': folded,
      'lq-belt-away': phase === 'away',
    }"
    aria-label="Bag and spells"
  >
    <div class="lq-belt-bar">
      <div class="lq-belt-switch">
        <button
          type="button"
          class="lq-belt-tiny"
          :class="{
            'lq-lit': !belt.away && belt.list === 'bag',
            'lq-landed': flights.landed === 'item',
            'lq-dipped': flights.dipped === 'item',
          }"
          data-belt-switch="bag"
          data-flight-target="item"
          aria-label="Bag"
          :aria-pressed="!belt.away && belt.list === 'bag' ? 'true' : 'false'"
          @click="pick('bag')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M8 7V6a4 4 0 0 1 8 0v1" />
            <path
              d="M5 7h14l-1.2 12.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8z"
            />
          </svg>
          <span
            v-if="(belt.away || belt.list !== 'bag') && game.bagHasNew"
            class="lq-dot"
            aria-hidden="true"
          ></span>
        </button>
        <button
          type="button"
          class="lq-belt-tiny"
          :class="{
            'lq-lit': !belt.away && belt.list === 'spells',
            'lq-landed': flights.landed === 'spell',
            'lq-dipped': flights.dipped === 'spell',
          }"
          data-belt-switch="spells"
          data-flight-target="spell"
          aria-label="Spells"
          :aria-pressed="
            !belt.away && belt.list === 'spells' ? 'true' : 'false'
          "
          @click="pick('spells')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"
            />
            <path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
          </svg>
          <span
            v-if="(belt.away || belt.list !== 'spells') && game.spellsHaveNew"
            class="lq-dot"
            aria-hidden="true"
          ></span>
        </button>
      </div>
      <template v-if="phase !== 'away'">
        <button
          v-if="more.prev && phase === 'open'"
          type="button"
          class="lq-belt-more"
          data-belt-more="prev"
          aria-label="Earlier pictures"
          @click="page('prev')"
        >
          ‹
        </button>
        <div class="lq-belt-reel">
          <div
            ref="strip"
            class="lq-belt-strip"
            @scroll.passive="measureScroll"
          >
            <p v-if="!pictures.length" class="lq-belt-empty">
              {{
                belt.list === 'bag'
                  ? 'Your bag is empty.'
                  : 'You know no spells yet.'
              }}
            </p>
            <button
              v-for="(picture, index) in pictures"
              :key="picture.key"
              type="button"
              class="lq-belt-pic"
              :class="[
                `lq-belt-${picture.kind}`,
                {
                  'lq-lit':
                    belt.hand?.kind === picture.kind &&
                    belt.hand?.name === picture.name,
                  'lq-landed':
                    flights.landed === picture.kind &&
                    flights.landedName === picture.name,
                },
              ]"
              :style="{ '--i': index }"
              :data-belt-pic="picture.key"
              :tabindex="rovingKey === picture.key ? 0 : -1"
              aria-haspopup="menu"
              :aria-label="
                picture.count > 1
                  ? `${picture.label}, ${picture.count}`
                  : picture.label
              "
              :aria-describedby="`lq-belt-note-${picture.key.replace(/\W/g, '_')}`"
              @click="onPress(picture, $event)"
              @keydown="onTileKey"
              @focus="onTileFocus(picture.key)"
              @blur="focused = null"
              @pointerenter="onPicEnter(picture.key, $event)"
              @pointerleave="pointed = null"
              @pointerdown="onPicDown(picture.key, $event)"
              @pointermove="onPicMove"
              @pointerup="endHold"
              @pointercancel="endHold"
              @contextmenu="onPicMenu"
            >
              <span class="lq-belt-square" aria-hidden="true">
                <BeltFace
                  :kind="picture.kind"
                  :name="picture.name"
                  picture-class="lq-belt-face"
                >
                  <span class="lq-belt-letter">{{ picture.letter }}</span>
                </BeltFace>
                <span v-if="picture.count > 1" class="lq-belt-count"
                  >×{{ picture.count }}</span
                >
              </span>
              <span
                :id="`lq-belt-note-${picture.key.replace(/\W/g, '_')}`"
                class="lq-sr-only"
                >{{ plain(picture.note) }}</span
              >
            </button>
          </div>
        </div>
        <button
          v-if="more.next && phase === 'open'"
          type="button"
          class="lq-belt-more"
          data-belt-more="next"
          aria-label="Later pictures"
          @click="page('next')"
        >
          ›
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
/* The strap's leather and brass are the same in the light and dark themes: it is a thing in the world, not chrome. */
.lq-belt {
  --lq-pocket: 56px;
  --lq-stud: 32px;
  --lq-strap-ms: calc(600ms * var(--lq-motion));
  position: absolute;
  left: var(--lq-belt-left, 0px);
  /* Stops short of the picture's foot-right corner (the width the belt has always left; the agreed experience changes no layout). */
  right: var(--lq-belt-right, 180px);
  bottom: var(--lq-belt-bottom, 0px);
  z-index: var(--lq-z-stage-belt);
  pointer-events: none;
  font-family: var(--lq-font-ui);
}
.lq-belt-compact {
  --lq-pocket: 48px;
  --lq-stud: 28px;
}
.lq-belt-bar {
  /* Only as long as what it holds. */
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  margin-left: 8px;
  padding: 8px;
  border-radius: 12px;
  background: linear-gradient(#5a3a22, #3e2716);
  box-shadow:
    0 10px 26px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 220 170 / 0.18);
  /* The stitching, just inside the edge. */
  outline: 1.5px dashed rgb(232 196 140 / 0.55);
  outline-offset: -6px;
  transition: border-radius var(--lq-strap-ms);
}
.lq-belt-folded .lq-belt-bar {
  /* The buckle end of a belt. */
  border-radius: 12px 22px 22px 12px;
}
.lq-belt-compact .lq-belt-bar {
  /*
   * The slim strap of a sideways phone: only as tall as its 48px pockets
   * (52px), so its top lies 60px above the foot and a card's 61px holds.
   */
  padding: 2px 8px;
  outline-offset: -3px;
}
.lq-belt-switch {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  pointer-events: auto;
}
.lq-belt-compact:not(.lq-belt-folded) .lq-belt-switch {
  /* Pouch and star side by side while the strap is up on a sideways phone; folded away they stack, clear of Hide / Show. */
  flex-direction: row;
  align-items: center;
}
.lq-belt-tiny,
.lq-belt-more {
  position: relative;
  flex: none;
  border: 1px solid #4a3110;
  background: radial-gradient(circle at 35% 30%, #f3d28a, #b9862f 60%, #7a5317);
  color: #3a250b;
  font: inherit;
  cursor: pointer;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.5);
}
.lq-belt-tiny {
  width: var(--lq-stud);
  height: var(--lq-stud);
  padding: 6px;
  border-radius: 999px;
}
.lq-belt-compact .lq-belt-tiny {
  padding: 5px;
}
.lq-belt-tiny svg {
  width: 100%;
  height: 100%;
}
.lq-belt-tiny.lq-lit {
  box-shadow:
    0 0 0 2px #ffe3a3,
    0 0 16px rgb(255 200 90 / 0.7);
}
.lq-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ffa914;
  box-shadow: 0 0 0 2px #3e2716;
}
.lq-belt-more {
  pointer-events: auto;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  font:
    700 18px/1 system-ui,
    sans-serif;
}
.lq-belt-reel {
  /* The strap's length: its pictures unfurl sideways out of the tab. */
  display: grid;
  grid-template-columns: 1fr;
  flex: 0 1 auto;
  min-width: 0;
  pointer-events: none;
  transition: grid-template-columns var(--lq-strap-ms)
    cubic-bezier(0.3, 0.7, 0.2, 1);
}
.lq-belt-folded .lq-belt-reel {
  grid-template-columns: 0fr;
}
.lq-belt-strip {
  /* Floats on the leather: only the pictures themselves take a press. */
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  /* An empty strap keeps the height of one with pictures. */
  min-height: calc(var(--lq-pocket) + 12px);
  /* Room for the lift of a pocket and its tag. */
  padding: 6px 4px;
  margin: -6px -4px;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
}
.lq-belt-strip::-webkit-scrollbar {
  display: none;
}
.lq-belt-empty {
  margin: 0;
  padding: 0 14px 0 6px;
  align-self: center;
  white-space: nowrap;
  /* Tooled into the leather. */
  color: #f0d9a8;
  font: italic 600 14px var(--lq-font-display);
  text-shadow: 0 1px 0 #000;
}
.lq-belt-pic {
  pointer-events: auto;
  flex: none;
  display: block;
  width: var(--lq-pocket);
  height: var(--lq-pocket);
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  transition:
    opacity calc(300ms * var(--lq-motion))
      calc(var(--i) * 30ms * var(--lq-motion)),
    translate calc(300ms * var(--lq-motion))
      calc(var(--i) * 30ms * var(--lq-motion));
}
.lq-belt-folded .lq-belt-pic {
  opacity: 0;
  translate: -16px 0;
  transition-delay: 0s;
}
.lq-belt-square {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* A round pocket with a brass rim; the painting is cropped to the circle. */
  border-radius: 999px;
  border: 3px solid #c8963d;
  box-shadow:
    0 0 0 1px #4a3110,
    inset 0 2px 6px rgb(0 0 0 / 0.5),
    0 3px 6px rgb(0 0 0 / 0.5);
  font: 600 24px var(--lq-font-display);
  transition:
    transform calc(150ms * var(--lq-motion)),
    box-shadow calc(150ms * var(--lq-motion)),
    border-color calc(150ms * var(--lq-motion));
}
.lq-belt-face {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
  filter: none;
}
.lq-belt-item .lq-belt-square {
  background: #18261b;
  color: #8fcf7a;
}
.lq-belt-spell .lq-belt-square {
  background: #241a33;
  color: #c79bf0;
}
.lq-belt-count {
  position: absolute;
  right: -5px;
  bottom: -5px;
  padding: 0 5px;
  border: 1px solid #4a3110;
  border-radius: 999px;
  background: linear-gradient(#f3d28a, #b9862f);
  color: #3a250b;
  font: 700 11px/16px var(--lq-font-ui);
}
.lq-belt-pic:focus-visible .lq-belt-square {
  transform: scale(1.08);
  border-color: #ffd77a;
  box-shadow:
    0 0 0 1px #4a3110,
    0 0 14px rgb(255 200 90 / 0.6);
}
@media (hover: hover) {
  .lq-belt-pic:hover .lq-belt-square {
    transform: scale(1.08);
    border-color: #ffd77a;
    box-shadow:
      0 0 0 1px #4a3110,
      0 0 14px rgb(255 200 90 / 0.6);
  }
}
/* The thing in hand keeps a lit, glowing rim. */
.lq-belt-pic.lq-lit .lq-belt-square {
  border-color: #ffd77a;
  box-shadow:
    0 0 0 1px #4a3110,
    0 0 0 3px #ffe3a3,
    0 0 16px rgb(255 200 90 / 0.8);
}
/* A gained thing has just flown in: its picture and the stud of its kind bump; a lost item rises out of the Bag's stud, which dips. */
.lq-belt-pic.lq-landed .lq-belt-square,
.lq-belt-tiny.lq-landed {
  transform: scale(1.12);
  transition: transform calc(140ms * var(--lq-motion)) ease-out;
}
.lq-belt-tiny.lq-dipped {
  transform: scale(0.88);
  transition: transform calc(140ms * var(--lq-motion)) ease-out;
}
.lq-belt-tiny:not(.lq-landed, .lq-dipped) {
  transition: transform calc(300ms * var(--lq-motion)) ease-in;
}
.lq-belt-pic:focus-visible .lq-belt-square,
.lq-belt-tiny:focus-visible,
.lq-belt-more:focus-visible {
  outline: 3px solid #ffe3a3;
  outline-offset: 2px;
}
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
