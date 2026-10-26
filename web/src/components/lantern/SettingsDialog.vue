<script setup lang="ts">
import { computed } from 'vue'
import {
  useSettingsStore,
  type StartMode,
  type ThemeSetting,
} from '@/stores/useSettingsStore'
import { useMediaQuery } from '@/composables/useMediaQuery'
import type { LanternTextSize } from '@/lantern/tokens'
import LanternDialog from './LanternDialog.vue'

/**
 * The player's settings, saved in this browser: theme and text size, music,
 * sound effects and narration (on/off and volume), how the actions start, and reduce
 * motion (which follows the device until it is changed here).
 *
 * `musicInfo` is the credit of the music actually playing (a take chosen in
 * Audio Studio has its own), as the layout's music player holds it.
 */
const props = withDefaults(defineProps<{ musicInfo?: string }>(), {
  musicInfo: '',
})
const emit = defineEmits<{ close: [] }>()
const settings = useSettingsStore()
const deviceReducesMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const THEMES: Array<{ value: ThemeSetting; label: string }> = [
  { value: 'device', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]
const SIZES: Array<{ value: LanternTextSize; label: string; px: number }> = [
  { value: 'small', label: 'Small text', px: 13 },
  { value: 'medium', label: 'Medium text', px: 17 },
  { value: 'large', label: 'Large text', px: 21 },
]
const STARTS: Array<{ value: StartMode; label: string }> = [
  { value: 'actions', label: 'Actions' },
  { value: 'type', label: 'Type' },
]

const motionReduced = computed(() =>
  settings.reduceMotion === 'device'
    ? deviceReducesMotion.value
    : settings.reduceMotion === 'on',
)
function toggleMotion(): void {
  settings.reduceMotion = motionReduced.value ? 'off' : 'on'
}

/** The first line of the track's credits ("Market by Conquest"). */
const nowPlaying = computed(() => props.musicInfo.split('\n')[0]?.trim() ?? '')

function volume(event: Event): number {
  return Number((event.target as HTMLInputElement).value)
}
</script>

<template>
  <LanternDialog title="Settings" eyebrow="Game" @close="emit('close')">
    <section class="lq-group" aria-labelledby="lq-set-look">
      <h3 id="lq-set-look" class="lq-group-title">Appearance</h3>
      <div class="lq-row">
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
            @click="settings.theme = t.value"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
      <div class="lq-row">
        <span class="lq-row-text"
          ><span class="lq-row-label">Text size</span
          ><span class="lq-note">Story text only</span></span
        >
        <div class="lq-seg" role="group" aria-label="Text size">
          <button
            v-for="s in SIZES"
            :key="s.value"
            type="button"
            class="lq-seg-btn"
            :aria-label="s.label"
            :aria-pressed="settings.textSize === s.value ? 'true' : 'false'"
            :style="{ fontSize: `${s.px}px` }"
            @click="settings.textSize = s.value"
          >
            A
          </button>
        </div>
      </div>
      <p class="lq-sample">
        The great boughs creak overhead as silver leaves drift down around you.
      </p>
    </section>

    <section class="lq-group" aria-labelledby="lq-set-sound">
      <h3 id="lq-set-sound" class="lq-group-title">Sound</h3>
      <div class="lq-row">
        <span class="lq-row-text"
          ><span class="lq-row-label">Music</span
          ><span class="lq-note">A different track for each act</span></span
        >
        <button
          type="button"
          role="switch"
          class="lq-switch"
          aria-label="Music"
          :aria-checked="settings.musicOn ? 'true' : 'false'"
          @click="settings.musicOn = !settings.musicOn"
        >
          <span class="lq-knob"></span>
        </button>
      </div>
      <label v-if="settings.musicOn" class="lq-volume">
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
        <button
          type="button"
          role="switch"
          class="lq-switch"
          aria-label="Sound effects"
          :aria-checked="settings.effectsOn ? 'true' : 'false'"
          @click="settings.effectsOn = !settings.effectsOn"
        >
          <span class="lq-knob"></span>
        </button>
      </div>
      <label v-if="settings.effectsOn" class="lq-volume">
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
        <button
          type="button"
          role="switch"
          class="lq-switch"
          aria-label="Narration"
          :aria-checked="settings.narrationOn ? 'true' : 'false'"
          @click="settings.narrationOn = !settings.narrationOn"
        >
          <span class="lq-knob"></span>
        </button>
      </div>
      <label v-if="settings.narrationOn" class="lq-volume">
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
      <div class="lq-row">
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
            @click="settings.startMode = s.value"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
      <div class="lq-row">
        <span class="lq-row-text"
          ><span class="lq-row-label">Reduce motion</span
          ><span class="lq-note"
            >No shake or slide-in<template
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
          @click="toggleMotion"
        >
          <span class="lq-knob"></span>
        </button>
      </div>
    </section>
  </LanternDialog>
</template>

<style scoped>
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
