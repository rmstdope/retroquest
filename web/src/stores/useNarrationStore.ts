import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from './useSettingsStore'
import { useSceneStore } from './useSceneStore'
import {
  narrationWords,
  wordAt,
  type NarrationManifest,
} from '@/lantern/narrationManifest'
import type { NarrationUnit } from '@/lantern/narrationUnits'
import { readingPauseMs } from '@/lantern/stageSpeech'

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
 *   plays. `skipTo` does so up to a given unit, `seekToWord` to a word of it. `skipAll` shows the rest of
 *   the turn at once, silently. `tap` is both: a second tap within 300 ms skips. A new turn (`begin`) cuts in on
 *   the one being narrated.
 * - A voice that fails, is blocked, or has not ended `duration + 3 s` after it
 *   started completes its block, so a turn never stalls.
 * - `hintVisible` is true during a game's first three narrated turns, and for
 *   two seconds after each `nudgeHint` (a scroll attempt on the held story).
 * - `storyReading` is true while a story turn (not the chapter page or a
 *   pop-up) is narrated: the story is then held still and follows the word.
 * - A talk that moves Elior can stop before the unit where its scene changes
 *   (`begin`'s `sceneAt`): `atSceneChange` says it is there, and
 *   `passSceneChange` lets it go on once the new picture is up.
 * - Words of the turn that a hurry or a skip shows unspoken are owed their
 *   reading time (`readingPauseMs` per paragraph): news after them (a spell
 *   or quest unit) waits until it has passed, and `owedReadingMs` tells the
 *   news of a skipped turn how long to wait, so a card never covers lines the
 *   player has not seen.
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
/** Extra time allowed for a clip to start (it is fetched when played) before the guard counts its length. */
const LOAD_MARGIN_MS = 10000
/** How often the spoken word is looked up. */
const WORD_POLL_MS = 50
/** The hint about hurrying and skipping shows during this many narrated turns of a game. */
const HINT_TURNS = 3
/** How long a scroll attempt keeps the hint up. */
const NUDGE_MS = 2000
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
  /** The pause just waited before the next part, in ms (0 at the turn's start). */
  waited: number
  /** The unit whose own pause (`pauseBefore`) has been waited, or -1. */
  pausedFor: number
  /** The unit the narrator stops before, for the scene to change, or -1. */
  sceneAt: number
  /** Whether the narrator has stopped there. */
  atScene: boolean
  /** Until when (`Date.now()`) the words a hurry showed unspoken are read: news waits for it. */
  owedUntil: number
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
  /** The number of words in each of the unit's parts. */
  lengths: number[]
  /** Whether each recording's word timings match the words shown (otherwise no word can be lit). */
  aligned: boolean
}

/** Playback state and control for the story's narration. */
export const useNarrationStore = defineStore('narration', () => {
  const settings = useSettingsStore()
  const scene = useSceneStore()
  const active = ref<ActiveNarration | null>(null)
  const manifests = ref<Record<string, NarrationManifest>>({})
  const loading: Record<string, Promise<void>> = {}
  let audioFactory = defaultAudioFactory
  let audio: NarrationAudio | null = null
  let generation = 0
  let timers: ReturnType<typeof setTimeout>[] = []
  let poll: ReturnType<typeof setInterval> | undefined
  let lastTap = Number.NEGATIVE_INFINITY
  let nudgeTimer: ReturnType<typeof setTimeout> | undefined

  /** How the latest narrated turn ended. */
  const lastEnd = ref<{
    turnId: number
    skipped: boolean
    /** Until when the words the skip showed unspoken are read. */
    owedUntil: number
  } | null>(null)

  /** How many turns have begun narrating in this game. */
  const narratedTurns = ref(0)

  // A volume change reaches the voice that is playing.
  watch(
    () => settings.narrationVolume,
    (volume) => {
      if (audio) audio.volume = volume / 100
    },
  )

  /** True while a turn is being narrated. */
  const isNarrating = computed(() => active.value !== null)

  /** True while a story turn is narrated (the chapter page and pop-ups have negative ids). */
  const storyReading = computed(
    () => active.value !== null && active.value.turnId >= 1,
  )

  /** Whether a recent scroll attempt keeps the hint up. */
  const hintNudged = ref(false)

  /**
   * Whether the hurry/skip hint shows: while one of a game's first three
   * narrated turns is being narrated and narration is on, or while a scroll
   * attempt on a narrated turn (any turn) keeps it up.
   */
  const hintVisible = computed(
    () =>
      active.value !== null &&
      settings.narrationOn &&
      (narratedTurns.value <= HINT_TURNS || hintNudged.value),
  )

  /** Put the hint up for two seconds; each call restarts them. Does nothing when no turn is narrated. */
  function nudgeHint(): void {
    if (!active.value) return
    hintNudged.value = true
    clearTimeout(nudgeTimer)
    nudgeTimer = setTimeout(() => {
      hintNudged.value = false
    }, NUDGE_MS)
  }

  /** A new game starts counting narrated turns again. */
  function resetGame(): void {
    narratedTurns.value = 0
  }

  /** Replace the audio element maker (tests). */
  function setAudioFactory(factory: NarrationAudioFactory): void {
    audioFactory = factory
  }

  /**
   * Whether unit `unit` of turn `turnId` is shown: every unit of a turn that is
   * not being narrated is, except while the picture of its move is still
   * changing (`useSceneStore`), when none that waits for it is.
   */
  function revealed(turnId: number, unit: number): boolean {
    if (scene.holds(turnId, unit)) return false
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
      lengths,
      aligned: now.units[now.unit].parts.every(
        (part, i) => !part.clip || part.clip.words.length === lengths[i],
      ),
    }
  }

  /**
   * How long (ms) the words of turn `turnId` that a hurry or skip showed
   * unspoken still need to be read: what its news waits for. 0 when nothing
   * is owed.
   */
  function owedReadingMs(turnId: number): number {
    const now = active.value
    const until =
      now?.turnId === turnId
        ? now.owedUntil
        : lastEnd.value?.turnId === turnId
          ? lastEnd.value.owedUntil
          : 0
    return Math.max(0, until - Date.now())
  }

  /** Whether turn `turnId` was the latest to end, and was cut short (skipped, cut in on) rather than read. */
  function endedBySkip(turnId: number): boolean {
    return lastEnd.value?.turnId === turnId && lastEnd.value.skipped
  }

  /** Whether the latest narrated turn was read to its end (not skipped or cut in on). */
  const readToEnd = computed(
    () => lastEnd.value !== null && !lastEnd.value.skipped,
  )

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

  /** Whether a unit is news told after the turn's words (a learned spell, a quest). */
  function isNews(unit: NarrationUnit): boolean {
    return unit.kind === 'spell' || unit.kind === 'quest'
  }

  /** The reading time of the words of the turn (its blocks) not yet spoken from the voice in hand on; `all` counts the units not yet shown too. */
  function unspokenMs(now: ActiveNarration, all: boolean): number {
    let ms = 0
    const read = (markup: string): void => {
      if (narrationWords(markup).length) ms += readingPauseMs(markup)
    }
    const unit = now.units[now.unit]
    // The block in hand: from the word being spoken on, or, between two of its
    // recordings, its parts still to come.
    if (unit?.kind === 'block' && now.unit < now.revealed)
      unit.parts.slice(now.part).forEach((part, i) => {
        const words = narrationWords(part.markup)
        read(
          i === 0 && now.speaking
            ? words.slice(now.word + 1).join(' ')
            : part.markup,
        )
      })
    if (all)
      now.units.forEach((each, u) => {
        if (u < now.revealed || each.kind !== 'block') return
        each.parts.forEach((part) => read(part.markup))
        if (each.silent) read(each.silent)
      })
    return ms
  }

  /** The turn is over: everything shows. `skipped` says it was cut short, not read. */
  function finish(skipped = false): void {
    const now = active.value
    const owedUntil = now
      ? Math.max(
          now.owedUntil,
          Date.now() + (skipped ? unspokenMs(now, true) : 0),
        )
      : 0
    stopVoice()
    if (now) lastEnd.value = { turnId: now.turnId, skipped, owedUntil }
    active.value = null
    clearTimeout(nudgeTimer)
    hintNudged.value = false
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
    // A hurry or tap while the picture of the move changes does not start the voice.
    if (!now || scene.holds(now.turnId, now.unit)) return
    for (;;) {
      if (now.unit >= now.units.length) return finish()
      // The scene changes here: the narrator waits until it is let through.
      if (now.sceneAt >= 0 && now.unit >= now.sceneAt) {
        now.atScene = true
        return
      }
      const unit = now.units[now.unit]
      const index = unit.parts.findIndex((p, i) => i >= now.part && !!p.clip)
      // A unit that asks for a longer breath (a room, a chapter's text after
      // its heading) is shown and read once it has passed.
      const pause = unit.pauseBefore ?? 0
      // News waits, too, for words a hurry showed unspoken to be read.
      const owed = isNews(unit) ? Math.max(0, now.owedUntil - Date.now()) : 0
      const wait = Math.max(index >= 0 ? pause - now.waited : 0, owed)
      if (now.pausedFor !== now.unit && wait > 0) {
        now.pausedFor = now.unit
        const mine = generation
        timers.push(
          setTimeout(() => {
            if (mine === generation) step()
          }, wait),
        )
        return
      }
      if (now.part === 0) now.revealed = now.unit + 1
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
    const guard = (extra: number): void => {
      timers.forEach(clearTimeout)
      timers = [setTimeout(end, clip.duration * 1000 + STALL_MARGIN_MS + extra)]
    }
    // The clip is fetched when played: count its length from when sound can
    // start, with a longer allowance for a play that never settles.
    guard(LOAD_MARGIN_MS)
    poll = setInterval(() => {
      if (mine === generation) now.word = wordAt(clip, element.currentTime)
    }, WORD_POLL_MS)
    element.play().then(() => {
      if (mine === generation) guard(0)
    }, end)
  }

  /**
   * The current part is over (spoken, failed, or hurried). A hurried block gives
   * up its other parts too. The next one follows after a pause.
   */
  function completePart(hurried: boolean): void {
    const now = active.value
    if (!now) return
    const { unit, part } = now
    // The hurried block's words not yet spoken are shown now: they are owed their reading.
    if (hurried)
      now.owedUntil = Math.max(
        now.owedUntil,
        Date.now() + unspokenMs(now, false),
      )
    stopVoice()
    if (hurried) {
      now.unit++
      now.part = 0
    } else now.part++
    const more = hurried
      ? voicedAfter(now, unit, Number.POSITIVE_INFINITY)
      : voicedAfter(now, unit, part)
    // With nothing voiced left the turn ends, unless its scene is still to change.
    if (!more && now.sceneAt < 0) return finish()
    const mine = generation
    const gap = hurried ? HURRIED_GAP_MS : GAP_MS
    now.waited = gap
    timers.push(
      setTimeout(() => {
        if (mine === generation) step()
      }, gap),
    )
  }

  /**
   * Narrate a turn: cut in on any turn being narrated, then show its units as
   * they are spoken. A turn with no voiced unit, or narration switched off,
   * stays as it is. `held` keeps it from speaking until `start` (the
   * picture of the move is still changing). `sceneAt` (a talk that moves
   * Elior) is the unit it stops before until `passSceneChange`.
   */
  function begin(
    turnId: number,
    units: NarrationUnit[],
    folder: string,
    held = false,
    sceneAt = -1,
  ): void {
    if (active.value) finish(true)
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
      waited: 0,
      pausedFor: -1,
      sceneAt,
      atScene: false,
      owedUntil: 0,
    }
    // The chapter page and pop-ups (negative ids) are not story turns.
    if (turnId >= 1) narratedTurns.value++
    if (!held) step()
  }

  /** Begin speaking a turn started `held`; does nothing if it was cut in on meanwhile. */
  function start(turnId: number): void {
    const now = active.value
    if (now?.turnId === turnId && !now.speaking && now.unit === 0) step()
  }

  /** Whether the narration of turn `turnId` has stopped where its scene changes. */
  function atSceneChange(turnId: number): boolean {
    const now = active.value
    return now?.turnId === turnId && now.atScene
  }

  /** Let the narration of turn `turnId` go on past where its scene changes (the new picture is up). */
  function passSceneChange(turnId: number): void {
    const now = active.value
    if (now?.turnId !== turnId || now.sceneAt < 0) return
    now.sceneAt = -1
    now.atScene = false
    step()
  }

  /** Complete the block being spoken (or, in a pause, bring the next one now). */
  function hurry(): void {
    const now = active.value
    if (!now) return
    if (now.speaking) completePart(true)
    else {
      // The player has waited enough: no unit's own pause holds it back now.
      now.waited = Infinity
      stopVoice()
      step()
    }
  }

  /**
   * Go on at unit `unit` now: the voice in hand is cut, the units between are
   * passed over and the unit is read without its pause. Nothing voiced from
   * there on ends the turn.
   */
  function skipTo(unit: number): void {
    const now = active.value
    if (!now) return
    stopVoice()
    now.unit = Math.max(now.unit, unit)
    now.part = 0
    now.waited = Infinity
    step()
  }

  /**
   * Go on at word `word` of unit `unit` (counted over all of the unit's
   * parts): the voice in hand is cut, the units between are passed over and
   * the recording that holds the word plays from it. A word in a part with no
   * recording starts at the next voiced part.
   */
  function seekToWord(unit: number, word: number): void {
    const now = active.value
    // The narrator is never taken back to a unit he has passed.
    if (!now || unit >= now.units.length || unit < now.unit) return
    const parts = now.units[unit].parts
    let part = 0
    let offset = 0
    while (part < parts.length - 1) {
      const length = narrationWords(parts[part].markup).length
      if (word < offset + length) break
      offset += length
      part++
    }
    const clip = parts[part]?.clip
    // The voice already on that part only moves; anything else starts afresh.
    const here = now.speaking && now.unit === unit && now.part === part
    if (!here) {
      stopVoice()
      now.unit = Math.max(now.unit, unit)
      now.part = part
      now.waited = Infinity
      step()
    }
    if (!clip || !audio || !now.speaking || now.unit !== unit) return
    const target = clip.words[Math.min(word - offset, clip.words.length - 1)]
    if (!target) return
    audio.currentTime = target.start
    now.word = wordAt(clip, target.start)
  }

  /** Show the rest of the turn at once, silently. */
  function skipAll(): void {
    finish(true)
  }

  /** A tap on the story, the picture's speech or a chapter page: hurry, or skip on a second tap within 300 ms. */
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
    narratedTurns,
    hintVisible,
    storyReading,
    nudgeHint,
    resetGame,
    setAudioFactory,
    revealed,
    narrates,
    endedBySkip,
    owedReadingMs,
    readToEnd,
    speaking,
    manifestFor,
    preload,
    begin,
    start,
    atSceneChange,
    passSceneChange,
    hurry,
    skipTo,
    seekToWord,
    skipAll,
    tap,
  }
})
