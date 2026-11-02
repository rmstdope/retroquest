import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** One half of a change of scene (the old picture out, or the new one in), in ms. */
export const SCENE_HALF_MS = 1000

/** Where a change of scene is: not changing, fading out, dark and waiting for the picture, or rising. */
export type ScenePhase = 'idle' | 'out' | 'dark' | 'in'

/**
 * The change of scene when the player moves to a room with another picture:
 * the old picture fades to the dark stage (`SCENE_HALF_MS`), the new one
 * rises out of it (`SCENE_HALF_MS`), and the words of the move wait until it
 * is fully up (`holds`). The stage picture draws the phases; this keeps the
 * clock and runs `onUp` once when the picture is up, by time or by `skip`.
 * A picture slow to load keeps the stage dark for at most one more
 * `SCENE_HALF_MS`; after that, or when it is missing, the paper backdrop
 * ('') rises instead. Nothing here is saved.
 */
export const useSceneStore = defineStore('scene', () => {
  /** The picture settled on the stage ('' is the paper backdrop); null before the first one after a reset. */
  const shown = ref<string | null>(null)
  const phase = ref<ScenePhase>('idle')
  /** The picture rising (or about to), '' for the backdrop. */
  const target = ref('')
  const turn = ref<number | null>(null)
  /** Whether the target has loaded (true), is missing (false), or is not known yet (null). */
  const ready = ref<boolean | null>(null)
  /** The turn whose change has just reached its darkest moment (the room's name changes), until it is up. */
  const darkTurn = computed(() =>
    phase.value === 'in' || phase.value === 'dark' ? turn.value : null,
  )
  let timer: ReturnType<typeof setTimeout> | undefined
  let onUp: (() => void) | null = null

  /** Forget the pending step. */
  function stopTimer(): void {
    clearTimeout(timer)
    timer = undefined
  }

  /** The picture is up with no change of scene (the first one, a load, or the same again). */
  function settled(src: string): void {
    if (phase.value === 'idle') shown.value = src
  }

  /** Whether the words of turn `id` wait for the picture. */
  function holds(id: number): boolean {
    return turn.value === id
  }

  /** Start the change for turn `id` towards `src` ('' for the backdrop); `up` runs once it is fully up. */
  function begin(id: number, src: string, up: () => void): void {
    skip()
    turn.value = id
    target.value = src
    ready.value = src ? null : true
    onUp = up
    phase.value = 'out'
    timer = setTimeout(arrive, SCENE_HALF_MS)
  }

  /** The old picture is gone: rise at once if the new one is ready, else wait for it (a little). */
  function arrive(): void {
    if (ready.value === null) {
      phase.value = 'dark'
      timer = setTimeout(() => targetReady(false), SCENE_HALF_MS)
    } else rise()
  }

  /** The new picture rises out of the dark. */
  function rise(): void {
    if (!ready.value) target.value = ''
    phase.value = 'in'
    stopTimer()
    timer = setTimeout(finish, SCENE_HALF_MS)
  }

  /** The target picture has loaded (true) or cannot be (false). */
  function targetReady(ok: boolean): void {
    if (turn.value === null || ready.value !== null) return
    ready.value = ok
    // Still fading out: the rise waits for the dark. In the dark: now.
    if (phase.value === 'dark') rise()
  }

  /** The picture is up: the words may come. */
  function finish(): void {
    stopTimer()
    const up = onUp
    onUp = null
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

  /** Forget the picture and any change (a new game, a load, a new act); the words are not run. */
  function reset(): void {
    stopTimer()
    onUp = null
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
    darkTurn,
    settled,
    holds,
    begin,
    targetReady,
    skip,
    reset,
  }
})
