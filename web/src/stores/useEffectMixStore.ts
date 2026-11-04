import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  EFFECT_VOLUMES_URL,
  SAVED_EFFECT_VOLUMES,
  volumeOf as savedVolumeOf,
  withVolume,
  type EffectVolumes,
} from '@/lantern/effectVolumes'

/** How long the volumes rest before they are saved, in ms. */
export const SAVE_DELAY_MS = 500

/** Whether the volumes set are saved, being saved, or could not be saved. */
export type MixSaveState = 'saved' | 'saving' | 'failed'

/** One effect of one room. */
export interface RoomEffect {
  track: string
  id: string
}

/** A request to play a one-shot now: `n` grows with each, so the same effect can be asked again. */
export type PlayRequest = RoomEffect & { n: number }

/**
 * The room effect levels: the volume each room gives its effects, starting
 * at the saved `effectVolumes.json`. The dev build's room effects panel
 * changes them; the music (`useActMusic`) plays by them at once, and in the
 * dev build each change is saved to the file once the slider rests, so the
 * next run starts there. The panel also asks for a one-shot to play now and
 * solos one effect.
 */
export const useEffectMixStore = defineStore('effectMix', () => {
  const volumes = ref<EffectVolumes>(SAVED_EFFECT_VOLUMES)
  const saveState = ref<MixSaveState>('saved')
  const request = ref<PlayRequest | null>(null)
  const soloed = ref<RoomEffect | null>(null)
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  /** Counts the changes, so only a save of the latest one says it is saved. */
  let changes = 0
  /** The saves one after another, so an older one never lands after a newer. */
  let saving: Promise<void> = Promise.resolve()

  /** The volume of effect `id` in `track`'s room: as set, else 1. */
  function volumeOf(track: string, id: string): number {
    return savedVolumeOf(volumes.value, track, id)
  }

  /** Sets the volume of effect `id` in `track`'s room; the dev build saves it once it rests. */
  function setVolume(track: string, id: string, volume: number): void {
    volumes.value = withVolume(volumes.value, track, id, volume)
    if (!import.meta.env.DEV) return
    changes++
    saveState.value = 'saving'
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saving = saving.then(save)
    }, SAVE_DELAY_MS)
  }

  /**
   * Writes the volumes to the file through the dev server. Only a save of the
   * latest change sets the state: with a newer change waiting, it stays saving.
   */
  async function save(): Promise<void> {
    const saved = changes
    let state: MixSaveState
    try {
      const response = await fetch(EFFECT_VOLUMES_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(volumes.value),
      })
      state = response.ok ? 'saved' : 'failed'
    } catch {
      state = 'failed'
    }
    if (saved === changes) saveState.value = state
  }

  /** Asks for the one-shot effect `id` of `track`'s room to play now. */
  function playNow(track: string, id: string): void {
    request.value = { track, id, n: (request.value?.n ?? 0) + 1 }
  }

  /** Solos effect `id` of `track`'s room, or lets it go when it is the one soloed. */
  function toggleSolo(track: string, id: string): void {
    const same = soloed.value?.track === track && soloed.value.id === id
    soloed.value = same ? null : { track, id }
  }

  /** Lets go of any solo, so every effect is heard again. */
  function clearSolo(): void {
    soloed.value = null
  }

  return {
    volumes,
    saveState,
    request,
    soloed,
    volumeOf,
    setVolume,
    playNow,
    toggleSolo,
    clearSolo,
  }
})
