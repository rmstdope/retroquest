import { describe, expect, it } from 'vitest'
import { clue, Game, type Item } from '@/engine'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Bread } from './Bread'
import { Candle } from './Candle'
import { DullKnife } from './DullKnife'
import { ExtendedMagneticFishingRod } from './ExtendedMagneticFishingRod'
import { FishingRod } from './FishingRod'
import { Lantern } from './Lantern'
import { Magnet } from './Magnet'
import { MagneticFishingRod } from './MagneticFishingRod'
import { Mechanism } from './Mechanism'
import { MysteriousBox } from './MysteriousBox'
import { RustyHoe } from './RustyHoe'
import { RustySaw } from './RustySaw'
import { SharpKnife } from './SharpKnife'
import { Well } from './Well'

/**
 * The natural wrong tries at Act I's puzzles (rq-8v75): each gets a refusal
 * that says something true in-world (Puzzle Rule 2), never the engine's bare
 * "You can't use X with Y".
 */

/** A game standing in `room` with `items` in hand. */
function gameIn(room: string, items: Item[]): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[room]
  for (const item of items) game.state.addItemToInventory(item)
  return game
}

/** A lit lantern, as Elior carries it. */
function litLantern(): Lantern {
  const lantern = new Lantern()
  lantern.name = 'lantern (lit)'
  lantern.shortName = 'lantern'
  return lantern
}

const MAGNET_WELL = clue(
  'Your arm does not reach the water, and a magnet dropped down there ' +
    'would not come back up. It would want something long to hang from.',
)
const ROD_MECHANISM = clue(
  'The line is too fine for those gears. They would cut it like thread ' +
    'and keep turning; whatever stops them has to be thicker than that.',
)
const KNIFE_MECHANISM = clue(
  'The blade skitters off the turning teeth, and they turn on. ' +
    'It would take something threaded through them, not poked between.',
)
const TOOL_RAFTER = clue(
  'Even at full stretch it falls well short of the rafter. ' +
    'The hens scatter from the swing, and their wings go higher than ' +
    'your arm does.',
)
const SAW_VINES = clue(
  'The rusty teeth catch in the thorns and stick. ' +
    'These vines are tougher than they look, and the saw would break ' +
    'before they did. A keen edge might part them.',
)
const DULL_KNIFE_VINES = clue(
  'The dull blade only bruises the vines. It would need an edge first.',
)
const LANTERN_CORNER = clue(
  "The lantern's light goes into the corner and does not come out again. " +
    'The corner keeps its dark, as if it were waiting for a light of its ' +
    'own.',
)
const KNIFE_BOX = clue(
  'The blade finds no seam to work and no keyhole to pick. ' +
    'The runes around the lid are the only way in, and they do not answer ' +
    'to steel.',
)

describe('wrong tries at Act I puzzles', () => {
  it('says why the magnet alone will not fetch what is down the well', () => {
    const game = gameIn('VillageWell', [new Magnet()])
    const text = executeCommands(game, ['use magnet with well'])
    expect(text).toBe(MAGNET_WELL)
  })

  it('says plainly there is nothing left for the magnet once the ring is up', () => {
    const game = gameIn('VillageWell', [new Magnet()])
    const well = game.state.currentRoom.items.find((i) => i instanceof Well)
    if (!(well instanceof Well)) throw new Error('no well')
    well.containsRing = false
    const text = executeCommands(game, ['use magnet with well'])
    expect(text).toBe(
      '[failure]Nothing glints down there now for the magnet to find.[/failure]',
    )
  })

  it.each([
    ['fishing rod', new FishingRod()],
    ['magnetic fishing rod', new MagneticFishingRod()],
    ['extended magnetic fishing rod', new ExtendedMagneticFishingRod()],
  ])('says the %s line is too fine for the mechanism', (name, rod) => {
    const game = gameIn('OldMill', [rod])
    const text = executeCommands(game, [`use ${name} with mechanism`])
    expect(text).toBe(ROD_MECHANISM)
  })

  it.each([
    ['dull knife', new DullKnife()],
    ['sharp knife', new SharpKnife()],
  ])('says the %s cannot stop the mechanism', (name, knife) => {
    const game = gameIn('OldMill', [knife])
    const text = executeCommands(game, [`use ${name} with mechanism`])
    expect(text).toBe(KNIFE_MECHANISM)
  })

  it('says the jammed mechanism is jammed fast to a late try', () => {
    const game = gameIn('OldMill', [new DullKnife()])
    const mechanism = game.state.currentRoom.items.find(
      (i) => i instanceof Mechanism,
    )
    if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
    mechanism.repaired = true
    const text = executeCommands(game, ['use knife with mechanism'])
    expect(text).toBe(
      '[failure]The [item_name]strange mechanism[/item_name] is jammed fast.[/failure]',
    )
  })

  it.each([
    ['rusty hoe', new RustyHoe()],
    ['rusty saw', new RustySaw()],
  ])(
    'says the %s falls short of the rafter and points at the hens',
    (name, tool) => {
      const game = gameIn('ChickenCoop', [tool])
      const text = executeCommands(game, [`use ${name} with rafter`])
      expect(text).toBe(TOOL_RAFTER)
    },
  )

  it('says the rafter is bare once the key has fallen', () => {
    const game = gameIn('ChickenCoop', [new Bread(), new RustyHoe()])
    executeCommands(game, ['use bread with chicken'])
    const text = executeCommands(game, ['use rusty hoe with rafter'])
    expect(text).toBe(
      '[failure]Only dust and a few feathers on the rafter now.[/failure]',
    )
  })

  it('says the rusty saw cannot cut the thorny vines', () => {
    const game = gameIn('ForestPath', [new RustySaw()])
    const text = executeCommands(game, ['use rusty saw with vines'])
    expect(text).toBe(SAW_VINES)
  })

  it('says the dull knife only bruises the vines', () => {
    const game = gameIn('ForestPath', [new DullKnife()])
    const text = executeCommands(game, ['use dull knife with vines'])
    expect(text).toBe(DULL_KNIFE_VINES)
  })

  it('says why a lit lantern does not light the dark corner', () => {
    const game = gameIn('VillageChapel', [litLantern()])
    const text = executeCommands(game, ['use lantern with dark corner'])
    expect(text).toBe(LANTERN_CORNER)
    expect(game.state.currentRoom.getItemByName('locket')).toBeNull()
  })

  it('says the candle already lights the corner once it is lit', () => {
    const game = gameIn('VillageChapel', [litLantern()])
    const candle = game.state.currentRoom.items.find((i) => i instanceof Candle)
    if (!(candle instanceof Candle)) throw new Error('no candle')
    candle.isLit = true
    const text = executeCommands(game, ['use lantern with dark corner'])
    expect(text).toBe(
      '[failure]The candle already lights the corner by the altar.[/failure]',
    )
  })

  it.each([
    ['dull knife', new DullKnife()],
    ['sharp knife', new SharpKnife()],
  ])('says the %s finds no way into the locked box', (name, knife) => {
    const game = gameIn('AbandonedShed', [knife])
    game.state.currentRoom.addItem(new MysteriousBox())
    const text = executeCommands(game, [`use ${name} with mysterious box`])
    expect(text).toBe(KNIFE_BOX)
  })

  it('says the unlocked box needs no blade', () => {
    const game = gameIn('AbandonedShed', [new SharpKnife()])
    const box = new MysteriousBox()
    box.locked = false
    game.state.currentRoom.addItem(box)
    const text = executeCommands(game, ['use sharp knife with mysterious box'])
    expect(text).toBe(
      '[failure]The [item_name]mysterious box[/item_name] is already ' +
        'unlocked; there is nothing for a blade to do.[/failure]',
    )
  })

  it('writes every refusal in well-formed markup', () => {
    for (const line of [
      MAGNET_WELL,
      ROD_MECHANISM,
      KNIFE_MECHANISM,
      TOOL_RAFTER,
      SAW_VINES,
      DULL_KNIFE_VINES,
      LANTERN_CORNER,
      KNIFE_BOX,
    ]) {
      expectMarkupWellFormed(line)
    }
  })
})
