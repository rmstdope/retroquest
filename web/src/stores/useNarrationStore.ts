import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useSettingsStore } from './useSettingsStore'
import {
  narrationWords,
  wordAt,
  type NarrationManifest,
} from '@/lantern/narrationManifest'
import type { NarrationUnit } from '@/lantern/narrationUnits'

/**
 * Playback of a narrated turn in the story view.
 *
 * A turn is a list of units (`turnUnits`), each made of voiced parts. The
 * story shows a unit when its first part starts, plays the parts' recordings
 * one after another and reports the word being spoken, so the view can mark
 * the unit and light the word. Units without a recording pass at once. A
 * short pause follows each spoken part (a shorter one after a hurry).
 *
 * - `hurry` completes the block being spoken and cuts its voice; the next one
 *   plays. `skipAll` shows the rest of the turn at once, silently. `tap` is
 *   both: a second tap within 300 ms skips. A new turn (`begin`) cuts in on
 *   the one being narrated.
 * - A voice that fails, is blocked, or has not ended `duration + 3 s` after it
 *   started completes its block, so a turn never stalls.
 * - Nothing here is saved; a turn that is not the active one shows whole.
 */

/** Pause after a spoken part, in milliseconds. */
const GAP_MS = 350
/** The shorter pause after a hurried block. */
const HURRIED_GAP_MS = 80
/** Two taps this close are a double-tap. */
const DOUBLE_TAP_MS = 300
/** How long past a clip's length a voice may take before it counts as stuck. */
const STALL_MARGIN_MS = 3000
/** How often the spoken word is looked up. */
const WORD_POLL_MS = 50
/** Where the recordings are served from. */
const NARRATION_PATH = '/audio/narration/'

/** The audio element playing one recording. */
export interface NarrationAudio {
  play(): Promise<void>
  pause(): void
  /** 0–1 */
  volume: number
  /** Seconds into the clip. */
  currentTime: number
  /** Called when the clip has played to its end. */
  onended: ((...args: never[]) => void) | null
  /** Called when the clip cannot be played. */
  onerror: ((...args: never[]) => void) | null
}

/** Makes the audio element for a recording's URL. */
export type NarrationAudioFactory = (src: string) => NarrationAudio

const defaultAudioFactory: NarrationAudioFactory = (src) => new Audio(src)

/** The turn being narrated and where it has got to. */
interface ActiveNarration {
  turnId: number
  units: NarrationUnit[]
  folder: string
  /** How many units are shown (from the first). */
  revealed: number
  /** The unit and part being spoken, or next to be. */
  unit: number
  part: number
  /** Whether a voice is playing now. */
  speaking: boolean
  /** The index of the spoken word, -1 before the first. */
  word: number
}

/** What is being spoken now in a turn. */
export interface Speaking {
  unit: number
  part: number
  /** The index of the word being spoken within the part, -1 before the first. */
  word: number
  /** The words of the unit's earlier parts: `offset + word` is the word's place in the unit. */
  offset: number
  /** The number of words in the whole unit. */
  total: number
  /** Whether each recording's word timings match the words shown (otherwise no word can be lit). */
  aligned: boolean
}

/** Playback state and control for the story's narration. */
export const useNarrationStore = defineStore('narration', () => {
  const settings = useSettingsStore()
  const active = ref<ActiveNarration | null>(null)
  const manifests = ref<Record<string, NarrationManifest>>({})
  const loading: Record<string, Promise<void>> = {}
  let audioFactory = defaultAudioFactory
  let audio: NarrationAudio | null = null
  let generation = 0
  let timers: ReturnType<typeof setTimeout>[] = []
  let poll: ReturnType<typeof setInterval> | undefined
  let lastTap = Number.NEGATIVE_INFINITY

  /** True while a turn is being narrated. */
  const isNarrating = computed(() => active.value !== null)

  /** Replace the audio element maker (tests). */
  function setAudioFactory(factory: NarrationAudioFactory): void {
    audioFactory = factory
  }

  /** Whether unit `unit` of turn `turnId` is shown: every unit of a turn that is not being narrated is. */
  function revealed(turnId: number, unit: number): boolean {
    const now = active.value
    return !now || now.turnId !== turnId || unit < now.revealed
  }

  /** What is being spoken in turn `turnId`, or null. */
  function speaking(turnId: number): Speaking | null {
    const now = active.value
    if (!now || now.turnId !== turnId || !now.speaking) return null
    const lengths = now.units[now.unit].parts.map(
      (part) => narrationWords(part.markup).length,
    )
    return {
      unit: now.unit,
      part: now.part,
      word: now.word,
      offset: lengths.slice(0, now.part).reduce((sum, n) => sum + n, 0),
      total: lengths.reduce((sum, n) => sum + n, 0),
      aligned: now.units[now.unit].parts.every(
        (part, i) => !part.clip || part.clip.words.length === lengths[i],
      ),
    }
  }

  /** Whether turn `turnId` is the one being narrated (its units appear as they are spoken). */
  function narrates(turnId: number): boolean {
    return active.value?.turnId === turnId
  }

  /** The act's recordings once loaded (`{}` when it has none), else null. */
  function manifestFor(folder: string): NarrationManifest | null {
    return manifests.value[folder] ?? null
  }

  /** Load an act's manifest, once; a missing or unreadable one means no recordings. */
  function preload(folder: string): Promise<void> {
    loading[folder] ??= (async () => {
      let manifest: NarrationManifest = {}
      try {
        const response = await fetch(`${NARRATION_PATH}${folder}/manifest.json`)
        if (response.ok) manifest = (await response.json()) as NarrationManifest
      } catch {
        // No recordings: the act is read silently.
      }
      manifests.value[folder] = manifest
    })()
    return loading[folder]
  }

  /** Forget the pending pause, stall guard and word lookup, and stop the voice. */
  function stopVoice(): void {
    generation++
    timers.forEach(clearTimeout)
    timers = []
    clearInterval(poll)
    poll = undefined
    if (audio) {
      audio.onended = null
      audio.onerror = null
      audio.pause()
      audio = null
    }
    if (active.value) {
      active.value.speaking = false
      active.value.word = -1
    }
  }

  /** The turn is over: everything shows. */
  function finish(): void {
    stopVoice()
    active.value = null
  }

  /** Whether a voiced part is left after the one at (unit, part), counting that part as done. */
  function voicedAfter(
    now: ActiveNarration,
    unit: number,
    part: number,
  ): boolean {
    return now.units.some((candidate, u) =>
      candidate.parts.some(
        (p, i) => !!p.clip && (u > unit || (u === unit && i > part)),
      ),
    )
  }

  /**
   * Show units from the current position and start the next voiced part;
   * units with no voice appear at once. Ends the turn when nothing is left.
   */
  function step(): void {
    const now = active.value
    if (!now) return
    for (;;) {
      if (now.unit >= now.units.length) return finish()
      const unit = now.units[now.unit]
      if (now.part === 0) now.revealed = now.unit + 1
      const index = unit.parts.findIndex((p, i) => i >= now.part && !!p.clip)
      if (index < 0) {
        now.unit++
        now.part = 0
        continue
      }
      now.part = index
      return play(now)
    }
  }

  /** Play the current part's recording with its guards. */
  function play(now: ActiveNarration): void {
    const clip = now.units[now.unit].parts[now.part].clip
    if (!clip) return step()
    const mine = ++generation
    now.speaking = true
    now.word = -1
    const element = audioFactory(`${NARRATION_PATH}${now.folder}/${clip.file}`)
    element.volume = settings.narrationVolume / 100
    audio = element
    const end = (): void => {
      if (mine === generation) completePart(false)
    }
    element.onended = end
    element.onerror = end
    timers.push(setTimeout(end, clip.duration * 1000 + STALL_MARGIN_MS))
    poll = setInterval(() => {
      if (mine === generation) now.word = wordAt(clip, element.currentTime)
    }, WORD_POLL_MS)
    element.play().catch(end)
  }

  /**
   * The current part is over (spoken, failed, or hurried). A hurried block gives
   * up its other parts too. The next one follows after a pause.
   */
  function completePart(hurried: boolean): void {
    const now = active.value
    if (!now) return
    const { unit, part } = now
    stopVoice()
    if (hurried) {
      now.unit++
      now.part = 0
    } else now.part++
    const more = hurried
      ? voicedAfter(now, unit, Number.POSITIVE_INFINITY)
      : voicedAfter(now, unit, part)
    if (!more) return finish()
    const mine = generation
    timers.push(
      setTimeout(
        () => {
          if (mine === generation) step()
        },
        hurried ? HURRIED_GAP_MS : GAP_MS,
      ),
    )
  }

  /**
   * Narrate a turn: cut in on any turn being narrated, then show its units as
   * they are spoken. A turn with no voiced unit, or narration switched off,
   * stays as it is.
   */
  function begin(turnId: number, units: NarrationUnit[], folder: string): void {
    if (active.value) finish()
    const voiced = units.some((unit) => unit.parts.some((part) => part.clip))
    if (!settings.narrationOn || !voiced) return
    active.value = {
      turnId,
      units,
      folder,
      revealed: 0,
      unit: 0,
      part: 0,
      speaking: false,
      word: -1,
    }
    step()
  }

  /** Complete the block being spoken (or, in a pause, bring the next one now). */
  function hurry(): void {
    const now = active.value
    if (!now) return
    if (now.speaking) completePart(true)
    else {
      stopVoice()
      step()
    }
  }

  /** Show the rest of the turn at once, silently. */
  function skipAll(): void {
    finish()
  }

  /** A tap on the story: hurry, or skip on a second tap within 300 ms. */
  function tap(): void {
    if (!active.value) return
    const now = Date.now()
    const double = now - lastTap < DOUBLE_TAP_MS
    lastTap = now
    if (double) skipAll()
    else hurry()
  }

  return {
    isNarrating,
    setAudioFactory,
    revealed,
    narrates,
    speaking,
    manifestFor,
    preload,
    begin,
    hurry,
    skipAll,
    tap,
  }
})
