import { describe, expect, it } from 'vitest'
import { clue, Game, type Item } from '@/engine'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Bread } from './Bread'
import { Candle } from './Candle'
import { DullKnife } from './DullKnife'
import { ExtendedMagneticFishingRod } from './ExtendedMagneticFishingRod'
import { FishingRod } from './FishingRod'
import { Key } from './Key'
import { Lantern } from './Lantern'
import { Magnet } from './Magnet'
import { Matches } from './Matches'
import { MagneticFishingRod } from './MagneticFishingRod'
import { Mechanism } from './Mechanism'
import { MysteriousBox } from './MysteriousBox'
import { Rope } from './Rope'
import { RustyHoe } from './RustyHoe'
import { RustySaw } from './RustySaw'
import { SharpKnife } from './SharpKnife'
import { Stick } from './Stick'
import { Well } from './Well'

/**
 * The natural wrong tries at Act I's puzzles (rq-8v75, rq-miya): each gets a refusal
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
const MATCHES_CORNER = clue(
  'A match flares at the corner and gutters out before the dark gives ' +
    'anything back. It wants a light that stays.',
)
const MAGNET_MECHANISM = clue(
  'The magnet snaps to the black iron and holds, and the gears turn on ' +
    'beside it. It would take something threaded through them, not stuck on.',
)
const STILL_GEARS = clue(
  'These wooden gears have not moved in years. ' +
    'The turning is in the iron thing among them.',
)
const LANTERN_RAFTER = clue(
  'Held high, the lantern shows a glint on the rafter, still well out of ' +
    'your reach. Only the hens, startled into the air, ever get up that high.',
)
const LANTERN_CANDLE = clue(
  "The flame sits behind the lantern's glass, and the candle's wick will " +
    'not reach in through it. The candle wants a flame of its own, struck ' +
    'for it.',
)
const STICK_ROD = clue(
  'Lashed on now, the stick would cover the end of the rod, where ' +
    'something else may want to go first. The length can come last.',
)
const LANTERN_STONE = clue(
  'The lantern lights the moss and not a letter beneath it. ' +
    'This shadow lies over the whole glade, and a flame held close does ' +
    'not lift it.',
)
const ROPE_WELL = clue(
  'A bare rope let down the well comes back up wet, and nothing more. ' +
    'Water wants a bucket to come up in.',
)
const KNIFE_BOX = clue(
  'The blade finds no seam to work and no keyhole to pick. ' +
    'The runes around the lid are the only way in, and they do not answer ' +
    'to steel.',
)

const MAGNET_ROD_TOO_SOON = clue(
  'With a magnet on the line, the rod would catch iron and never a fish. ' +
    'Not yet, then.',
)

describe('wrong tries at Act I puzzles', () => {
  it('says why the magnet stays off the rod while it is still for fishing', () => {
    const game = gameIn('VillageWell', [new FishingRod(), new Magnet()])
    const text = executeCommands(game, ['use fishing rod with magnet'])
    expect(text).toBe(MAGNET_ROD_TOO_SOON)
  })

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

  it('says the magnet holds to the mechanism without stopping it', () => {
    const game = gameIn('OldMill', [new Magnet()])
    const text = executeCommands(game, ['use magnet with mechanism'])
    expect(text).toBe(MAGNET_MECHANISM)
  })

  it.each([
    ['dull knife', new DullKnife()],
    ['sharp knife', new SharpKnife()],
  ])(
    'says the mill gears are still and points at the iron thing (%s)',
    (name, knife) => {
      const game = gameIn('OldMill', [knife])
      const text = executeCommands(game, [`use ${name} with gears`])
      expect(text).toBe(STILL_GEARS)
    },
  )

  it.each([
    ['rope', new Rope()],
    ['magnet', new Magnet()],
    ['fishing rod', new FishingRod()],
  ])('points the %s from the still gears at the iron thing', (name, item) => {
    const game = gameIn('OldMill', [item])
    const text = executeCommands(game, [`use ${name} with gears`])
    expect(text).toBe(STILL_GEARS)
  })

  it('says the gears are still once the mechanism is jammed', () => {
    const game = gameIn('OldMill', [new SharpKnife()])
    const mechanism = game.state.currentRoom.items.find(
      (i) => i instanceof Mechanism,
    )
    if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
    mechanism.repaired = true
    const text = executeCommands(game, ['use sharp knife with gears'])
    expect(text).toBe(
      '[failure]The gears are still, and the iron thing among them is ' +
        'jammed fast.[/failure]',
    )
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

  it.each([
    ['dull knife', new DullKnife()],
    ['sharp knife', new SharpKnife()],
  ])(
    'says the %s falls short of the rafter and points at the hens',
    (name, knife) => {
      const game = gameIn('ChickenCoop', [knife])
      const text = executeCommands(game, [`use ${name} with rafter`])
      expect(text).toBe(TOOL_RAFTER)
    },
  )

  it('says the lantern shows the rafter but cannot reach it', () => {
    const game = gameIn('ChickenCoop', [litLantern()])
    const text = executeCommands(game, ['use lantern with rafter'])
    expect(text).toBe(LANTERN_RAFTER)
  })

  it('says the rafter is bare to the lantern once the key has fallen', () => {
    const game = gameIn('ChickenCoop', [new Bread(), litLantern()])
    executeCommands(game, ['use bread with chicken'])
    const text = executeCommands(game, ['use lantern with rafter'])
    expect(text).toBe(
      '[failure]Only dust and a few feathers on the rafter now.[/failure]',
    )
  })

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

  it('says why a match does not light the dark corner', () => {
    const game = gameIn('VillageChapel', [new Matches()])
    const text = executeCommands(game, ['use matches with dark corner'])
    expect(text).toBe(MATCHES_CORNER)
    expect(game.state.currentRoom.getItemByName('locket')).toBeNull()
  })

  it('says the candle already lights the corner to the matches', () => {
    const game = gameIn('VillageChapel', [new Matches()])
    const candle = game.state.currentRoom.items.find((i) => i instanceof Candle)
    if (!(candle instanceof Candle)) throw new Error('no candle')
    candle.isLit = true
    const text = executeCommands(game, ['use matches with dark corner'])
    expect(text).toBe(
      '[failure]The candle already lights the corner by the altar.[/failure]',
    )
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

  it('says why the lantern cannot light the candle, in either word order', () => {
    const wrong: string[] = []
    for (const command of [
      'use lantern with candle',
      'use candle with lantern',
    ]) {
      const game = gameIn('VillageChapel', [litLantern()])
      const text = executeCommands(game, [command])
      if (text !== LANTERN_CANDLE) wrong.push(`${command}: ${text}`)
      if (game.state.currentRoom.getItemByName('locket') !== null)
        wrong.push(`${command}: locket appeared`)
    }
    expect(wrong).toEqual([])
  })

  it('says the candle is already lit to the lantern', () => {
    const game = gameIn('VillageChapel', [litLantern()])
    const candle = game.state.currentRoom.items.find((i) => i instanceof Candle)
    if (!(candle instanceof Candle)) throw new Error('no candle')
    candle.isLit = true
    const text = executeCommands(game, ['use lantern with candle'])
    expect(text).toBe(
      '[failure]The [item_name]candle[/item_name] is already lit.[/failure]',
    )
  })

  it('says the stick goes on the rod last, in either word order', () => {
    const wrong: string[] = []
    for (const command of [
      'use stick with fishing rod',
      'use fishing rod with stick',
    ]) {
      const game = gameIn('Riverbank', [new Stick(), new FishingRod()])
      const text = executeCommands(game, [command])
      if (text !== STICK_ROD) wrong.push(`${command}: ${text}`)
      if (!game.state.hasItem('fishing rod') || !game.state.hasItem('stick'))
        wrong.push(`${command}: an item was lost`)
    }
    expect(wrong).toEqual([])
  })

  it.each(['mossy stone', 'inscription'])(
    'says the lantern does not lift the glade shadow from the %s',
    (target) => {
      const game = gameIn('HiddenGlade', [litLantern()])
      const text = executeCommands(game, [`use lantern with ${target}`])
      expect(text).toBe(LANTERN_STONE)
    },
  )

  it('says the lit glade needs no lantern on the stone', () => {
    const game = gameIn('HiddenGlade', [litLantern()])
    const glade = game.state.currentRoom
    if (!('lightSpellCast' in glade)) throw new Error('no glade')
    glade.lightSpellCast = true
    const text = executeCommands(game, ['use lantern with mossy stone'])
    expect(text).toBe(
      '[failure]The runes stand out clear in the sunlight; the lantern ' +
        'adds nothing to them.[/failure]',
    )
  })

  it('says a bare rope brings nothing up the well, in either word order', () => {
    const wrong: string[] = []
    for (const command of ['use rope with well', 'use well with rope']) {
      const rope = new Rope()
      rope.canBeCarried = true
      const game = gameIn('VillageWell', [rope])
      const text = executeCommands(game, [command])
      if (text !== ROPE_WELL) wrong.push(`${command}: ${text}`)
    }
    expect(wrong).toEqual([])
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
      MATCHES_CORNER,
      MAGNET_MECHANISM,
      STILL_GEARS,
      LANTERN_RAFTER,
      LANTERN_CANDLE,
      STICK_ROD,
      LANTERN_STONE,
      ROPE_WELL,
    ]) {
      expectMarkupWellFormed(line)
    }
  })
})

/**
 * The natural tries found after rq-miya was filed (rq-3r2v): the ones that
 * should simply work now do, and the rest say something true in-world.
 */
describe('more natural tries at Act I puzzles', () => {
  const SHED_LOCKED = clue(
    'The door holds. It is locked, and it has a keyhole.',
  )
  const BELL_ROPE = clue(
    'The rope is soft in your hand, and you let it go. ' +
      "The bell is the priest's to ring.",
  )

  it('digs the field when the hoe is used with any name for the ground', () => {
    const wrong: string[] = []
    for (const target of ['earth', 'soil', 'ground', 'crops', 'rows']) {
      const game = gameIn('VegetableField', [new RustyHoe()])
      const text = executeCommands(game, [`use rusty hoe with ${target}`])
      if (!text.includes('you unearth a small, tarnished'))
        wrong.push(`${target}: ${text}`)
      if (!game.state.hasItem('coin')) wrong.push(`${target}: no coin`)
    }
    expect(wrong).toEqual([])
  })

  it('tills the field again with the hoe and the earth like use hoe', () => {
    const game = gameIn('VegetableField', [new RustyHoe()])
    executeCommands(game, ['use hoe'])
    const again = executeCommands(game, ['use hoe with earth'])
    expect(again).toContain("you've already found what was hidden here")
  })

  /** A game on the Riverbank with the rod, taught by the fisherman or not. */
  function atTheRiver(taught: boolean): Game {
    const game = gameIn('Riverbank', [new FishingRod()])
    game.state.setStoryFlag('learned_fishing_basics', taught)
    return game
  }

  it.each(['use fishing rod with reeds', 'use fishing rod', 'use rod'])(
    'fishes the river on %s once the fisherman has taught Elior',
    (command) => {
      const game = atTheRiver(true)
      const text = executeCommands(game, [command])
      expect(text).toContain('you feel a tug and reel in a plump')
      expect(game.state.hasItem('fish')).toBe(true)
    },
  )

  it.each(['use fishing rod with reeds', 'use fishing rod'])(
    'says the river gives no second fish on %s',
    (command) => {
      const game = atTheRiver(true)
      executeCommands(game, ['use fishing rod with river'])
      expect(executeCommands(game, [command])).toBe(
        clue(
          'Nothing bites. The river gave you one fish, and it will not ' +
            'give another.',
        ),
      )
    },
  )

  it.each(['use fishing rod with reeds', 'use fishing rod'])(
    'answers %s like the river before the fisherman has taught Elior',
    (command) => {
      const text = executeCommands(atTheRiver(false), [command])
      expect(text).toBe(
        executeCommands(atTheRiver(false), ['use fishing rod with river']),
      )
    },
  )

  it.each(['open shed door', 'open door'])(
    'says the locked door holds on %s',
    (command) => {
      const text = executeCommands(gameIn('AbandonedShed', []), [command])
      expect(text).toBe(SHED_LOCKED)
    },
  )

  it('says the unlocked shed door already stands open', () => {
    const game = gameIn('AbandonedShed', [new Key()])
    executeCommands(game, ['use key with door'])
    const text = executeCommands(game, ['open shed door'])
    expect(text).toBe(
      '[failure]The [item_name]shed door[/item_name] already stands ' +
        'ajar.[/failure]',
    )
  })

  it('lights the candle with the matches in hand on use candle', () => {
    const game = gameIn('VillageChapel', [new Matches()])
    const text = executeCommands(game, ['use candle'])
    expect(text).toContain('now casts a warm glow')
    expect(game.state.currentRoom.getItemByName('locket')).not.toBeNull()
    expect(executeCommands(game, ['use candle'])).toBe(
      '[failure]The [item_name]candle[/item_name] is already lit.[/failure]',
    )
  })

  it('says the bell is the priest to ring on use bell rope', () => {
    const text = executeCommands(gameIn('VillageChapel', []), ['use bell rope'])
    expect(text).toBe(BELL_ROPE)
  })

  it('writes every new refusal in well-formed markup', () => {
    for (const line of [SHED_LOCKED, BELL_ROPE]) expectMarkupWellFormed(line)
  })
})
