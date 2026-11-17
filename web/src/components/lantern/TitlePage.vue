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
import { continueLine, filled, newestLoadable } from '@/lantern/saveCard'
import {
  pictureExists,
  roomPictureUrl,
  titlePictureUrl,
} from '@/lantern/roomPicture'
import type { SaveSlot } from '@/types/bridge'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useUiSounds } from '@/composables/useUiSounds'

/**
 * The game's title page, before the first act: a full-screen picture, the
 * game's name over its upper part, one credit line for Content Studio and the
 * buttons. Unless the player wants less motion it opens in a fixed order (the
 * picture, the name, the credit, then the buttons rising one after another,
 * about 5½ seconds in all); until the opening is over the credit and the
 * buttons are inert (neither focusable nor pressable). Any key press or press
 * anywhere finishes the opening at once and does nothing else (a key's
 * default action, such as Enter pressing a button, is cancelled, and the
 * press neither takes focus nor presses what has appeared under it); it is heard on the window, since during the
 * opening focus is on the body, outside the page. The press still reaches the
 * other listeners, so the music starts on it.
 * Focus then lands on the main button. Enter on Start or Escape goes on.
 *
 * The ring (a cream outline) is the focus on a choice. ↑ and ↓ move it between
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
 * made under a name): the page then offers Continue (the newest save that can be loaded, named under
 * the word), New game and Load game, and Escape does nothing. When every
 * save is from an older version there is no Continue and New game is the
 * main button. `error` is why the last load from here failed.
 *
 * The picture is the title picture Content Studio makes, or the opening
 * dream's picture until it is made; while neither has loaded the page's plain
 * background stands in.
 */
const props = withDefaults(
  defineProps<{
    saves?: SaveSlot[]
    error?: string
  }>(),
  { saves: () => [], error: '' },
)
const emit = defineEmits<{ start: []; continue: []; load: [] }>()
const hasSaves = computed(() => props.saves.some(filled))
const newest = computed(() => newestLoadable(props.saves))
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

const reduced = useReducedMotion()
/** Whether the opening is over: the credit and the buttons are there to use. */
const opened = ref(reduced.value)
watch(reduced, (now) => {
  if (now) opened.value = true
})
watch(opened, (now) => {
  if (now) void nextTick(trap.focusFirst)
})

/** The picture's URL: the title picture, or the dream's until it is made; '' until one has loaded. */
const picture = ref('')
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

/** The opening is over once the last button has risen. */
function onRisen(event: AnimationEvent): void {
  const buttons = event.currentTarget as HTMLElement
  if (event.target === buttons.lastElementChild) opened.value = true
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
  if (opened.value) void nextTick(trap.focusFirst)
  window.addEventListener('keydown', skip, true)
  window.addEventListener('pointerdown', skip, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', skip, true)
  window.removeEventListener('pointerdown', skip, true)
  releaseGesture()
})
</script>

<template>
  <section
    ref="page"
    class="lq-title-page"
    :class="opened ? 'is-open' : 'is-playing'"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    tabindex="-1"
    @keydown="onKeydown"
  >
    <div
      v-if="picture"
      class="lq-title-picture"
      :style="{ backgroundImage: `url('${picture}')` }"
      aria-hidden="true"
    ></div>
    <div class="lq-title-shade" aria-hidden="true"></div>
    <div class="lq-title-inner">
      <div class="lq-title-name">
        <span class="lq-welcome">Welcome to</span>
        <h2 :id="titleId" class="lq-sr-only">
          Tales of Twinmoor: Wardens of the Dawn
        </h2>
        <span class="lq-wordmark" aria-hidden="true">Tales of Twinmoor</span>
        <span class="lq-title-rule" aria-hidden="true"
          ><span class="lq-title-rule-line"></span>◆<span
            class="lq-title-rule-line"
          ></span
        ></span>
        <span class="lq-subtitle" aria-hidden="true">Wardens of the Dawn</span>
      </div>
      <p v-if="error" class="lq-title-error" role="alert">{{ error }}</p>
      <div
        class="lq-title-buttons"
        :inert="opened ? undefined : true"
        @animationend="onRisen"
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
            v-if="newest"
            type="button"
            class="lq-title-start"
            data-autofocus
            @mouseenter="onChoiceHover"
            @click="press(() => emit('continue'))"
          >
            Continue
            <span class="lq-title-line">{{ continueLine(newest) }}</span>
          </button>
          <button
            type="button"
            :class="newest ? 'lq-title-second' : 'lq-title-start'"
            :data-autofocus="newest ? undefined : ''"
            @mouseenter="onChoiceHover"
            @click="press(() => emit('start'))"
          >
            New game
          </button>
          <button
            ref="loadButton"
            type="button"
            class="lq-title-second"
            @mouseenter="onChoiceHover"
            @click="press(() => emit('load'))"
          >
            Load game
          </button>
        </template>
      </div>
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
  z-index: 70;
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
.lq-title-picture {
  position: fixed;
  inset: 0;
  background: center / cover no-repeat;
  opacity: 0;
}
.lq-title-shade {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgb(16 21 26 / 0.82) 0%,
    rgb(16 21 26 / 0.25) 38%,
    rgb(16 21 26 / 0.19) 55%,
    rgb(16 21 26 / 0.75) 100%
  );
}
.lq-title-inner {
  position: relative;
  width: 100%;
  margin: 0 auto;
  padding: 9cqh 16px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.lq-title-name {
  margin-bottom: auto;
  opacity: 0;
}
.lq-welcome {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgb(236 230 214 / 0.8);
  text-shadow: 0 1px 3px #000;
}
.lq-wordmark {
  display: block;
  max-width: 100%;
  font-family: var(--lq-font-display);
  font-size: 84px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  text-wrap: balance;
  color: var(--lq-accent-text);
  text-shadow:
    0 0 22px rgb(0 0 0 / 0.8),
    0 2px 3px #000;
}
.lq-title-rule {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 220px;
  max-width: 100%;
  margin: 10px auto;
  color: var(--lq-accent-line);
}
.lq-title-rule-line {
  flex: 1;
  height: 1px;
  background: var(--lq-accent-line);
}
.lq-subtitle {
  display: block;
  font-family: var(--lq-font-display);
  font-size: 28px;
  font-style: italic;
  line-height: 1.15;
  text-align: center;
  color: #ece6d6;
  text-shadow: 0 1px 3px #000;
}
.lq-title-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  margin-bottom: 6cqh;
}
.lq-title-buttons > button {
  width: 300px;
  opacity: 0;
  transform: translateY(6px);
}
.lq-credit {
  position: absolute;
  left: 18px;
  bottom: 14px;
  max-width: calc(100% - 36px);
  margin: 0;
  font-size: 12px;
  color: rgb(236 230 214 / 0.73);
  text-shadow: 0 1px 3px #000;
  opacity: 0;
}
.lq-credit a {
  color: var(--lq-accent-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.lq-title-buttons > button:focus {
  outline: 3px solid #f4ecd2;
  outline-offset: 3px;
}
.lq-title-start {
  min-height: 54px;
  padding: 6px 28px;
  border: none;
  border-radius: 12px;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.lq-title-line {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 400;
  opacity: 0.85;
}
.lq-title-second {
  height: 48px;
  padding: 0 28px;
  border: 1px solid var(--lq-accent-line);
  border-radius: 12px;
  background: rgb(16 21 26 / 0.8);
  backdrop-filter: blur(4px);
  color: var(--lq-accent-text);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
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
/* The opening: picture, name, credit, then the buttons one after another. */
.is-playing .lq-title-picture {
  animation: lq-title-fade 2.4s ease forwards;
}
.is-playing .lq-title-name {
  animation: lq-title-fade 2.4s ease 2s forwards;
}
.is-playing .lq-credit {
  animation: lq-title-fade 0.4s ease 4.4s forwards;
}
.is-playing .lq-title-buttons > button {
  animation: lq-title-rise 0.35s ease forwards;
}
.is-playing .lq-title-buttons > button:nth-child(1) {
  animation-delay: 4.8s;
}
.is-playing .lq-title-buttons > button:nth-child(2) {
  animation-delay: 4.98s;
}
.is-playing .lq-title-buttons > button:nth-child(3) {
  animation-delay: 5.16s;
}
.is-open .lq-title-picture,
.is-open .lq-title-name,
.is-open .lq-credit {
  opacity: 1;
}
.is-open .lq-title-buttons > button {
  opacity: 1;
  transform: none;
}
@keyframes lq-title-fade {
  to {
    opacity: 1;
  }
}
@keyframes lq-title-rise {
  to {
    opacity: 1;
    transform: none;
  }
}
/* A phone held upright: the name sits lower, the buttons fill the width. */
@media (max-width: 499px) {
  .lq-title-inner {
    padding-top: 14cqh;
  }
  .lq-wordmark {
    font-size: 48px;
  }
  .lq-subtitle {
    font-size: 18px;
  }
  .lq-title-buttons {
    width: 100%;
    max-width: 320px;
  }
  .lq-title-buttons > button {
    width: 100%;
  }
  .lq-credit {
    bottom: 12px;
  }
}
/* A phone held sideways: smaller name, Continue on a row of its own. */
@media (max-height: 449px) {
  .lq-title-inner {
    padding: 4cqh 16px 46px;
  }
  .lq-welcome {
    margin-bottom: 4px;
  }
  .lq-wordmark {
    font-size: 36px;
  }
  .lq-title-rule {
    display: none;
  }
  .lq-subtitle {
    margin-top: 4px;
    font-size: 14px;
  }
  .lq-title-buttons {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    max-width: 460px;
    margin-bottom: 0;
  }
  .lq-title-buttons > button {
    flex: 1;
    width: auto;
    height: 42px;
  }
  .lq-title-buttons > .lq-title-start {
    flex-basis: 100%;
    max-width: 420px;
    height: auto;
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
