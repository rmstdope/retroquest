<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useSettingsStore,
  type StartMode,
  type ThemeSetting,
} from '@/stores/useSettingsStore'
import { useMenuRing } from '@/composables/useMenuRing'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useFullscreen } from '@/composables/useFullscreen'
import { useMediaQuery, KEYBOARD_QUERY } from '@/composables/useMediaQuery'
import { LANTERN_TEXT_SIZES } from '@/lantern/tokens'
import LanternDialog from './LanternDialog.vue'
import type { KeyHint } from './KeyLine.vue'

/**
 * The player's settings, saved in this browser: theme and text size, music,
 * sound effects and narration (on/off and volume), how the actions start, and reduce
 * motion (which follows the device until it is changed here). Full screen is a
 * switch at the end of Appearance (left out where the browser cannot do it,
 * with a line about the F key for a keyboard only).
 *
 * `musicInfo` is the credit of the music actually playing (a take chosen in
 * Content Studio has its own), as the layout's music player holds it.
 *
 * It works from the keyboard. Each row is a stop and the selection ring goes round
 * the whole row, starting on Theme: ↑ ↓ move between the rows (round the
 * ends, scrolling to keep the row in view; the Music, Sound effects and
 * Narration headings are not stops, their Volume rows are); ← → change the
 * ringed row at once (the next or previous choice, stopping at the ends; a
 * volume by 5, stopping at 0 and 100; a switch is flipped); Enter or Space
 * flips a ringed switch and does nothing on a choice or a volume. A change
 * sounds the soft ting (a volume at its new loudness), a switch or a click the
 * latch; a key that changes nothing is silent. A control reached with Tab acts
 * as it always did.
 */
const props = withDefaults(defineProps<{ musicInfo?: string }>(), {
  musicInfo: '',
})
const emit = defineEmits<{ close: [] }>()
const settings = useSettingsStore()

const THEMES: Array<{ value: ThemeSetting; label: string }> = [
  { value: 'device', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const STARTS: Array<{ value: StartMode; label: string }> = [
  { value: 'actions', label: 'Actions' },
  { value: 'type', label: 'Type' },
]

const ring = useMenuRing('[data-stop]', undefined, true)
const root = ref<HTMLElement | null>(null)
const KEYS: KeyHint[] = [
  { keys: ['↑', '↓'], word: 'move' },
  { keys: ['←', '→'], word: 'change' },
  { keys: ['Esc'], word: 'back' },
]
/** The rows that are switches. */
const SWITCHES = ['fullscreen', 'reduceMotion', 'alwaysShowNames']
/** A volume moves this much for each ← or →. */
const VOLUME_STEP = 5

/** The choice `step` along from `current` in `values`, stopping at the ends. */
function along<T>(values: T[], current: T, step: 1 | -1): T {
  const at = values.indexOf(current)
  return values[Math.min(Math.max(at + step, 0), values.length - 1)]
}

/** A volume `step` notches along, kept within 0 to 100. */
function louder(current: number, step: 1 | -1): number {
  return Math.min(100, Math.max(0, current + step * VOLUME_STEP))
}

const fullscreen = useFullscreen()
const keyboardPlayer = useMediaQuery(KEYBOARD_QUERY)
const motionReduced = useReducedMotion()

/** Flip a switch row, with the latch. */
function flip(kind: string): void {
  ring.choose()
  if (kind === 'fullscreen') fullscreen.toggle()
  else if (kind === 'reduceMotion')
    settings.reduceMotion = motionReduced.value ? 'off' : 'on'
  else if (kind === 'alwaysShowNames')
    settings.alwaysShowNames = !settings.alwaysShowNames
}

/** A choice picked with the pointer (or Enter on a control reached with Tab), with the latch. */
function pick(set: () => void): void {
  ring.choose()
  set()
}

/** The settings a ← or → can change, as one string to compare. */
function snapshot(): string {
  return [
    settings.theme,
    settings.textSize,
    settings.startMode,
    settings.musicVolume,
    settings.effectsVolume,
    settings.narrationVolume,
  ].join('|')
}

/** Change the ringed row one step: a choice, a volume or a switch; the ting follows a real change. */
function change(kind: string, step: 1 | -1): void {
  if (SWITCHES.includes(kind)) return flip(kind)
  const before = snapshot()
  if (kind === 'theme')
    settings.theme = along(
      THEMES.map((t) => t.value),
      settings.theme,
      step,
    )
  else if (kind === 'textSize')
    settings.textSize = along(
      LANTERN_TEXT_SIZES.map((s) => s.value),
      settings.textSize,
      step,
    )
  else if (kind === 'startMode')
    settings.startMode = along(
      STARTS.map((s) => s.value),
      settings.startMode,
      step,
    )
  else if (kind === 'musicVolume')
    settings.musicVolume = louder(settings.musicVolume, step)
  else if (kind === 'effectsVolume')
    settings.effectsVolume = louder(settings.effectsVolume, step)
  else if (kind === 'narrationVolume')
    settings.narrationVolume = louder(settings.narrationVolume, step)
  const after = snapshot()
  if (after !== before) ring.moved()
}

/** The arrows, Enter and Space of the ringed row. */
function onKeydown(event: KeyboardEvent): void {
  const target = event.target
  const stop =
    target instanceof Element
      ? target.closest<HTMLElement>('[data-stop]')
      : null
  if (!stop) return
  const kind = stop.dataset.stop ?? ''
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    const rows = [
      ...(root.value?.querySelectorAll<HTMLElement>('[data-stop]') ?? []),
    ]
    const step = event.key === 'ArrowDown' ? 1 : -1
    ring.ringTo(rows[(rows.indexOf(stop) + step + rows.length) % rows.length])
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    change(kind, event.key === 'ArrowRight' ? 1 : -1)
  } else if ((event.key === 'Enter' || event.key === ' ') && target === stop) {
    event.preventDefault()
    if (SWITCHES.includes(kind)) flip(kind)
  }
}

/** The first line of the track's credits ("Market by Conquest"). */
const nowPlaying = computed(() => props.musicInfo.split('\n')[0]?.trim() ?? '')

function volume(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <LanternDialog
    title="Settings"
    eyebrow="Game"
    :key-line="KEYS"
    @close="emit('close')"
    @focusin="ring.onFocusIn"
    @mousemove="ring.onMove"
    @click="ring.onPress"
    @keydown.tab="ring.afterTab"
  >
    <div ref="root" @keydown="onKeydown">
      <section class="lq-group" aria-labelledby="lq-set-look">
        <h3 id="lq-set-look" class="lq-group-title">Appearance</h3>
        <div
          class="lq-row lq-stop"
          data-ring="within"
          data-stop="theme"
          data-autofocus
          tabindex="-1"
        >
          <span class="lq-row-text"
            ><span class="lq-row-label">Theme</span
            ><span class="lq-note">Device follows your system</span></span
          >
          <div class="lq-seg" role="group" aria-label="Theme">
            <button
              v-for="t in THEMES"
              :key="t.value"
              type="button"
              class="lq-seg-btn"
              :aria-pressed="settings.theme === t.value ? 'true' : 'false'"
              @click="pick(() => (settings.theme = t.value))"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
        <div
          class="lq-row lq-row-wrap lq-stop"
          data-ring="within"
          data-stop="textSize"
          tabindex="-1"
        >
          <span class="lq-row-text"
            ><span class="lq-row-label">Text size</span
            ><span class="lq-note">Story text only</span></span
          >
          <div class="lq-seg" role="group" aria-label="Text size">
            <button
              v-for="s in LANTERN_TEXT_SIZES"
              :key="s.value"
              type="button"
              class="lq-seg-btn"
              :aria-label="s.label"
              :aria-pressed="settings.textSize === s.value ? 'true' : 'false'"
              :style="{ fontSize: `${s.px}px` }"
              @click="pick(() => (settings.textSize = s.value))"
            >
              A
            </button>
          </div>
        </div>
        <p class="lq-sample">
          The great boughs creak overhead as silver leaves drift down around
          you.
        </p>
        <div
          v-if="fullscreen.supported"
          class="lq-row lq-stop"
          data-ring="within"
          data-stop="fullscreen"
          tabindex="-1"
        >
          <span class="lq-row-text"
            ><span class="lq-row-label">Full screen</span
            ><span v-if="keyboardPlayer" class="lq-note"
              >Press F to switch it on or off</span
            ></span
          >
          <button
            type="button"
            role="switch"
            class="lq-switch"
            aria-label="Full screen"
            :aria-checked="fullscreen.active.value ? 'true' : 'false'"
            @click="flip('fullscreen')"
          >
            <span class="lq-knob"></span>
          </button>
        </div>
      </section>

      <section class="lq-group" aria-labelledby="lq-set-sound">
        <h3 id="lq-set-sound" class="lq-group-title">Sound</h3>
        <div class="lq-row">
          <span class="lq-row-text"
            ><span class="lq-row-label">Music</span
            ><span class="lq-note">A different track for each act</span></span
          >
        </div>
        <label
          class="lq-volume lq-stop"
          data-ring="within"
          data-stop="musicVolume"
          tabindex="-1"
        >
          <span class="lq-note">Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            aria-label="Music volume"
            :value="settings.musicVolume"
            @input="settings.musicVolume = volume($event)"
          />
          <span class="lq-volume-num">{{ settings.musicVolume }}</span>
        </label>
        <div class="lq-row">
          <span class="lq-row-text"
            ><span class="lq-row-label">Sound effects</span
            ><span class="lq-note">Quest chime and fanfare</span></span
          >
        </div>
        <label
          class="lq-volume lq-stop"
          data-ring="within"
          data-stop="effectsVolume"
          tabindex="-1"
        >
          <span class="lq-note">Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            aria-label="Sound effects volume"
            :value="settings.effectsVolume"
            @input="settings.effectsVolume = volume($event)"
          />
          <span class="lq-volume-num">{{ settings.effectsVolume }}</span>
        </label>
        <div class="lq-row">
          <span class="lq-row-text"
            ><span class="lq-row-label">Narration</span
            ><span class="lq-note"
              >The story and every character read aloud</span
            ></span
          >
        </div>
        <label
          class="lq-volume lq-stop"
          data-ring="within"
          data-stop="narrationVolume"
          tabindex="-1"
        >
          <span class="lq-note">Volume</span>
          <input
            type="range"
            min="0"
            max="100"
            aria-label="Narration volume"
            :value="settings.narrationVolume"
            @input="settings.narrationVolume = volume($event)"
          />
          <span class="lq-volume-num">{{ settings.narrationVolume }}</span>
        </label>
        <p v-if="nowPlaying" class="lq-now-playing">
          <span class="lq-note">Now playing</span>
          <span>{{ nowPlaying }}</span>
        </p>
      </section>

      <section class="lq-group" aria-labelledby="lq-set-play">
        <h3 id="lq-set-play" class="lq-group-title">Playing</h3>
        <div
          class="lq-row lq-stop"
          data-ring="within"
          data-stop="startMode"
          tabindex="-1"
        >
          <span class="lq-row-text"
            ><span class="lq-row-label">Start with</span
            ><span class="lq-note">You can switch any time</span></span
          >
          <div class="lq-seg" role="group" aria-label="Start with">
            <button
              v-for="s in STARTS"
              :key="s.value"
              type="button"
              class="lq-seg-btn"
              :aria-pressed="settings.startMode === s.value ? 'true' : 'false'"
              @click="pick(() => (settings.startMode = s.value))"
            >
              {{ s.label }}
            </button>
          </div>
        </div>
        <div
          class="lq-row lq-stop"
          data-ring="within"
          data-stop="reduceMotion"
          tabindex="-1"
        >
          <span class="lq-row-text"
            ><span class="lq-row-label">Reduce motion</span
            ><span class="lq-note"
              >No shake, slide-in or moving pictures<template
                v-if="settings.reduceMotion === 'device'"
                >. Follows your device</template
              ></span
            ></span
          >
          <button
            type="button"
            role="switch"
            class="lq-switch"
            aria-label="Reduce motion"
            :aria-checked="motionReduced ? 'true' : 'false'"
            @click="flip('reduceMotion')"
          >
            <span class="lq-knob"></span>
          </button>
        </div>
        <div
          class="lq-row lq-stop"
          data-ring="within"
          data-stop="alwaysShowNames"
          tabindex="-1"
        >
          <span class="lq-row-text"
            ><span class="lq-row-label">Always show what's here</span
            ><span class="lq-note"
              >Marks and names stay on the picture in every room.</span
            ></span
          >
          <button
            type="button"
            role="switch"
            class="lq-switch"
            aria-label="Always show what's here"
            :aria-checked="settings.alwaysShowNames ? 'true' : 'false'"
            @click="flip('alwaysShowNames')"
          >
            <span class="lq-knob"></span>
          </button>
        </div>
      </section>
    </div>
  </LanternDialog>
</template>

<style scoped>
/* The ring itself is drawn by `[data-ring]` in lantern.css; here only the row's corners. */
.lq-stop:focus-within {
  border-radius: 8px;
}
.lq-stop :focus-visible {
  outline: 2px solid var(--lq-ring);
  outline-offset: 2px;
}
.lq-group + .lq-group {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--lq-line);
}
.lq-group-title {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lq-accent-text);
}
.lq-row {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.lq-row-wrap {
  flex-wrap: wrap;
  row-gap: 8px;
}
.lq-row-wrap .lq-row-text {
  flex: 1 1 8rem;
}
.lq-row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lq-row-label {
  font-size: 15px;
}
.lq-note {
  font-size: 12px;
  line-height: 1.35;
  color: var(--lq-muted);
}
.lq-seg {
  flex: 0 0 auto;
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 12px;
  border: 1px solid var(--lq-line);
  background: var(--lq-bg);
}
.lq-seg-btn {
  min-width: 44px;
  min-height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-seg-btn[aria-pressed='true'] {
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
}
.lq-sample {
  margin: 6px 0 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-switch {
  position: relative;
  flex: 0 0 auto;
  width: 48px;
  height: 28px;
  padding: 0;
  border-radius: 14px;
  border: 1px solid var(--lq-line2);
  background: var(--lq-raised);
  cursor: pointer;
}
.lq-switch[aria-checked='true'] {
  border-color: var(--lq-accent);
  background: var(--lq-accent);
}
.lq-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: var(--lq-muted);
  transition: left calc(0.15s * var(--lq-motion));
}
.lq-switch[aria-checked='true'] .lq-knob {
  left: 23px;
  background: var(--lq-on-accent);
}
.lq-volume {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 8px;
}
.lq-volume input {
  flex: 1;
  min-height: 44px;
  accent-color: var(--lq-accent);
}
.lq-volume-num {
  width: 3ch;
  text-align: right;
  font-size: 13px;
  color: var(--lq-muted);
}
.lq-now-playing {
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  font-size: 14px;
}
</style>
