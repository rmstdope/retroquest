import { describe, expect, it } from 'vitest'
import { dragCommand, dragHand, dragPill, DRAG_SLOP } from './beltDrag'
import type { BeltPicture } from './belt'

const picture = (
  kind: 'item' | 'spell',
  name: string,
  label: string,
): BeltPicture => ({
  key: `${kind}:${name}`,
  kind,
  name,
  label,
  count: 1,
  note: '',
  letter: label.charAt(0),
})
const bread = picture('item', 'bread', 'Bread')
const light = picture('spell', 'light', 'Light')

describe('dragHand', () => {
  it('lifts a thing as Use with and a spell as Cast on', () => {
    expect(dragHand(bread)).toEqual({
      kind: 'item',
      name: 'bread',
      label: 'Bread',
      verb: 'usewith',
    })
    expect(dragHand(light).verb).toBe('caston')
  })
})

describe('dragPill', () => {
  it('says what letting go will do', () => {
    expect(dragPill(dragHand(bread), null)).toBe('Use Bread with…')
    expect(
      dragPill(dragHand(bread), {
        from: 'room',
        name: 'grandmother',
        label: 'Grandmother',
      }),
    ).toBe('Use Bread with Grandmother')
    expect(dragPill(dragHand(light), null)).toBe('Cast Light on…')
    expect(
      dragPill(dragHand(light), {
        from: 'room',
        name: 'fireplace',
        label: 'Fireplace',
      }),
    ).toBe('Cast Light on Fireplace')
    expect(
      dragPill(dragHand(bread), {
        from: 'belt',
        name: 'feather',
        label: 'Feather',
        kind: 'item',
      }),
    ).toBe('Use Bread with Feather')
  })

  it('keeps the thing over nothing for a spell over the bag, and for its own pocket', () => {
    expect(
      dragPill(dragHand(light), {
        from: 'belt',
        name: 'feather',
        label: 'Feather',
        kind: 'item',
      }),
    ).toBe('Cast Light on…')
    expect(
      dragPill(dragHand(bread), {
        from: 'belt',
        name: 'bread',
        label: 'Bread',
        kind: 'item',
      }),
    ).toBe('Use Bread with…')
  })
})

describe('dragCommand', () => {
  it('sends what the hand would send', () => {
    expect(
      dragCommand(dragHand(bread), {
        from: 'room',
        name: 'grandmother',
        label: 'Grandmother',
      }),
    ).toBe('use bread with grandmother')
    expect(
      dragCommand(dragHand(light), {
        from: 'room',
        name: 'fireplace',
        label: 'Fireplace',
      }),
    ).toBe('cast light on fireplace')
    expect(
      dragCommand(dragHand(bread), {
        from: 'belt',
        name: 'feather',
        label: 'Feather',
        kind: 'item',
      }),
    ).toBe('use bread with feather')
  })

  it('sends nothing over nothing, a spell over the bag or its own pocket', () => {
    expect(dragCommand(dragHand(bread), null)).toBeNull()
    expect(
      dragCommand(dragHand(light), {
        from: 'belt',
        name: 'feather',
        label: 'Feather',
        kind: 'item',
      }),
    ).toBeNull()
    expect(
      dragCommand(dragHand(bread), {
        from: 'belt',
        name: 'bread',
        label: 'Bread',
        kind: 'item',
      }),
    ).toBeNull()
    expect(
      dragCommand(dragHand(bread), {
        from: 'belt',
        name: 'light',
        label: 'Light',
        kind: 'spell',
      }),
    ).toBeNull()
  })
})

describe('DRAG_SLOP', () => {
  it('is a few pixels', () => {
    expect(DRAG_SLOP).toBeGreaterThan(0)
    expect(DRAG_SLOP).toBeLessThanOrEqual(6)
  })
})
