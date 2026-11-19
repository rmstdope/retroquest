import { describe, it, expect } from 'vitest'
import { Game, type Item } from '@/engine'
import { Act1 } from '../Act1'
import { EliorsJournal } from './EliorsJournal'
import { FathersNote } from './FathersNote'
import { GameMap } from './GameMap'
import { MothersLetter } from './MothersLetter'
import { MysteriousBox } from './MysteriousBox'
import { PrayerBook } from './PrayerBook'
import { ShedDoor } from './ShedDoor'
import { Snare } from './Snare'

const state = () => new Game([new Act1()]).state

describe('Act 1 things the action ring offers Open on', () => {
  it.each([
    ['the snare', () => new Snare()],
    ['the mysterious box', () => new MysteriousBox()],
    ['the shed door', () => new ShedDoor()],
  ])('%s opens', (_name, make: () => Item) => {
    expect(make().answersToOpen()).toBe(true)
  })

  it('does not offer Open on a plain item', () => {
    expect(
      new Game([new Act1()]).state.currentRoom.items.every(
        (item) =>
          item.answersToOpen() ===
          [Snare, MysteriousBox, ShedDoor].some((kind) => item instanceof kind),
      ),
    ).toBe(true)
  })

  it.each([
    ['the journal', () => new EliorsJournal(), 'use'],
    ["the mother's letter", () => new MothersLetter(), 'use'],
    ['the prayer book', () => new PrayerBook(), 'use'],
    ['the map', () => new GameMap(), 'use'],
    ["the father's note", () => new FathersNote(), 'examine'],
  ] as const)('%s is read by Open as by %s', (_name, make, how) => {
    const [a, b] = [make(), make()]
    expect(a.answersToOpen()).toBe(true)
    expect(a.open(state())).toBe(b[how](state()))
  })
})

describe("the mother's letter", () => {
  it('is named as the story names it in a refusal', () => {
    expect(new MothersLetter().close(state())).toBe(
      "[failure]You can't close the [item_name]mother's letter[/item_name].[/failure]",
    )
  })
})
