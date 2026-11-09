<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useBeltStore } from '@/stores/useBeltStore'
import { useFlightStore } from '@/stores/useFlightStore'
import { beltPictures, type BeltList, type BeltPicture } from '@/lantern/belt'
import { renderMarkup } from '@/utils/theme'

/**
 * The belt of pictures across the foot of the room's picture: the things
 * carried (the Bag) or the spells known, each a square with its name beneath
 * (none on a sideways phone, where the name is in the ring) in its usual
 * colour, ×2 on a counted thing, and the first letter of the name until the
 * picture is made. Two tiny buttons with pictures only, a pouch and a star,
 * sit at its left end: the lit one is the list showing, pressing the other
 * switches, and pressing either while the belt is away brings it back on that
 * list. ▾ puts it away. ‹ and › show when more pictures are carried than fit;
 * the strip also scrolls by wheel, swipe and arrow keys. The pictures are one
 * Tab stop (arrows walk, Home and End jump); Enter or Space presses. A press
 * says which picture and where (a key: its middle); what it does is the
 * layout's. The picture in hand stays lit. A caption above the belt gives the
 * name and short description of the picture pointed at or focused, or of
 * `captionFor` (the one whose ring is open). The list showing counts as seen,
 * so the amber dot only sits on the tiny button of the list not showing, and
 * on both while the belt is away. Which list and whether it is away are the
 * belt store's, remembered on this device.
 */
const props = defineProps<{
  /** A sideways phone: small pictures with no names beneath. */
  compact?: boolean
  /** The key of the picture whose ring is open, whose caption shows. */
  captionFor?: string | null
}>()
const emit = defineEmits<{
  press: [picture: BeltPicture, at: { x: number; y: number }]
  /** The height the belt takes at the foot of the picture (0 while away). */
  measure: [height: number]
}>()
const game = useGameStore()
const belt = useBeltStore()
const flights = useFlightStore()

const root = ref<HTMLElement | null>(null)
const strip = ref<HTMLElement | null>(null)
const pictures = computed(() =>
  beltPictures(game.rawInventory, game.rawSpells, belt.list),
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
const captionKey = computed(
  () => pointed.value ?? focused.value ?? props.captionFor ?? null,
)
const caption = computed(
  () => pictures.value.find((p) => p.key === captionKey.value) ?? null,
)
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

/** The list's tiny button was pressed: switch lists, or bring the belt back on it. */
function pick(list: BeltList): void {
  if (belt.away) belt.bringBack(list)
  else belt.show(list)
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
  const el = key
    ? all.find((t) => t.dataset.beltPic === key)
    : (all.find((t) => t.dataset.beltPic === rovingKey.value) ?? all[0])
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

let observer: ResizeObserver | undefined
/** The frame that applies a new size: on the next frame, so the layout it moves is not measured in the same one (no observer loop). */
let frame = 0
onMounted(() => {
  measureScroll()
  if (root.value && typeof ResizeObserver === 'function') {
    observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        measureScroll()
        emit('measure', belt.away ? 0 : (root.value?.offsetHeight ?? 0))
      })
    })
    observer.observe(root.value)
  }
  emit('measure', belt.away ? 0 : (root.value?.offsetHeight ?? 0))
})
onUnmounted(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  emit('measure', 0)
})
watch(
  () => belt.away,
  async () => {
    await nextTick()
    emit('measure', belt.away ? 0 : (root.value?.offsetHeight ?? 0))
    measureScroll()
  },
)

/** Focus the first picture, the tiny button of the list showing when none is carried. */
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
    :class="{ 'lq-belt-compact': compact, 'lq-belt-away': belt.away }"
    aria-label="Bag and spells"
  >
    <div v-if="caption && !belt.away" class="lq-belt-caption">
      <b :class="`lq-belt-cap-${caption.kind}`">{{ caption.label }}</b>
      <!-- eslint-disable vue/no-v-html -->
      <span v-html="renderMarkup(caption.note)"></span>
      <!-- eslint-enable vue/no-v-html -->
    </div>
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
      <template v-if="!belt.away">
        <button
          v-if="more.prev"
          type="button"
          class="lq-belt-more"
          data-belt-more="prev"
          aria-label="Earlier pictures"
          @click="page('prev')"
        >
          ‹
        </button>
        <div ref="strip" class="lq-belt-strip" @scroll.passive="measureScroll">
          <p v-if="!pictures.length" class="lq-belt-empty">
            {{
              belt.list === 'bag'
                ? 'Your bag is empty.'
                : 'You know no spells yet.'
            }}
          </p>
          <button
            v-for="picture in pictures"
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
            @pointerenter="pointed = picture.key"
            @pointerleave="pointed = null"
          >
            <span class="lq-belt-square" aria-hidden="true">
              <span class="lq-belt-letter">{{ picture.letter }}</span>
              <span v-if="picture.count > 1" class="lq-belt-count"
                >×{{ picture.count }}</span
              >
            </span>
            <span v-if="!compact" class="lq-belt-name" aria-hidden="true">{{
              picture.label
            }}</span>
            <span
              :id="`lq-belt-note-${picture.key.replace(/\W/g, '_')}`"
              class="lq-sr-only"
              >{{ plain(picture.note) }}</span
            >
          </button>
        </div>
        <button
          v-if="more.next"
          type="button"
          class="lq-belt-more"
          data-belt-more="next"
          aria-label="Later pictures"
          @click="page('next')"
        >
          ›
        </button>
        <button
          type="button"
          class="lq-belt-put-away"
          data-belt-away
          aria-label="Put the belt away"
          @click="belt.putAway()"
        >
          ▾
        </button>
      </template>
    </div>
  </section>
</template>

<style scoped>
.lq-belt {
  position: absolute;
  left: var(--lq-belt-left, 0px);
  right: 0;
  bottom: var(--lq-belt-bottom, 0px);
  z-index: 7;
  pointer-events: none;
  font-family: var(--lq-font-ui);
}
.lq-belt-away {
  right: auto;
}
.lq-belt-bar {
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 6px 8px;
}
.lq-belt-switch {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  pointer-events: auto;
}
.lq-belt-tiny,
.lq-belt-more,
.lq-belt-put-away {
  position: relative;
  flex: none;
  border: 1px solid var(--lq-line2);
  background: color-mix(in srgb, var(--lq-surface) 93%, transparent);
  color: var(--lq-fg);
  font: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
}
.lq-belt-tiny {
  width: 32px;
  height: 32px;
  padding: 6px;
  border-radius: 999px;
}
.lq-belt-compact .lq-belt-tiny {
  width: 28px;
  height: 28px;
  padding: 5px;
}
.lq-belt-tiny svg {
  width: 100%;
  height: 100%;
}
.lq-belt-tiny.lq-lit {
  border-color: var(--lq-accent);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
.lq-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--lq-accent);
}
.lq-belt-more,
.lq-belt-put-away {
  pointer-events: auto;
  align-self: center;
  width: 32px;
  height: 44px;
  border-radius: 10px;
}
.lq-belt-strip {
  /* Floats on the picture: only the pictures themselves take a press. */
  pointer-events: none;
  flex: 1;
  display: flex;
  gap: 10px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  scroll-behavior: smooth;
}
.lq-belt-strip::-webkit-scrollbar {
  display: none;
}
.lq-belt-empty {
  margin: 0;
  align-self: center;
  color: var(--lq-muted);
  font-size: 14px;
}
.lq-belt-pic {
  pointer-events: auto;
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 72px;
  padding: 0;
  border: none;
  background: none;
  font: 600 12px/1.15 var(--lq-font-ui);
  text-align: center;
  cursor: pointer;
}
.lq-belt-compact .lq-belt-pic {
  width: 48px;
}
.lq-belt-square {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid;
  font: 600 26px var(--lq-font-display);
}
.lq-belt-item .lq-belt-square {
  background: var(--lq-item-soft);
  border-color: var(--lq-item-line);
  color: var(--lq-item);
}
.lq-belt-spell .lq-belt-square {
  background: var(--lq-spell-soft);
  border-color: var(--lq-spell-line);
  color: var(--lq-spell);
}
.lq-belt-item .lq-belt-name {
  color: var(--lq-item);
}
.lq-belt-spell .lq-belt-name {
  color: var(--lq-spell);
}
.lq-belt-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 1px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--lq-surface) 88%, transparent);
}
.lq-belt-count {
  position: absolute;
  right: 3px;
  bottom: 3px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgb(34 32 27 / 0.82);
  color: #fff;
  font: 600 11px var(--lq-font-ui);
}
/* A gained thing has just flown in: its picture and the tiny button of its kind bump; a lost item rises out of the Bag's button, which dips. */
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
.lq-belt-pic.lq-lit .lq-belt-square {
  outline: 3px solid var(--lq-accent);
  outline-offset: 1px;
}
.lq-belt-pic:focus-visible .lq-belt-square,
.lq-belt-tiny:focus-visible,
.lq-belt-more:focus-visible,
.lq-belt-put-away:focus-visible {
  outline: 3px solid var(--lq-accent);
  outline-offset: 2px;
}
.lq-belt-caption {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 6px;
  max-width: min(520px, 92%);
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  color: var(--lq-fg);
  font-size: 13px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
  pointer-events: none;
}
.lq-belt-caption b {
  margin-right: 8px;
}
.lq-belt-cap-item {
  color: var(--lq-item);
}
.lq-belt-cap-spell {
  color: var(--lq-spell);
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
