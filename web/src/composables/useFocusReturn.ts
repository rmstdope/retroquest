/**
 * Where keyboard focus goes when something over the game goes away: the typing
 * box when it is up, else what opened the thing.
 *
 * The layout says once what the typing box is (`provideFocusReturn`); each thing
 * over the game says it is one (`useFocusReturn`) and need do nothing more. A
 * thing is either a window (a drawer, a dialog, a chapter page) or a passing
 * thing (an arrival or a change of scene, which go by themselves, and the menu
 * at a name, which has its name to go back to). The rule is judged once the
 * screen has been redrawn, so one thing giving way to another counts as neither
 * going:
 * - the last window going gives the typing box the cursor, also from what
 *   opened it;
 * - a passing thing going does so only when focus was left on the page itself
 *   and no window is up, so it takes focus from nothing (another passing thing
 *   still up does not hold it back: none of them keeps the cursor from the box);
 * - the end of the fade into a game does so when no window is up.
 * With no typing box up, focus stays with what opened the thing.
 */
import {
  inject,
  nextTick,
  onBeforeUnmount,
  onUnmounted,
  provide,
  watch,
  type InjectionKey,
} from 'vue'

/** What the layout tells the rule about the game under the things over it. */
export interface FocusReturnGame {
  /** The typing box while it is up, else null. */
  typingBox: () => { focus: () => void } | null
  /** The screen is fading into a game: nothing takes focus meanwhile. */
  busy: () => boolean
}

/** The two kinds of thing over the game. */
type Kind = 'window' | 'passing'

/** How things over the game report to the rule that they have come and gone. */
interface FocusReturn {
  came: (kind: Kind) => void
  went: (kind: Kind) => void
}

const FOCUS_RETURN: InjectionKey<FocusReturn> = Symbol('focus-return')

/**
 * Set up the rule for everything under the calling component. Returns the
 * rule's own move, putting the cursor in the typing box (nothing without one,
 * or during a fade), for what loses focus without being a thing over the game.
 */
export function provideFocusReturn(game: FocusReturnGame): () => void {
  let windows = 0

  function focusTypingBox(): void {
    if (!game.busy()) game.typingBox()?.focus()
  }

  provide(FOCUS_RETURN, {
    came: (kind) => {
      if (kind === 'window') windows++
    },
    went: (kind) => {
      if (kind === 'window') windows--
      void nextTick(() => {
        if (windows) return
        if (kind === 'window' || document.activeElement === document.body)
          focusTypingBox()
      })
    },
  })
  watch(game.busy, (busy) => {
    if (busy) return
    void nextTick(() => {
      if (!windows) focusTypingBox()
    })
  })
  return focusTypingBox
}

/**
 * Make the calling component a thing over the game, from its mount to its
 * unmount, or with `up` only while `up()` is true. It is a window unless it is
 * `passing`, which a thing with `up` always is. `opener` is what the thing gives
 * focus back to as it goes, which the typing box then takes over when it is up
 * and this was the last window. Under no `provideFocusReturn` only `opener`
 * acts.
 */
export function useFocusReturn(
  options: {
    up?: () => boolean
    passing?: boolean
    opener?: () => HTMLElement | null
  } = {},
): void {
  const { up, passing, opener } = options
  onBeforeUnmount(() => {
    const back = opener?.()
    if (back?.isConnected) back.focus()
  })
  const rule = inject(FOCUS_RETURN, null)
  if (!rule) return
  const kind: Kind = up || passing ? 'passing' : 'window'
  let counted = false
  function count(now: boolean): void {
    if (now === counted) return
    counted = now
    if (now) rule?.came(kind)
    else rule?.went(kind)
  }
  if (up) watch(up, count, { immediate: true })
  else count(true)
  onUnmounted(() => count(false))
}
