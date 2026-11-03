/**
 * Where the story lands after the window crosses about 1100 px.
 *
 * The crossing redraws the story's turns (the column or the cards) in the
 * same pane, and the story re-forms where a fresh answer would have put it:
 * the newest turn from its start (a short one whole at the bottom; a player
 * resting at the bottom, the newest whole in view, is at the newest), unless
 * the player had scrolled back, whose turn then stays in view with the same
 * share of it above the view as its height changes.
 *
 * `ResizeLanding` is the one owner of that policy and its lifecycle: the view
 * of the player's reading kept at rest (and frozen while the window changes
 * size, since the browser re-lays the old turns before the crossing is
 * noticed), the newest-versus-scrolled-back decision, the target, and the
 * landing that repeats on every frame and every reland until the layout has
 * settled or the player takes the story over. It reads the page only through
 * `LandingPorts` and schedules only through a `LandingClock`, so the layout
 * keeps the DOM and the browser keeps the timing.
 */

/** How long (ms) after a crossing of 1100 px the browser may still be laying the story out. */
export const LANDING_SETTLE_MS = 600
/** How long (ms) after a resize the view of the player's reading is kept, longer than the landing. */
export const VIEW_FREEZE_MS = 800
/** Slack (px) so rounding never misplaces a turn's edge against the pane's. */
export const END_SLACK = 8

/** Where the player was reading: the turn at the pane's top edge, how far it starts above it, how tall it was, and whether that is the newest. */
export interface StoryView {
  anchor: number
  offset: number
  height: number
  atNewest: boolean
}

/** A turn as laid out now, measured from the pane's top edge (px). */
export interface TurnBox {
  top: number
  bottom: number
  height: number
}

/** The story as laid out now: its turns, the pane's height, and whether unread text continues below. */
export interface StoryGeometry {
  turns: TurnBox[]
  paneHeight: number
  moreBelow: boolean
}

/** What the landing reads from, and does to, the page. */
export interface LandingPorts {
  /** The story's turns as laid out now, or null when there is nothing to measure. */
  measure(): StoryGeometry | null
  /** One turn's top (from the pane's top edge) and height, or null when it is not there. */
  measureTarget(
    index: number | 'newest',
  ): { top: number; height: number } | null
  /** How far the story is scrolled now. */
  scrollTop(): number
  /** Put the story at `top`. */
  land(top: number): void
  /** The window's size now, as a string that changes when the size does. */
  windowSize(): string
}

/** Timers and frames, as the landing asks for them. */
export interface LandingClock {
  setTimeout(fn: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
  /** A frame, or undefined when the browser has none to give. */
  requestFrame(fn: () => void): unknown
  cancelFrame(handle: unknown): void
}

/** The browser's own timers and animation frames. */
export const browserClock: LandingClock = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (handle) =>
    clearTimeout(handle as ReturnType<typeof setTimeout> | undefined),
  requestFrame: (fn) =>
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(fn)
      : undefined,
  cancelFrame: (handle) => {
    if (typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(handle as number)
  },
}

/** Keeps the player's reading place across a crossing of 1100 px. */
export class ResizeLanding {
  /** The view as last seen at rest. */
  private view: StoryView = { anchor: 0, offset: 0, height: 0, atNewest: true }
  /** The window size the view was taken at. */
  private viewSize = ''
  /** Whether the view is being kept as it was, while the window changes size. */
  private viewFrozen = false
  private viewFreezeTimer: unknown
  /** The view the current landing puts back, or null when not landing. */
  private target: StoryView | null = null
  private landingTimer: unknown
  private landingFrame: unknown

  /** Read the page through `ports`; schedule through `clock`. */
  constructor(
    private readonly ports: LandingPorts,
    private readonly clock: LandingClock = browserClock,
  ) {}

  /** Whether a crossing is being landed (its scrolling is ours, not the player's). */
  get landing(): boolean {
    return this.target !== null
  }

  /** The layout is up: views are taken at the window's size now. */
  start(): void {
    this.viewSize = this.ports.windowSize()
  }

  /** Note where the player is reading, from the layout as it stands; not while landing, nor while the window's size settles. */
  note(): void {
    if (this.landing) return
    if (this.ports.windowSize() !== this.viewSize) this.freezeView()
    if (this.viewFrozen) return
    const geometry = this.ports.measure()
    if (!geometry || geometry.turns.length === 0) return
    const { turns, paneHeight, moreBelow } = geometry
    let anchor = 0
    turns.forEach((turn, index) => {
      if (turn.top <= END_SLACK) anchor = index
    })
    const at = turns[anchor]
    this.view = {
      anchor,
      offset: at.top,
      height: at.height,
      atNewest:
        anchor === turns.length - 1 ||
        !moreBelow ||
        turns[turns.length - 1].bottom <= paneHeight + END_SLACK,
    }
  }

  /** The view a crossing lands with: the one last seen at rest. */
  capture(): StoryView {
    return this.view
  }

  /** Land `view` now, then on every frame and every reland, until the layout has settled. */
  begin(view: StoryView): void {
    this.end()
    this.target = view
    this.landOnce()
    this.landOnFrames()
    this.landingTimer = this.clock.setTimeout(() => {
      this.end()
      this.note()
    }, LANDING_SETTLE_MS)
  }

  /** Something changed size: land again, if landing. */
  reland(): void {
    if (this.landing) this.landOnce()
  }

  /** Stop landing: the layout has settled, or the player has taken the story over. */
  end(): void {
    this.target = null
    this.clock.clearTimeout(this.landingTimer)
    if (this.landingFrame !== undefined)
      this.clock.cancelFrame(this.landingFrame)
    this.landingFrame = undefined
  }

  /** The layout is gone: stop landing and stop waiting for the window to settle. */
  dispose(): void {
    this.end()
    this.clock.clearTimeout(this.viewFreezeTimer)
  }

  /** The window changed size: keep the view as it was, until the layout has settled. */
  private freezeView(): void {
    this.viewFrozen = true
    this.clock.clearTimeout(this.viewFreezeTimer)
    this.viewFreezeTimer = this.clock.setTimeout(() => {
      this.viewFrozen = false
      this.viewSize = this.ports.windowSize()
      this.note()
    }, VIEW_FREEZE_MS)
  }

  /** Put the story where the landing's view means it to be. */
  private landOnce(): void {
    const view = this.target
    if (!view) return
    const turn = this.ports.measureTarget(
      view.atNewest ? 'newest' : view.anchor,
    )
    if (!turn) return
    const into = turn.top + this.ports.scrollTop()
    // The turn is a different height now: keep the same share of it above the view.
    const kept =
      view.height > 0 ? (view.offset * turn.height) / view.height : view.offset
    this.ports.land(view.atNewest ? into : into - kept)
  }

  /** Land again on every frame until the landing ends: room at the story's end can grow with no element changing size. */
  private landOnFrames(): void {
    this.landingFrame = this.clock.requestFrame(() => {
      if (!this.landing) return
      this.landOnce()
      this.landOnFrames()
    })
  }
}
