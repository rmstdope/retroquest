<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from 'vue'
import {
  GAME_FULL_NAME,
  GAME_NAME_EYEBROW,
  GAME_NAME_WORDMARK,
  GAME_SUBTITLE,
} from '@/engine'
import { continueCard, filled, newestLoadable } from '@/lantern/saveCard'
import {
  pictureExists,
  roomPictureUrl,
  titlePictureUrl,
} from '@/lantern/roomPicture'
import type { SaveSlot } from '@/types/bridge'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useUiSounds } from '@/composables/useUiSounds'
import { TOUCH_QUERY, useMediaQuery } from '@/composables/useMediaQuery'
import { DEFAULT_TITLE_ZOOM } from '@/lantern/roomMotion'
import type { ImageZoom, MotionSpec } from '@/lantern/roomMotion'
import type { PictureSize } from '@/lantern/roomMotionScene'
import TitleMotion from './TitleMotion.vue'
import SaveThumb from './SaveThumb.vue'

/**
 * The game's title page, before the first act: a full-screen picture, the
 * game's name over its upper part, and, once the player asks for it, one
 * credit line for Content Studio and the choices, all on one pane of frosted
 * glass (the dock) near the foot of the picture. Every time it shows it opens
 * calmly and waits: the picture fades in, then the name over it, and nothing
 * else is on screen. If nothing is pressed 5 seconds after the name is fully
 * up, a quiet hint ("Press any key", or "Tap to begin" where the main input
 * is touch) fades in and breathes. Any key press, click or touch brings the
 * menu: the hint goes and the dock and the credit fade in together, half a
 * second. Until then the credit and the buttons are inert (neither focusable
 * nor pressable). The press does nothing else (a key's default action, such as
 * Enter pressing a button, is cancelled, and the press neither takes focus nor
 * presses what has appeared under it); it is heard on the window, since while
 * waiting focus is on the body, outside the page. The press still reaches the
 * other listeners, so the music starts on it. Under Reduce motion the same
 * screen is still: the picture and the name are there at once, the hint
 * appears 5 seconds after the page shows, and a press shows the menu at once.
 * Focus then lands on the main button. Enter on Start or Escape goes on.
 *
 The ring (a cream outline) is the focus on a choice. ↑ and ↓ move it between
 * the choices in the order on screen, wrapping round (from the credit link they
 * put it on the last or the first); a pointer entering a choice moves it there.
 * A ring that moves to another choice sounds a soft ting, a choice made a
 * latch; arriving on the main choice is silent. This ring is deliberately not
 * the menus' shared one (`useMenuRing` and the `data-ring` rule in
 * `lantern.css`): it lies over the full-bleed picture, so it stays cream in both
 * themes (the menus' follows the theme token), it is taken on `mouseenter` and
 * it walks the page's own choices rather than a dialog's stops.
 *
 * A returning player has `saves` (the quick save, the slots in use and the saves
 * made under a name): the page then offers Continue (a card naming the newest
 * save that can be loaded), New game and Load game, and Escape does nothing. When every
 * save is from an older version there is no Continue and New game is the
 * main button. `error` is why the last load from here failed.
 *
 * The picture is the title picture Content Studio makes, or the opening
 * dream's picture until it is made; while neither has loaded the page's plain
 * background stands in.
 *
 * The painting moves from its first moment, fading in already under way. The
 * painting and the movement drawn on it (`motion`, the effects the team tuned
 * for the title picture in Content Studio, see `TitleMotion.vue`) zoom slowly
 * in and back together (`zoom`: seconds each way and percent in, 16 s and 3%
 * until the team sets them, none when null); the shade, the text and the
 * buttons stay still. The effects are only drawn over the title picture, never
 * over the dream that stands in for it. The movement goes on behind the Load
 * game window, and under Reduce motion nothing moves, at once when it is
 * switched on while the page is up.
 */
const props = withDefaults(
  defineProps<{
    saves?: SaveSlot[]
    error?: string
    motion?: MotionSpec[]
    zoom?: ImageZoom | null
    pictureSize?: PictureSize
  }>(),
  {
    saves: () => [],
    error: '',
    motion: () => [],
    zoom: () => DEFAULT_TITLE_ZOOM,
    pictureSize: () => ({ width: 1920, height: 1080 }),
  },
)
const emit = defineEmits<{ start: []; continue: []; load: [] }>()
const hasSaves = computed(() => props.saves.some(filled))
const newest = computed(() => newestLoadable(props.saves))
/** What the Continue card says about the newest save. */
const card = computed(() => (newest.value ? continueCard(newest.value) : null))
/** The Continue card's name for a screen reader, its three lines read as one: "Continue, The Old Mill, Act II · …". */
const continueName = computed(() =>
  ['Continue', card.value?.title, card.value?.line].filter(Boolean).join(', '),
)
const loadButton = ref<HTMLButtonElement | null>(null)
const sounds = useUiSounds()

/** True while focus is put back on Load game, which is no move of the ring. */
let returning = false

/** Put focus on Load game (after its window closed). */
function focusLoad(): void {
  returning = true
  loadButton.value?.focus()
  returning = false
}
defineExpose({ focusLoad })
const titleId = useId()
const page = ref<HTMLElement | null>(null)
const trap = useFocusTrap(page)

/** When the name is fully up, in milliseconds after the page shows (the picture fades in for 2.4 s, the name for 2.4 s from 2 s in). */
const NAME_UP_MS = 4500
/** How long after the name is fully up, with nothing pressed, the hint fades in. */
const HINT_DELAY_MS = 5000

const reduced = useReducedMotion()
/** Whether the player has pressed: the menu (the dock and the credit) is up and there to use. */
const opened = ref(false)
/** Whether the hint is showing: nothing was pressed for a while. */
const hinted = ref(false)
const touch = useMediaQuery(TOUCH_QUERY)
/** The hint's words, which fit the device: a tap on a phone or tablet, a key on a computer. */
const hintText = computed(() =>
  !hinted.value || opened.value
    ? ''
    : touch.value
      ? 'Tap to begin'
      : 'Press any key',
)
let hintTimer: ReturnType<typeof setTimeout> | undefined

/** Start the wait for the hint; under Reduce motion the name is up at once. */
function startHintTimer(): void {
  clearTimeout(hintTimer)
  hintTimer = setTimeout(
    () => {
      hinted.value = true
    },
    (reduced.value ? 0 : NAME_UP_MS) + HINT_DELAY_MS,
  )
}
watch(opened, (now) => {
  if (now) void nextTick(trap.focusFirst)
})

/** The picture's URL: the title picture, or the dream's until it is made; '' until one has loaded. */
const picture = ref('')
/** Whether the picture up is the title picture itself, not the dream that stands in. */
const isTitlePicture = computed(() => picture.value === titlePictureUrl())
void (async (): Promise<void> => {
  for (const url of [titlePictureUrl(), roomPictureUrl('Act1', 'TheDream')]) {
    if (await pictureExists(url)) {
      picture.value = url
      return
    }
  }
})()

/** The key press that finished the opening, which no other handler of the page answers. */
let skippedBy: Event | null = null

/** Finish the opening at once; a key press is kept from pressing a button, a pointer press from pressing or focusing one. */
function skip(event: Event): void {
  if (opened.value) return
  opened.value = true
  clearTimeout(hintTimer)
  skippedBy = event
  if (event.type === 'keydown') event.preventDefault()
  else guardGesture()
}

/** True from a skipping pointer press until its click has passed, while the buttons ignore presses. */
const guarding = ref(false)

/** Keep the focus where the page put it, and the click from acting on what appeared under the press. */
function guardGesture(): void {
  guarding.value = true
  window.addEventListener('mousedown', cancelDefault, true)
  window.addEventListener('click', cancelDefault, true)
  window.addEventListener('click', releaseGesture)
  window.addEventListener('pointerdown', releaseGesture, true)
  window.addEventListener('keydown', releaseGesture, true)
}

/** Cancel an event's default without stopping it, so the music's listeners still hear the press. */
function cancelDefault(event: Event): void {
  event.preventDefault()
}

/** End the guard (after the gesture's click has passed, at the next press or key, or when the page goes). */
function releaseGesture(): void {
  guarding.value = false
  window.removeEventListener('mousedown', cancelDefault, true)
  window.removeEventListener('click', cancelDefault, true)
  window.removeEventListener('click', releaseGesture)
  window.removeEventListener('pointerdown', releaseGesture, true)
  window.removeEventListener('keydown', releaseGesture, true)
}

/** Emit a button's event, with the latch sound, unless it is the click of the press that skipped the opening. */
function press(action: () => void): void {
  if (guarding.value) return
  sounds.playChoose()
  action()
}

/** The choices, in the order on screen. */
function choices(): HTMLElement[] {
  return [
    ...(page.value?.querySelectorAll<HTMLElement>(
      '.lq-title-buttons > button',
    ) ?? []),
  ]
}

/** Move the ring one choice down (`step` 1) or up (-1), wrapping round; from outside the choices ↓ takes the first and ↑ the last. */
function moveRing(step: 1 | -1): void {
  const all = choices()
  if (all.length < 2 && all[0] === document.activeElement) return
  const at = all.findIndex((button) => button === document.activeElement)
  const to =
    at < 0
      ? step === 1
        ? 0
        : all.length - 1
      : (at + step + all.length) % all.length
  all[to]?.focus({ preventScroll: true })
}

/** Ting when the ring arrives from another element of the page (not on arrival, nor when focus returns to the page). */
function onChoiceFocus(event: FocusEvent): void {
  const from = event.relatedTarget
  if (returning) return
  if (from instanceof Node && page.value?.contains(from)) sounds.playMove()
}

/** The pointer entering a choice puts the ring on it. */
function onChoiceHover(event: MouseEvent): void {
  if (event.currentTarget instanceof HTMLElement)
    event.currentTarget.focus({ preventScroll: true })
}

function onKeydown(event: KeyboardEvent): void {
  if (event === skippedBy) return
  if (event.key === 'Escape') event.stopPropagation()
  else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    moveRing(event.key === 'ArrowDown' ? 1 : -1)
  } else trap.onKeydown(event)
}

onMounted(() => {
  startHintTimer()
  window.addEventListener('keydown', skip, true)
  window.addEventListener('pointerdown', skip, true)
})
onBeforeUnmount(() => {
  clearTimeout(hintTimer)
  window.removeEventListener('keydown', skip, true)
  window.removeEventListener('pointerdown', skip, true)
  releaseGesture()
})
</script>

<template>
  <section
    ref="page"
    class="lq-title-page"
    :class="[opened ? 'is-open' : 'is-playing', { 'is-still': reduced }]"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <div v-if="picture" class="lq-title-art" aria-hidden="true">
      <div
        class="lq-title-drift"
        :class="{ 'lq-title-drift-on': zoom && !reduced }"
        :style="
          zoom
            ? {
                '--lq-title-zoom-seconds': `${zoom.seconds}s`,
                '--lq-title-zoom-percent': zoom.percent,
              }
            : undefined
        "
      >
        <div
          class="lq-title-picture"
          :style="{ backgroundImage: `url('${picture}')` }"
        ></div>
        <TitleMotion
          :motion="isTitlePicture ? motion : []"
          :src="picture"
          :picture-size="pictureSize"
        />
      </div>
    </div>
    <div class="lq-title-shade" aria-hidden="true"></div>
    <div class="lq-title-inner">
      <div class="lq-title-name">
        <h2 :id="titleId" class="lq-sr-only">
          {{ GAME_FULL_NAME }}
        </h2>
        <span class="lq-title-eyebrow" aria-hidden="true">{{
          GAME_NAME_EYEBROW
        }}</span>
        <span class="lq-wordmark" aria-hidden="true">{{
          GAME_NAME_WORDMARK
        }}</span>
        <span class="lq-subtitle" aria-hidden="true">{{ GAME_SUBTITLE }}</span>
      </div>
      <p v-if="error" class="lq-title-error" role="alert">{{ error }}</p>
      <div
        class="lq-title-buttons lq-title-dock"
        :class="{ 'is-single': !hasSaves, 'is-pair': hasSaves && !card }"
        :inert="opened ? undefined : true"
        @focusin="onChoiceFocus"
      >
        <template v-if="!hasSaves">
          <button
            type="button"
            class="lq-title-start"
            data-autofocus
            @mouseenter="onChoiceHover"
            @click="press(() => emit('start'))"
          >
            Start
          </button>
        </template>
        <template v-else>
          <button
            v-if="card"
            type="button"
            class="lq-title-continue"
            :aria-label="continueName"
            data-autofocus
            @mouseenter="onChoiceHover"
            @click="press(() => emit('continue'))"
          >
            <SaveThumb
              v-if="newest"
              :save="newest"
              class="lq-continue-picture"
            />
            <span class="lq-continue-text">
              <span class="lq-continue-kicker">Continue</span>
              <span class="lq-continue-title">{{ card.title }}</span>
              <span class="lq-continue-line">{{ card.line }}</span>
            </span>
            <span class="lq-continue-play" aria-hidden="true">▶</span>
          </button>
          <button
            type="button"
            :class="card ? 'lq-title-second' : 'lq-title-start'"
            :data-autofocus="card ? undefined : ''"
            @mouseenter="onChoiceHover"
            @click="press(() => emit('start'))"
          >
            <span v-if="card" class="lq-title-icon" aria-hidden="true">✦</span
            >New game
          </button>
          <button
            ref="loadButton"
            type="button"
            class="lq-title-second"
            @mouseenter="onChoiceHover"
            @click="press(() => emit('load'))"
          >
            <span class="lq-title-icon" aria-hidden="true">☰</span>Load game
          </button>
        </template>
      </div>
      <p class="lq-title-hint" role="status">{{ hintText }}</p>
      <p class="lq-credit" :inert="opened ? undefined : true">
        Original music, images and narration made with
        <a
          href="https://github.com/rmstdope/content-studio"
          target="_blank"
          rel="noopener"
          >Content Studio</a
        >
      </p>
    </div>
  </section>
</template>

<style scoped>
.lq-title-page {
  position: fixed;
  inset: 0;
  z-index: var(--lq-z-page-title-page);
  overflow-y: auto;
  display: flex;
  background: var(--lq-bg);
  color: #ece6d6;
  font-family: var(--lq-font-ui);
  container-type: size;
  /* The title is always drawn on the dark scheme, over its picture, whatever the theme. */
  --lq-bg: #10151a;
  --lq-accent: #ffa914;
  --lq-on-accent: #1a1408;
  --lq-accent-text: #ffb836;
  --lq-accent-line: #a8740f;
  --lq-failure: #e8896b;
  --lq-failure-soft: #2a1814;
}
.lq-title-page:focus {
  outline: none;
}
.lq-title-art {
  position: fixed;
  inset: 0;
  overflow: hidden;
  opacity: 0;
}
.lq-title-drift {
  position: absolute;
  inset: 0;
}
.lq-title-drift-on {
  animation: lq-title-drift var(--lq-title-zoom-seconds) ease-in-out infinite
    alternate;
}
.lq-title-picture {
  position: absolute;
  inset: 0;
  background: center / cover no-repeat;
}
/* Darker at the top behind the name, at the foot behind the dock, and towards the corners. */
.lq-title-shade {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      ellipse at 50% 30%,
      rgb(16 21 26 / 0) 30%,
      rgb(16 21 26 / 0.55) 100%
    ),
    linear-gradient(180deg, rgb(16 21 26 / 0.55) 0%, rgb(16 21 26 / 0) 35%),
    linear-gradient(0deg, rgb(16 21 26 / 0.7) 0%, rgb(16 21 26 / 0) 40%);
}
.lq-title-inner {
  position: relative;
  width: 100%;
  min-height: 100%;
  margin: 0 auto;
  padding: 8cqh 16px 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lq-title-name {
  margin-bottom: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
}
.lq-title-eyebrow {
  padding-left: 0.5em;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgb(236 230 214 / 0.85);
  text-shadow: 0 1px 3px #000;
}
/* The name in amber, lit from above: cream at the top, deep amber at the foot. */
.lq-wordmark {
  max-width: 100%;
  font-family: var(--lq-font-display);
  font-size: clamp(56px, 9vw, 120px);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.015em;
  background: linear-gradient(
    180deg,
    #fff3d4 10%,
    var(--lq-accent-text) 60%,
    #c97a0a 100%
  );
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 18px rgb(0 0 0 / 0.55));
}
.lq-subtitle {
  margin-top: 6px;
  font-family: var(--lq-font-prose);
  font-size: 22px;
  font-style: italic;
  line-height: 1.15;
  color: #ece6d6;
  text-shadow: 0 1px 6px #000;
}
.lq-title-error {
  margin: 0 0 14px;
  max-width: 320px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--lq-failure-soft);
  color: var(--lq-failure);
  font-size: 14px;
}
/* The dock: one pane of frosted glass holding every choice. */
.lq-title-dock {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  width: min(720px, 100%);
  margin-bottom: 24px;
  padding: 10px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 22px;
  background: rgb(18 22 28 / 0.5);
  backdrop-filter: blur(18px) saturate(1.3);
  opacity: 0;
  transition: opacity 0.5s ease;
  box-shadow:
    0 20px 60px rgb(0 0 0 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
}
.lq-title-dock.is-single {
  display: flex;
  width: min(420px, 100%);
}
.lq-title-dock > button {
  border: 1px solid transparent;
  border-radius: 14px;
  color: #ece6d6;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.18s,
    border-color 0.18s;
}
.lq-title-dock > button:focus {
  outline: 2px solid #f4ecd2;
  outline-offset: 2px;
}
.lq-title-continue {
  grid-row: span 2;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 12px 14px 12px 20px;
  background: rgb(255 255 255 / 0.06);
  text-align: left;
}
/* The snapshot's look is SaveThumb's own; here only its size on the card. */
.lq-continue-picture {
  width: 112px;
}
.lq-title-continue:has(.lq-continue-picture) {
  padding-left: 12px;
}
.lq-continue-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lq-continue-kicker {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
}
.lq-continue-title {
  overflow: hidden;
  font-family: var(--lq-font-display);
  font-size: 24px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.lq-continue-line {
  font-size: 12px;
  font-weight: 400;
  color: rgb(236 230 214 / 0.7);
}
.lq-continue-play {
  flex: none;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding-left: 3px;
  border-radius: 50%;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-size: 14px;
}
.lq-title-second {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 170px;
  padding: 0 18px;
  background: rgb(255 255 255 / 0.04);
}
.lq-title-icon {
  width: 16px;
  color: var(--lq-accent-text);
}
/* Every save outdated: Load game fills its column beside the amber New game. */
.lq-title-dock.is-pair > .lq-title-second {
  grid-row: span 2;
  justify-content: center;
  height: auto;
}
/* The main choice when there is no save to continue: amber, filling its place. */
.lq-title-dock > .lq-title-start {
  flex: 1;
  grid-row: span 2;
  min-height: 58px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-size: 17px;
}
.lq-title-continue:hover,
.lq-title-continue:focus,
.lq-title-second:hover,
.lq-title-second:focus {
  border-color: rgb(255 214 140 / 0.65);
  background: rgb(255 255 255 / 0.13);
}
.lq-title-dock > .lq-title-start:hover,
.lq-title-dock > .lq-title-start:focus {
  background: #ffbb3c;
}
.lq-credit {
  position: absolute;
  left: 50%;
  bottom: 18px;
  width: max-content;
  max-width: calc(100% - 32px);
  margin: 0;
  font-size: 12px;
  text-wrap: balance;
  color: rgb(236 230 214 / 0.73);
  text-shadow: 0 1px 3px #000;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.5s ease;
}
.lq-credit a {
  color: var(--lq-accent-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}
/* The wait: the picture fades in, then the name over it; nothing else is up until the player presses. */
.is-playing .lq-title-art {
  animation: lq-title-fade 2.4s ease forwards;
}
.is-playing .lq-title-name {
  animation: lq-title-fade 2.4s ease 2s forwards;
}
/* A press finishes the picture and the name at once and fades the menu up, all together. */
.is-open .lq-title-art,
.is-open .lq-title-name,
.is-open .lq-credit,
.is-open .lq-title-dock {
  opacity: 1;
}
.is-still .lq-title-art,
.is-still .lq-title-name {
  opacity: 1;
  animation: none;
}
.is-still .lq-credit,
.is-still .lq-title-dock {
  transition: none;
}
/* The hint, where the menu will appear; it fades in, breathes until the press, then fades out. */
.lq-title-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: max(70px, 12cqh);
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.32em;
  text-indent: 0.32em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #ece6d6;
  text-shadow:
    0 1px 4px #000,
    0 0 14px #000;
  pointer-events: none;
  opacity: 0;
}
.is-playing .lq-title-hint:not(:empty) {
  animation:
    lq-title-fade 1.2s ease forwards,
    lq-title-breathe 3.2s ease-in-out 1.2s infinite alternate;
}
.is-still .lq-title-hint:not(:empty) {
  animation: none;
  opacity: 1;
}
@keyframes lq-title-fade {
  to {
    opacity: 1;
  }
}
/* The size is the team's, in percent; the shift is the rooms' (a sixth, and a tenth, of it). */
@keyframes lq-title-drift {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(calc(1 + var(--lq-title-zoom-percent) / 100))
      translate(
        calc(var(--lq-title-zoom-percent) * -0.1667%),
        calc(var(--lq-title-zoom-percent) * -0.1%)
      );
  }
}
@keyframes lq-title-breathe {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.5;
  }
}
/* A phone held upright: the name sits lower, Continue gets a row of its own over the other two. */
@media (max-width: 599px) {
  .lq-title-inner {
    padding-top: 12cqh;
  }
  .lq-wordmark {
    font-size: 56px;
  }
  .lq-subtitle {
    font-size: 18px;
  }
  .lq-title-dock {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }
  .lq-title-continue,
  .lq-title-dock > .lq-title-start {
    grid-row: auto;
    grid-column: span 2;
  }
  .lq-title-dock.is-pair > .lq-title-second {
    grid-row: auto;
    grid-column: span 2;
    height: 48px;
  }
  .lq-continue-title {
    font-size: 20px;
  }
  .lq-continue-picture {
    width: 84px;
  }
  .lq-continue-play {
    display: none;
  }
  .lq-title-second {
    justify-content: center;
    min-width: 0;
    height: 48px;
    padding: 0 10px;
    white-space: nowrap;
  }
  .lq-credit {
    width: auto;
  }
}
/* A phone held sideways: a smaller name and a slimmer dock. */
@media (max-height: 449px) {
  .lq-title-inner {
    padding: 4cqh 16px 36px;
  }
  .lq-title-eyebrow {
    font-size: 11px;
  }
  .lq-wordmark {
    font-size: 40px;
  }
  .lq-subtitle {
    margin-top: 2px;
    font-size: 14px;
  }
  .lq-title-dock {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 6px;
    margin-bottom: 8px;
    padding: 6px;
    border-radius: 16px;
  }
  .lq-title-continue,
  .lq-title-dock > .lq-title-start {
    grid-row: span 2;
    grid-column: auto;
  }
  .lq-title-dock.is-pair > .lq-title-second {
    grid-row: span 2;
    grid-column: auto;
    height: auto;
  }
  .lq-title-continue {
    padding: 6px 10px 6px 14px;
  }
  .lq-title-continue:has(.lq-continue-picture) {
    padding-left: 6px;
  }
  .lq-continue-picture {
    width: 72px;
    border-radius: 7px;
  }
  .lq-continue-title {
    font-size: 18px;
  }
  .lq-continue-play {
    display: grid;
    width: 36px;
    height: 36px;
  }
  .lq-title-second {
    min-width: 150px;
    height: 38px;
  }
  .lq-title-dock > .lq-title-start {
    min-height: 46px;
  }
  .lq-credit {
    bottom: 10px;
  }
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
