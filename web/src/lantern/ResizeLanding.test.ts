import { describe, it, expect, beforeEach } from 'vitest'
import {
  LANDING_SETTLE_MS,
  ResizeLanding,
  VIEW_FREEZE_MS,
  type LandingClock,
  type LandingPorts,
  type StoryGeometry,
} from './ResizeLanding'

/** A clock the test turns by hand: timers by `advance`, frames by `frame`. */
class ManualClock implements LandingClock {
  now = 0
  private timers: Array<{ id: number; at: number; fn: () => void }> = []
  private frames: Array<{ id: number; fn: () => void }> = []
  private next = 1

  setTimeout(fn: () => void, ms: number): number {
    const id = this.next++
    this.timers.push({ id, at: this.now + ms, fn })
    return id
  }
  clearTimeout(id: number | undefined): void {
    this.timers = this.timers.filter((t) => t.id !== id)
  }
  requestFrame(fn: () => void): number {
    const id = this.next++
    this.frames.push({ id, fn })
    return id
  }
  cancelFrame(id: number): void {
    this.frames = this.frames.filter((f) => f.id !== id)
  }
  get pendingFrames(): number {
    return this.frames.length
  }
  /** Run the frames asked for so far. */
  frame(): void {
    const due = this.frames
    this.frames = []
    for (const f of due) f.fn()
  }
  /** Let `ms` pass, running every timer that falls due. */
  advance(ms: number): void {
    this.now += ms
    const due = this.timers.filter((t) => t.at <= this.now)
    this.timers = this.timers.filter((t) => t.at > this.now)
    for (const t of due) t.fn()
  }
}

/** A pane 300 px tall over turns 100 px tall, the newest `newest` px tall. */
const PANE = 300
const TURN = 100

describe('ResizeLanding', () => {
  let clock: ManualClock
  let scroll: number
  let size: string
  let newest: number
  let moreBelow: boolean
  /** How much every turn has grown since the view was taken (the new layout). */
  let scale: number
  let landed: number[]
  let landing: ResizeLanding

  const count = 5
  const heightOf = (i: number): number =>
    (i === count - 1 ? newest : TURN) * scale
  const topOf = (i: number): number => i * TURN * scale

  const ports: LandingPorts = {
    measure: (): StoryGeometry => ({
      paneHeight: PANE,
      moreBelow,
      turns: Array.from({ length: count }, (_, i) => ({
        top: topOf(i) - scroll,
        bottom: topOf(i) - scroll + heightOf(i),
        height: heightOf(i),
      })),
    }),
    measureTarget: (index) => {
      const i = index === 'newest' ? count - 1 : index
      if (i >= count) return null
      return { top: topOf(i) - scroll, height: heightOf(i) }
    },
    scrollTop: () => scroll,
    land: (top) => {
      scroll = top
      landed.push(top)
    },
    windowSize: () => size,
  }

  beforeEach(() => {
    clock = new ManualClock()
    scroll = 0
    size = '1280x800'
    newest = 900
    moreBelow = true
    scale = 1
    landed = []
    landing = new ResizeLanding(ports, clock)
    landing.start()
  })

  describe('the view of the player reading', () => {
    it('takes the turn at the top edge, how far it starts above it and its height', () => {
      scroll = topOf(1) + 30
      landing.note()
      expect(landing.capture()).toEqual({
        anchor: 1,
        offset: -30,
        height: TURN,
        atNewest: false,
      })
    })

    it('counts a turn starting just below the top edge as at the top', () => {
      scroll = topOf(2) - 8
      landing.note()
      expect(landing.capture().anchor).toBe(2)
    })

    it('is at the newest when the newest turn is at the top', () => {
      scroll = topOf(4)
      landing.note()
      expect(landing.capture().atNewest).toBe(true)
    })

    it('is at the newest when nothing more is below', () => {
      scroll = topOf(1)
      moreBelow = false
      landing.note()
      expect(landing.capture().atNewest).toBe(true)
    })

    it('is at the newest when the newest turn ends in view', () => {
      newest = 50
      scroll = topOf(2) + 10
      landing.note()
      expect(landing.capture().atNewest).toBe(true)
    })

    it('keeps the view it had while the window changes size, and takes it again once settled', () => {
      scroll = topOf(4)
      landing.note()
      size = '420x800'
      scroll = topOf(1)
      landing.note()
      expect(landing.capture().atNewest).toBe(true)
      clock.advance(VIEW_FREEZE_MS)
      expect(landing.capture().anchor).toBe(1)
    })

    it('keeps the freeze going while views are still being asked for', () => {
      scroll = topOf(4)
      landing.note()
      size = '420x800'
      scroll = topOf(1)
      landing.note()
      clock.advance(VIEW_FREEZE_MS - 100)
      size = '400x800'
      landing.note()
      clock.advance(VIEW_FREEZE_MS - 100)
      expect(landing.capture().atNewest).toBe(true)
    })

    it('measures nothing when there is nothing to measure', () => {
      const empty = new ResizeLanding({ ...ports, measure: () => null }, clock)
      empty.start()
      empty.note()
      expect(empty.capture()).toEqual({
        anchor: 0,
        offset: 0,
        height: 0,
        atNewest: true,
      })
    })

    it('is at the newest once the story has no turns left to read back to', () => {
      let shown = true
      const story = new ResizeLanding(
        {
          ...ports,
          measure: (): StoryGeometry | null =>
            shown
              ? ports.measure()
              : { paneHeight: PANE, moreBelow: false, turns: [] },
        },
        clock,
      )
      story.start()
      scroll = topOf(1)
      story.note()
      expect(story.capture().atNewest).toBe(false)
      shown = false
      story.note()
      expect(story.capture()).toEqual({
        anchor: 0,
        offset: 0,
        height: 0,
        atNewest: true,
      })
    })
  })

  describe('landing after a crossing', () => {
    it('lands the newest turn from its start', () => {
      scroll = topOf(4)
      landing.note()
      scroll = 40
      landing.begin(landing.capture())
      expect(scroll).toBe(topOf(4))
      expect(landing.landing).toBe(true)
    })

    it('keeps the same share of an older turn above the view as its height changes', () => {
      scroll = topOf(1) + 50
      landing.note()
      scale = 2
      landing.begin(landing.capture())
      expect(scroll).toBe(topOf(1) + 100)
    })

    it('keeps the offset as it was when the old turn had no height', () => {
      landing.begin({ anchor: 1, offset: -20, height: 0, atNewest: false })
      expect(scroll).toBe(topOf(1) + 20)
    })

    it('lands nothing when the turn is gone', () => {
      landing.begin({ anchor: 9, offset: 0, height: TURN, atNewest: false })
      expect(landed).toEqual([])
    })

    it('does not take the view while landing', () => {
      scroll = topOf(4)
      landing.note()
      landing.begin(landing.capture())
      scroll = topOf(1)
      landing.note()
      expect(landing.capture().atNewest).toBe(true)
    })

    it('lands again on every frame and on every reland until the layout settles', () => {
      scroll = topOf(4)
      landing.note()
      landing.begin(landing.capture())
      scale = 2
      clock.frame()
      expect(scroll).toBe(topOf(4))
      scale = 3
      landing.reland()
      expect(scroll).toBe(topOf(4))
      clock.advance(LANDING_SETTLE_MS)
      expect(landing.landing).toBe(false)
      expect(clock.pendingFrames).toBe(0)
      scale = 4
      landing.reland()
      clock.frame()
      expect(scroll).toBe(4 * TURN * 3)
    })

    it('takes the view again once the landing settles', () => {
      scroll = topOf(4)
      landing.note()
      landing.begin(landing.capture())
      clock.advance(LANDING_SETTLE_MS)
      expect(landing.capture()).toMatchObject({ anchor: 4, atNewest: true })
    })

    it('stops landing when the player takes the story over', () => {
      scroll = topOf(4)
      landing.note()
      landing.begin(landing.capture())
      landing.end()
      scroll = 7
      scale = 2
      landing.reland()
      clock.frame()
      clock.advance(LANDING_SETTLE_MS)
      expect(scroll).toBe(7)
      expect(clock.pendingFrames).toBe(0)
    })

    it('stops landing when disposed', () => {
      scroll = topOf(4)
      landing.note()
      landing.begin(landing.capture())
      landing.dispose()
      expect(landing.landing).toBe(false)
      expect(clock.pendingFrames).toBe(0)
    })

    it('stops waiting for the window to settle when disposed', () => {
      let measured = 0
      const counted = new ResizeLanding(
        {
          ...ports,
          measure: () => {
            measured++
            return ports.measure()
          },
        },
        clock,
      )
      counted.start()
      size = '420x800'
      counted.note()
      counted.dispose()
      clock.advance(VIEW_FREEZE_MS)
      expect(measured).toBe(0)
    })
  })
})
