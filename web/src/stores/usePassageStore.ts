import { defineStore } from 'pinia'
import { onScopeDispose, ref } from 'vue'
import { typedAs } from '@/engine'

/** One half of the passage into a started or loaded game (the old screen out, or the new one in), in ms. */
export const PASSAGE_HALF_MS = 1500

/** How long the dark waits for the new room's picture before the paper backdrop rises instead, in ms. */
export const PASSAGE_WAIT_MS = 1000

/** Where a passage is: none, fading out, dark and waiting for the picture, or rising. */
export type PassagePhase = 'idle' | 'out' | 'dark' | 'in'

/**
 * What becomes of a typed command: it just runs; it is dropped; the new screen
 * comes up and then it runs; or the new screen comes up holding its `up`, which
 * runs after the command unless the command began a passage of its own.
 */
export type PassageAnswer = 'run' | 'drop' | 'raiseThenRun' | 'runThenRise'

/**
 * What a command typed in `phase` does: the one statement of that rule. With a
 * passage under way a load may begin its own, so it is taken in every phase and
 * holds the risen screen's words until it has run. Any other command is not run
 * in the new game while the old screen fades out, and afterwards brings the new
 * screen up first.
 */
export function passageAnswer(
  phase: PassagePhase,
  line: string,
): PassageAnswer {
  if (phase === 'idle') return 'run'
  if (typedAs(line, 'load') !== null) return 'runThenRise'
  return phase === 'out' ? 'drop' : 'raiseThenRun'
}

/**
 * The passage "through the dark" into a started or loaded game: the whole
 * screen fades out (`PASSAGE_HALF_MS`), `apply` swaps in the new game while it
 * is dark, and the new screen rises (`PASSAGE_HALF_MS`); `up` runs once it is
 * fully up, by time or by `skip`, and is where the words, narrator, notice and
 * focus come. A typed command goes through `typed`, which carries out
 * `passageAnswer`. A picture slow to load keeps the dark for at most
 * `PASSAGE_WAIT_MS` more (`pictureReady` ends the wait). The layout draws the
 * phases as a dark overlay; this keeps the clock. Nothing here is saved.
 */
export const usePassageStore = defineStore('passage', () => {
  const phase = ref<PassagePhase>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined
  let applyNow: (() => void) | null = null
  let upNow: (() => void) | null = null
  /** Whether the new screen waits for a picture that has not reported yet. */
  let awaitingPicture = false

  /** Forget the pending step. */
  function stopTimer(): void {
    clearTimeout(timer)
    timer = undefined
  }

  /** Swap in the new game, once. */
  function runApply(): void {
    const apply = applyNow
    applyNow = null
    apply?.()
  }

  /** The new screen rises out of the dark. */
  function rise(): void {
    stopTimer()
    phase.value = 'in'
    timer = setTimeout(finish, PASSAGE_HALF_MS)
  }

  /** The old screen is gone: swap in the new game, then rise (once its picture is ready, or given up). */
  function arrive(): void {
    runApply()
    if (awaitingPicture) {
      phase.value = 'dark'
      timer = setTimeout(rise, PASSAGE_WAIT_MS)
    } else rise()
  }

  /** The screen is fully up: the words may come. */
  function finish(): void {
    stopTimer()
    runApply()
    const up = upNow
    upNow = null
    phase.value = 'idle'
    up?.()
  }

  /**
   * Start a passage. `apply` runs once in the dark and `up` once when the
   * screen is fully up. With `waitForPicture`, the dark holds after `apply`
   * until `pictureReady` (or `PASSAGE_WAIT_MS`). With `instant` (motion
   * reduced) both run at once. One under way is skipped first.
   */
  function begin(
    apply: () => void,
    up: () => void,
    waitForPicture = false,
    instant = false,
  ): void {
    skip()
    applyNow = apply
    upNow = up
    if (instant) {
      finish()
      return
    }
    awaitingPicture = waitForPicture
    phase.value = 'out'
    timer = setTimeout(arrive, PASSAGE_HALF_MS)
  }

  /** The new room's picture has loaded, or cannot be: the dark may lift now. */
  function pictureReady(): void {
    awaitingPicture = false
    if (phase.value === 'dark') rise()
  }

  /** Bring the new screen up at once (a click, Enter, a command); true when a passage was under way. */
  function skip(): boolean {
    if (phase.value === 'idle') return false
    finish()
    return true
  }

  /**
   * Bring the new screen up at once, then run the command. The passage's `up`
   * comes after the command, unless the command began a passage of its own (a
   * load), whose `up` replaces it, so the old one's words never show over the
   * new dark.
   */
  function runThenRise(run: () => void): void {
    const up = upNow
    upNow = null
    skip()
    run()
    if (phase.value === 'idle') up?.()
  }

  /** A typed command: do with it what `passageAnswer` says for this phase. */
  function typed(line: string, run: () => void): void {
    const answer = passageAnswer(phase.value, line)
    if (answer === 'drop') return
    if (answer === 'runThenRise') return runThenRise(run)
    if (answer === 'raiseThenRun') skip()
    run()
  }

  /** Forget a passage without running anything (the game is being torn down). */
  function reset(): void {
    stopTimer()
    applyNow = null
    upNow = null
    awaitingPicture = false
    phase.value = 'idle'
  }

  // The store's own timer ends with its scope.
  onScopeDispose(stopTimer)

  return { phase, begin, pictureReady, skip, typed, reset }
})
