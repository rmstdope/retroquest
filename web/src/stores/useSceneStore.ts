import { defineStore } from 'pinia'
import { computed, onScopeDispose, ref } from 'vue'

/** One half of a change of scene (the old picture out, or the new one in), in ms. */
export const SCENE_HALF_MS = 1000

/** How long the dark waits for an interlude's words to fade out before the new picture rises, in ms. */
export const INTERLUDE_FADE_MS = 1200

/** How long the new picture takes to rise out of a dark that told an interlude, in ms: slower than an ordinary change. */
export const INTERLUDE_RISE_MS = 2600

/** The narrator's paragraph that tells a move, told in the middle of the dark between the two pictures. */
export interface SceneInterlude {
  /** Its unit in the turn. */
  unit: number
  /** Its engine markup. */
  markup: string
}

/** Where a change of scene is: not changing, fading out, dark and waiting for the picture, or rising. */
export type ScenePhase = 'idle' | 'out' | 'dark' | 'in'

/**
 * The change of scene when the player moves to a room with another picture:
 * the old picture fades to the dark stage (`SCENE_HALF_MS`), the new one
 * rises out of it (`SCENE_HALF_MS`), and the words of the move wait until it
 * is fully up (`holds`). A talk that moves Elior changes the scene partway
 * through its answer: only the words from there on wait, and they wait from
 * the moment the talk is told (`wait`) until the change begins. What the talk
 * told before the change is cleared from the screen with the old room
 * (`cut`, `firstUnit`). The stage
 * picture draws the phases; this keeps the clock and runs `onUp` once when
 * the picture is up, by time or by `skip`.
 * A picture slow to load keeps the stage dark for at most one more
 * `SCENE_HALF_MS` (two, when its patches are still loading: `awaitMore`); after that, or when it is missing, the paper backdrop
 * ('') rises instead. A change may carry an interlude (`begin`): the dark
 * then holds, telling it, until `endInterlude` and the fade of its words
 * (`INTERLUDE_FADE_MS`), and the new picture then rises slowly
 * (`INTERLUDE_RISE_MS`); its words are let through
 * while what comes after it still waits. Nothing here is saved.
 */
export const useSceneStore = defineStore('scene', () => {
  /** The picture settled on the stage ('' is the paper backdrop); null before the first one after a reset. */
  const shown = ref<string | null>(null)
  const phase = ref<ScenePhase>('idle')
  /** The picture rising (or about to), '' for the backdrop. */
  const target = ref('')
  const turn = ref<number | null>(null)
  /** The first unit of the turn that waits for the picture (0: the whole turn). */
  const from = ref(0)
  /** The talk whose room changed partway, and its first unit told in the new room. */
  const fresh = ref<{ turn: number; from: number } | null>(null)
  /** A talk whose scene changes partway, told up to its unit `from` before the change begins. */
  const pending = ref<{ turn: number; from: number } | null>(null)
  /** The interlude told in the dark now, and its turn; null when none is. */
  const interlude = ref<(SceneInterlude & { turn: number }) | null>(null)
  /** The interlude the change under way will tell once the old picture is gone. */
  let planned: SceneInterlude | null = null
  /** The told interlude's words fading out in the dark; the picture rises after. */
  let fading: ReturnType<typeof setTimeout> | undefined
  /** How long the rise under way (or the next one) takes, in ms: `INTERLUDE_RISE_MS` after an interlude, else `SCENE_HALF_MS`. */
  const riseMs = ref(SCENE_HALF_MS)
  /** Whether the target has loaded (true), is missing (false), or is not known yet (null). */
  const ready = ref<boolean | null>(null)
  /** The turn whose change has just reached its darkest moment (the room's name changes), until it is up. */
  const darkTurn = computed(() =>
    phase.value === 'in' || phase.value === 'dark' ? turn.value : null,
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  let onUp: (() => void) | null = null
  /** How long the dark waits for the target before giving it up, when something asked for more (`awaitMore`). */
  let extra: number | null = null

  /** Forget the pending step. */
  function stopTimer(): void {
    clearTimeout(timer)
    timer = undefined
  }

  /** The picture is up with no change of scene (the first one, a load, or the same again). */
  function settled(src: string): void {
    if (phase.value === 'idle') shown.value = src
  }

  /**
   * Whether unit `unit` of turn `id` waits for the picture. A change that
   * starts with the turn holds all of it, Elior's own words (unit -1) too.
   */
  function holds(id: number, unit: number): boolean {
    const later = pending.value
    if (later?.turn === id && unit >= later.from) return true
    return turn.value === id && (from.value === 0 || unit >= from.value)
  }

  /** The room changes before unit `from` of talk `id`: what it told before goes from the screen. */
  function cut(id: number, from: number): void {
    fresh.value = { turn: id, from }
  }

  /** The first unit of turn `id` the screen shows: where its room changed, or null when it did not. */
  function firstUnit(id: number): number | null {
    return fresh.value?.turn === id ? fresh.value.from : null
  }

  /** Hold the words of turn `id` from unit `start` on: its scene changes there, later (`begin`). */
  function wait(id: number, start: number): void {
    pending.value = { turn: id, from: start }
  }

  /** Let go of the words held by `wait` (the change begins now, or is not coming). */
  function unwait(): void {
    pending.value = null
  }

  /**
   * Start the change for turn `id` towards `src` ('' for the backdrop); `up`
   * runs once it is fully up. `start` is the turn's first unit that waits for
   * it (a talk that moves Elior is told up to there over the old picture).
   * With an `interlude` (the unit `start`, the paragraph that tells the move)
   * the dark holds once the old picture is gone, telling it, until
   * `endInterlude`.
   */
  function begin(
    id: number,
    src: string,
    up: () => void,
    start = 0,
    told: SceneInterlude | null = null,
  ): void {
    skip()
    planned = told
    riseMs.value = SCENE_HALF_MS
    turn.value = id
    from.value = start
    target.value = src
    ready.value = src ? null : true
    onUp = up
    extra = null
    phase.value = 'out'
    timer = setTimeout(arrive, SCENE_HALF_MS)
  }

  /** The old picture is gone: tell the interlude, or rise at once if the new one is ready, else wait for it (a little). */
  function arrive(): void {
    if (planned && turn.value !== null) {
      phase.value = 'dark'
      interlude.value = { turn: turn.value, ...planned }
      riseMs.value = INTERLUDE_RISE_MS
      // The interlude's own words come now; what is after it waits for the picture.
      from.value = planned.unit + 1
      planned = null
      if (ready.value === null)
        timer = setTimeout(() => targetReady(false), extra ?? SCENE_HALF_MS)
      return
    }
    if (ready.value === null) {
      phase.value = 'dark'
      timer = setTimeout(() => targetReady(false), extra ?? SCENE_HALF_MS)
    } else rise()
  }

  /** The new picture rises out of the dark (`riseMs`). */
  function rise(): void {
    if (!ready.value) target.value = ''
    phase.value = 'in'
    stopTimer()
    timer = setTimeout(finish, riseMs.value)
  }

  /** The target picture has loaded (true) or cannot be (false). */
  function targetReady(ok: boolean): void {
    if (turn.value === null || ready.value !== null) return
    ready.value = ok
    // Still fading out: the rise waits for the dark. In the dark: now, unless an interlude holds it.
    if (phase.value === 'dark' && !interlude.value && !fading) rise()
  }

  /** Forget an interlude's fading words. */
  function stopFading(): void {
    clearTimeout(fading)
    fading = undefined
  }

  /** The interlude is told: its words fade out in the dark, then the new picture rises (once it has loaded, or is given up). */
  function endInterlude(): void {
    if (!interlude.value) return
    interlude.value = null
    fading = setTimeout(() => {
      fading = undefined
      if (ready.value !== null) rise()
    }, INTERLUDE_FADE_MS)
  }

  /**
   * The new picture has loaded but something that belongs with it has not
   * (the patches laid over it): the dark waits `ms` before the picture is
   * given up as missing. Asked while the old picture is still fading out, the
   * time is spent once the dark is reached, never during the fade. Does
   * nothing when no change of scene is under way or the target is settled.
   */
  function awaitMore(ms: number): void {
    if (turn.value === null || ready.value !== null) return
    extra = ms
    if (phase.value !== 'dark') return
    stopTimer()
    timer = setTimeout(() => targetReady(false), ms)
  }

  /** The picture is up: the words may come. */
  function finish(): void {
    stopTimer()
    const up = onUp
    onUp = null
    extra = null
    interlude.value = null
    planned = null
    stopFading()
    shown.value = target.value
    phase.value = 'idle'
    turn.value = null
    up?.()
  }

  /** Bring the new picture up at once (a click, Enter, a command); the words come now. */
  function skip(): void {
    if (turn.value === null) return
    // A picture still loading is kept: the stage shows it as soon as it is there.
    if (ready.value === false) target.value = ''
    finish()
  }

  // The store's own timers end with its scope; no caller has to clear them.
  onScopeDispose(() => {
    stopTimer()
    stopFading()
  })

  /** Forget the picture and any change (a new game, a load, a new act); the words are not run. */
  function reset(): void {
    stopTimer()
    pending.value = null
    fresh.value = null
    onUp = null
    extra = null
    interlude.value = null
    planned = null
    stopFading()
    shown.value = null
    phase.value = 'idle'
    turn.value = null
  }

  return {
    shown,
    phase,
    target,
    turn,
    ready,
    riseMs,
    darkTurn,
    interlude,
    settled,
    holds,
    wait,
    unwait,
    cut,
    firstUnit,
    begin,
    targetReady,
    awaitMore,
    endInterlude,
    skip,
    reset,
  }
})
