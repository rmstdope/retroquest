<script setup lang="ts">
/**
 * The dev build's room effects panel: one row per sound effect of the room
 * the music plays in, with how it plays, a volume slider (0–300 %, in this
 * room only), a reset to 100 %, and Play now for a one-shot or Solo for a
 * loop. Levels play at once (see `useActMusic`) and are saved to
 * `effectVolumes.json` once a slider rests (see `useEffectMixStore`). Docked
 * on the right below the header, over the story, so the layout stays put.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ambienceAt, ROOM_AMBIENCE } from '@/lantern/effectLists'
import { MAX_EFFECT_VOLUME } from '@/lantern/effectVolumes'
import { roomTrackId } from '@/lantern/musicLists'
import { useEffectMixStore } from '@/stores/useEffectMixStore'
import { useGameStore } from '@/stores/useGameStore'

const emit = defineEmits<{ close: [] }>()
const game = useGameStore()
const mix = useEffectMixStore()

/** The file the levels are saved to, as the panel names it. */
const VOLUMES_FILE = 'web/src/lantern/effectVolumes.json'

const track = computed(() =>
  game.musicRoomKey === ''
    ? ''
    : roomTrackId(game.musicActName, game.musicRoomKey),
)

/** One row of the panel. */
interface Row {
  id: string
  mode: string
  loops: boolean
  stateNote: string
  shared: string
  percent: number
  label: string
  db: string
  changed: boolean
  soloed: boolean
}

/** How an effect plays, in words. */
function modeOf(effect: ReturnType<typeof ambienceAt>[number]): string {
  if (effect.loops) return 'Loops round and round'
  if ('afterSeconds' in effect) return 'Once on entering'
  const [shortest, longest] = effect.everySeconds
  return `Now and then · every ${shortest}–${longest} s`
}

/** How many other rooms play effect `id`, in words. */
function sharedOf(id: string): string {
  const others = Object.entries(ROOM_AMBIENCE).filter(
    ([other, effects]) =>
      other !== track.value && effects.some((effect) => effect.id === id),
  ).length
  if (others === 0) return 'Only in this room'
  return `Also in ${others} other ${others === 1 ? 'room' : 'rooms'}`
}

/** A volume as decibels against the clip as made. */
function decibels(volume: number): string {
  if (volume === 0) return '−∞ dB'
  const db = 20 * Math.log10(volume)
  return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`
}

const rows = computed<Row[]>(() =>
  ambienceAt(track.value).map((effect) => {
    const volume = mix.volumeOf(track.value, effect.id)
    const percent = Math.round(volume * 100)
    return {
      id: effect.id,
      mode: modeOf(effect),
      loops: effect.loops,
      stateNote:
        effect.state !== undefined && effect.state !== game.musicSoundState
          ? `Only while ${effect.state}`
          : '',
      shared: sharedOf(effect.id),
      percent,
      label: `${percent}%`,
      db: decibels(volume),
      changed: percent !== 100,
      soloed: mix.soloed?.track === track.value && mix.soloed.id === effect.id,
    }
  }),
)

const status = computed(() => {
  if (mix.saveState === 'saving') return 'Saving…'
  if (mix.saveState === 'failed')
    return 'Could not save — is the dev server running?'
  return 'Saved — kept for the next run'
})

/** Sets effect `id`'s volume from the slider's percent. */
function onSlide(id: string, event: Event): void {
  const input = event.target
  if (input instanceof HTMLInputElement)
    mix.setVolume(track.value, id, Number(input.value) / 100)
}

/** Plays a one-shot now, or solos a loop. */
function onPlay(row: Row): void {
  if (row.loops) mix.toggleSolo(track.value, row.id)
  else mix.playNow(track.value, row.id)
}

/** Where the panel's top sits: just below the header. */
const top = ref(0)
function measure(): void {
  top.value =
    document.querySelector('.lq-header')?.getBoundingClientRect().bottom ?? 0
}
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <aside
    class="lq-fx-panel"
    aria-label="Room effects"
    :style="{ top: `${top}px` }"
  >
    <div class="lq-fx-head">
      <div class="lq-fx-title">
        <span class="lq-fx-kicker">Room effects</span>
        <span class="lq-fx-room">{{ game.roomName || 'No room' }}</span>
        <span class="lq-fx-mono"
          >{{ track || 'no track' }} · state:
          {{ game.musicSoundState || 'none' }}</span
        >
      </div>
      <button
        type="button"
        class="lq-fx-icon"
        aria-label="Close room effects"
        @click="emit('close')"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
    </div>

    <div class="lq-fx-rows">
      <p v-if="rows.length === 0" class="lq-fx-empty">
        No effects in this room.
      </p>
      <div v-for="row in rows" :key="row.id" class="lq-fx-row">
        <div class="lq-fx-line">
          <div class="lq-fx-name">
            <span class="lq-fx-mono lq-fx-id">{{ row.id }}</span>
            <span class="lq-fx-note"
              >{{ row.mode
              }}<template v-if="row.stateNote">
                · {{ row.stateNote }}</template
              ></span
            >
          </div>
          <button
            type="button"
            class="lq-fx-play"
            :aria-pressed="row.loops ? row.soloed : undefined"
            @click="onPlay(row)"
          >
            {{ row.loops ? 'Solo' : 'Play now' }}
          </button>
        </div>
        <div class="lq-fx-line">
          <label :for="`fx-${row.id}`" class="lq-fx-note lq-fx-label"
            >Volume</label
          >
          <input
            :id="`fx-${row.id}`"
            type="range"
            min="0"
            :max="MAX_EFFECT_VOLUME * 100"
            step="5"
            :value="row.percent"
            class="lq-fx-slider"
            @input="onSlide(row.id, $event)"
          />
          <span
            class="lq-fx-mono lq-fx-value"
            :class="{ changed: row.changed }"
            >{{ row.label }}</span
          >
          <button
            type="button"
            class="lq-fx-icon lq-fx-reset"
            :aria-label="`Reset ${row.id} to 100%`"
            :disabled="!row.changed"
            @click="mix.setVolume(track, row.id, 1)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <polyline points="3,3 3,9 9,9" />
            </svg>
          </button>
        </div>
        <span class="lq-fx-note">{{ row.shared }} · {{ row.db }}</span>
      </div>
    </div>

    <div class="lq-fx-foot">
      <span class="lq-fx-status">
        <span class="lq-fx-dot" :class="mix.saveState" aria-hidden="true" />
        {{ status }}
      </span>
      <span class="lq-fx-mono lq-fx-note">{{ VOLUMES_FILE }}</span>
    </div>
  </aside>
</template>

<style scoped>
.lq-fx-panel {
  position: fixed;
  right: 0;
  bottom: 0;
  z-index: 40;
  width: min(440px, 100vw);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: var(--lq-surface);
  border-left: 1px solid var(--lq-line);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
  overflow-y: auto;
}
.lq-fx-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--lq-line);
}
.lq-fx-title,
.lq-fx-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.lq-fx-kicker {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
.lq-fx-room {
  font-family: var(--lq-font-display);
  font-size: 20px;
}
.lq-fx-mono {
  font-family: var(--lq-font-mono);
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-fx-rows {
  display: flex;
  flex-direction: column;
  padding: 8px 24px;
}
.lq-fx-empty {
  color: var(--lq-muted);
  font-size: 14px;
}
.lq-fx-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 0;
  border-bottom: 1px solid var(--lq-line);
}
.lq-fx-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.lq-fx-id {
  font-size: 14px;
  font-weight: 500;
  color: var(--lq-fg);
}
.lq-fx-note {
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-fx-label {
  width: 46px;
  flex-shrink: 0;
}
.lq-fx-slider {
  flex: 1;
  min-width: 0;
  accent-color: var(--lq-accent);
}
.lq-fx-value {
  width: 52px;
  flex-shrink: 0;
  text-align: right;
  font-size: 14px;
}
.lq-fx-value.changed {
  color: var(--lq-accent-text);
}
.lq-fx-play {
  height: 36px;
  padding: 0 12px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid var(--lq-line2);
  background: var(--lq-raised);
  color: var(--lq-fg);
  font: 13px var(--lq-font-ui);
  cursor: pointer;
}
.lq-fx-play[aria-pressed='true'] {
  background: var(--lq-accent-soft);
  border-color: var(--lq-accent-line);
  color: var(--lq-accent-text);
}
.lq-fx-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--lq-line);
  background: transparent;
  color: var(--lq-muted);
  cursor: pointer;
}
.lq-fx-reset {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}
.lq-fx-reset:disabled {
  opacity: 0.4;
  cursor: default;
}
.lq-fx-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--lq-line);
}
.lq-fx-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.lq-fx-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lq-success);
}
.lq-fx-dot.saving {
  background: var(--lq-accent);
}
.lq-fx-dot.failed {
  background: var(--lq-failure);
}
</style>
