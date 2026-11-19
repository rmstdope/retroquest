import { describe, it, expect } from 'vitest'
import { Game, type Item } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED } from '../Act1StoryFlags'
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

describe('the map on the Road to Greendale', () => {
  it('is only shown by Open, never the act-ending use', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.RoadToGreendale
    const map = new GameMap()
    expect(map.open(game.state)).toBe(map.examine(game.state))
    expect(
      game.state.getStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED),
    ).toBe(false)
  })
})

describe("the mother's letter", () => {
  it('is named as the story names it in a refusal', () => {
    expect(new MothersLetter().close(state())).toBe(
      "[failure]You can't close the [item_name]mother's letter[/item_name].[/failure]",
    )
  })
})

describe('typed open and close in Act 1', () => {
  const game = (): Game => {
    const g = new Game([new Act1()])
    g.state.inventory.push(new EliorsJournal(), new MothersLetter())
    return g
  }

  it('reads a book or a letter as using it does', () => {
    expect(game().commandParser.parse('open journal')).toBe(
      game().commandParser.parse('use journal'),
    )
    expect(game().commandParser.parse("open mother's letter")).toBe(
      game().commandParser.parse("use mother's letter"),
    )
  })

  it('refuses to close them, naming the letter as the story does', () => {
    expect(game().commandParser.parse("close mother's letter")).toContain(
      "You can't close the [item_name]mother's letter[/item_name].",
    )
    expect(game().commandParser.parse('close journal')).toContain(
      "You can't close [item_name]Elior's Journal[/item_name].",
    )
  })
})
