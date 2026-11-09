/** The ring of actions for a thing pressed on the picture: what is on it, the commands, and where it sits. */
import { describe, expect, it } from 'vitest'
import type { ActionContext } from './actions'
import type { AreaThing } from './areaThings'
import {
  fanLayout,
  RING_BUTTON,
  ringActions,
  ringLayout,
  sayCommand,
  visibleBox,
} from './pressRing'

const EMPTY: ActionContext = {
  roomItems: [],
  characters: [],
  inventory: [],
  spells: [],
  exits: {},
  wares: [],
}
const bucket: AreaThing = {
  areaId: 'bucket',
  label: 'Bucket (full)',
  kind: 'item',
  name: 'bucket (full)',
}
const fountain: AreaThing = {
  areaId: 'scenery-fountain',
  label: 'Fountain',
  kind: 'scenery',
  name: 'fountain',
}
const tilda: AreaThing = {
  areaId: 'tilda',
  label: 'Tilda',
  kind: 'character',
  name: 'tilda',
}
const labels = (thing: AreaThing, ctx: ActionContext): string[] =>
  ringActions(thing, ctx).map((a) => a.label)

describe('ringActions', () => {
  it('offers a thing Take, Use, Open, Close and Examine with nothing carried and no spells', () => {
    expect(labels(bucket, EMPTY)).toEqual([
      'Take',
      'Use',
      'Open',
      'Close',
      'Examine',
    ])
  })

  it('offers scenery the same ring, unfiltered', () => {
    expect(labels(fountain, EMPTY)).toContain('Take')
  })

  it('offers a thing every action in order when there is a bag and spells', () => {
    const ctx = { ...EMPTY, inventory: ['rope'], spells: ['light'] }
    expect(labels(bucket, ctx)).toEqual([
      'Take',
      'Use',
      'Use with…',
      'Open',
      'Close',
      'Cast on…',
      'Examine',
    ])
  })

  it('offers a person Talk to, Say… and Examine when nothing is carried', () => {
    expect(labels(tilda, EMPTY)).toEqual(['Talk to', 'Say…', 'Examine'])
  })

  it('puts Buy… after Say… for a seller with wares, and Give… and Use with… after', () => {
    const ctx: ActionContext = {
      ...EMPTY,
      inventory: ['rope'],
      spells: ['light'],
      wares: [{ name: 'Lantern oil', price: 2, seller: 'tilda' }],
    }
    expect(labels(tilda, ctx)).toEqual([
      'Talk to',
      'Say…',
      'Buy…',
      'Give…',
      'Use with…',
      'Cast on…',
      'Examine',
    ])
  })

  it('does not offer Buy… for a person who sells nothing', () => {
    const ctx: ActionContext = {
      ...EMPTY,
      wares: [{ name: 'rope', price: 1, seller: 'someone else' }],
    }
    expect(labels(tilda, ctx)).not.toContain('Buy…')
  })

  it('sends the commands the Actions row would send', () => {
    const ctx = { ...EMPTY, inventory: ['rope'], spells: ['light'] }
    const byLabel = Object.fromEntries(
      ringActions(bucket, ctx).map((a) => [a.label, a]),
    )
    expect(byLabel['Take'].command).toBe('take bucket (full)')
    expect(byLabel['Examine'].command).toBe('examine bucket (full)')
    expect(byLabel['Use with…'].choices).toEqual([
      { label: 'Rope', command: 'use rope with bucket (full)' },
    ])
    expect(byLabel['Cast on…'].choices).toEqual([
      { label: 'Light', command: 'cast light on bucket (full)' },
    ])
  })

  it('lists only what is carried under Use with…, never what lies on the ground', () => {
    const ctx = { ...EMPTY, roomItems: ['bucket (full)', 'stick'] }
    expect(labels(bucket, ctx)).not.toContain('Use with…')
  })

  it('gives a person the things carried, counted as in the Bag, and the wares with prices', () => {
    const ctx: ActionContext = {
      ...EMPTY,
      inventory: ['[item_name]2 apple[/item_name]', "Elior's Journal"],
      wares: [
        { name: 'rope', price: 1, seller: 'tilda' },
        { name: 'Lantern oil', price: 2, seller: 'tilda' },
      ],
    }
    const byLabel = Object.fromEntries(
      ringActions(tilda, ctx).map((a) => [a.label, a]),
    )
    expect(byLabel['Give…'].choices).toEqual([
      { label: 'Apple ×2', command: 'give apple to tilda' },
      { label: "Elior's Journal", command: "give Elior's Journal to tilda" },
    ])
    expect(byLabel['Buy…'].choices).toEqual([
      { label: 'Rope · 1 coin', command: 'buy rope from tilda' },
      { label: 'Lantern oil · 2 coins', command: 'buy Lantern oil from tilda' },
    ])
    expect(byLabel['Use with…'].choices?.[0].command).toBe(
      'use apple with tilda',
    )
  })

  it('opens a words box for Say…', () => {
    const say = ringActions(tilda, EMPTY).find((a) => a.id === 'say')
    expect(say?.say).toBe(true)
    expect(say?.command).toBeUndefined()
  })
})

describe('sayCommand', () => {
  it('is null for an empty box and says the words to the person otherwise', () => {
    expect(sayCommand('  ', tilda)).toBeNull()
    expect(sayCommand(' hello ', tilda)).toBe('say hello to tilda')
  })
})

describe('ringLayout', () => {
  const bounds = { w: 568, h: 320 }
  it('spreads buttons evenly round the spot, the first at the top, clockwise', () => {
    const { center, buttons } = ringLayout({ x: 284, y: 160 }, 4, bounds)
    expect(center).toEqual({ x: 284, y: 160 })
    expect(buttons[0].x).toBeCloseTo(284)
    expect(buttons[0].y).toBeLessThan(160)
    expect(buttons[1].x).toBeGreaterThan(284)
    expect(buttons[2].y).toBeGreaterThan(160)
    expect(buttons[3].x).toBeLessThan(284)
  })

  it('keeps every button wholly inside the picture, whatever the spot and count', () => {
    for (const count of [1, 3, 5, 7, 8])
      for (const at of [
        { x: 0, y: 0 },
        { x: 568, y: 320 },
        { x: 10, y: 300 },
        { x: 550, y: 5 },
        { x: 284, y: 160 },
      ]) {
        const { buttons } = ringLayout(at, count, bounds)
        for (const b of buttons) {
          expect(b.x - RING_BUTTON / 2).toBeGreaterThanOrEqual(0)
          expect(b.y - RING_BUTTON / 2).toBeGreaterThanOrEqual(0)
          expect(b.x + RING_BUTTON / 2).toBeLessThanOrEqual(bounds.w)
          expect(b.y + RING_BUTTON / 2).toBeLessThanOrEqual(bounds.h)
        }
      }
  })

  it('does not let neighbouring buttons overlap', () => {
    const { buttons } = ringLayout({ x: 284, y: 160 }, 7, bounds)
    for (let i = 0; i < buttons.length; i++) {
      const next = buttons[(i + 1) % buttons.length]
      expect(
        Math.hypot(buttons[i].x - next.x, buttons[i].y - next.y),
      ).toBeGreaterThanOrEqual(RING_BUTTON)
    }
  })

  it('grows with the number of buttons', () => {
    const small = ringLayout({ x: 284, y: 160 }, 3, bounds)
    const large = ringLayout({ x: 284, y: 160 }, 7, bounds)
    expect(large.radius).toBeGreaterThan(small.radius)
  })
})

describe('fanLayout', () => {
  const bounds = { w: 568, h: 320 }
  it('opens on the outer side of the button, away from the ring’s middle', () => {
    const centre = { x: 300, y: 160 }
    expect(fanLayout({ x: 360, y: 160 }, 3, bounds, centre).side).toBe('right')
    expect(fanLayout({ x: 240, y: 160 }, 3, bounds, centre).side).toBe('left')
  })

  it('bends toward the other side when the outer one has no room', () => {
    const centre = { x: 500, y: 160 }
    expect(fanLayout({ x: 540, y: 160 }, 3, bounds, centre).side).toBe('left')
  })

  it('goes to the side with more room for a button above or below the middle', () => {
    expect(
      fanLayout({ x: 100, y: 60 }, 3, bounds, { x: 100, y: 160 }).side,
    ).toBe('right')
    expect(
      fanLayout({ x: 480, y: 60 }, 3, bounds, { x: 480, y: 160 }).side,
    ).toBe('left')
  })

  it('shows as many names as fit and says when there are more', () => {
    const few = fanLayout({ x: 100, y: 160 }, 3, bounds)
    expect(few.visible).toBe(3)
    expect(few.scrolls).toBe(false)
    const many = fanLayout({ x: 100, y: 160 }, 40, bounds)
    expect(many.visible).toBeLessThan(40)
    expect(many.scrolls).toBe(true)
    expect(many.top).toBeGreaterThanOrEqual(0)
    expect(many.top + many.height).toBeLessThanOrEqual(bounds.h)
  })
})

describe('visibleBox', () => {
  const stage = { left: 0, top: 0, width: 800, height: 600 }
  it('is the stage when nothing covers it', () => {
    expect(visibleBox(stage, [])).toEqual(stage)
  })
  it('stops above a bar lying over the foot of the stage', () => {
    const bar = { left: 0, top: 500, width: 800, height: 100 }
    expect(visibleBox(stage, [bar])).toEqual({ ...stage, height: 500 })
  })
  it('starts below a panel lying over the head of the stage', () => {
    const panel = { left: 0, top: 0, width: 800, height: 60 }
    expect(visibleBox(stage, [panel])).toEqual({
      left: 0,
      top: 60,
      width: 800,
      height: 540,
    })
  })
  it('ignores what lies outside the stage', () => {
    const below = { left: 0, top: 600, width: 800, height: 80 }
    expect(visibleBox(stage, [below])).toEqual(stage)
  })
  it('ignores a cover as tall as the stage', () => {
    expect(visibleBox(stage, [stage])).toEqual(stage)
  })
  it('reads a stage whose sides are getters, as a DOMRect keeps them', () => {
    class Rect {
      get left(): number {
        return 10
      }
      get top(): number {
        return 20
      }
      get width(): number {
        return 300
      }
      get height(): number {
        return 200
      }
    }
    expect(visibleBox(new Rect(), [])).toEqual({
      left: 10,
      top: 20,
      width: 300,
      height: 200,
    })
  })
})
