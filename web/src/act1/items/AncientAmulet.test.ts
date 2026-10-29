import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { AncientAmulet } from './AncientAmulet'
import { Locket } from './Locket'
import { MothersLetter } from './MothersLetter'
import { Mechanism } from './Mechanism'
import { HiddenGlade } from '../rooms/HiddenGlade'
import { executeCommands } from '@/testing/gameHelpers'

const AMULET = '[item_name]ancient amulet[/item_name]'
const GLOW_ON_STAND =
  `On its stand, the ${AMULET} glows brighter as you step in, ` +
  'as if something you carry has woken it.'
const EMPTY_STAND = 'The stand where the amulet rested stands empty.'
const MILL_HUM =
  `At your side, the ${AMULET} hums softly, as if answering something ` +
  'stirring beneath the floor.'
const GLADE_GLOW = `Beside the mossy stone, the ${AMULET} in your hand begins to glow.`
const RUNES =
  'A mysterious amulet inscribed with runes. ' +
  'At its centre, a sun rises over three linked rings.'

/** An Act I game standing in the named room. */
function gameIn(room: string): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

/** Move the amulet from the stand into Elior's pack, as Mira's handover does. */
function handOver(game: Game): void {
  game.state.allRooms.MirasHut.removeItem('ancient amulet')
  game.state.addItemToInventory(new AncientAmulet())
}

/** Jam the mill's mechanism. */
function jamMechanism(game: Game): void {
  const mechanism = game.state.allRooms.OldMill.items.find(
    (item) => item instanceof Mechanism,
  )
  if (mechanism instanceof Mechanism) mechanism.repaired = true
}

describe('Ancient Amulet on its stand', () => {
  it('is only faintly warm while Elior carries no keepsake', () => {
    const game = gameIn('MirasHut')
    const hut = game.state.currentRoom.describe(game.state)
    expect(hut).not.toContain('glows brighter')
    expect(hut).not.toContain('stands empty')
    expect(executeCommands(game, ['examine amulet'])).toContain(
      `${RUNES} It is faintly warm, as if someone had only just set it down.`,
    )
  })

  it.each([
    ['locket', new Locket()],
    ['letter', new MothersLetter()],
  ])(
    'brightens at the end of the hut text when he carries the %s',
    (_n, item) => {
      const game = gameIn('MirasHut')
      game.state.addItemToInventory(item)
      const hut = game.state.currentRoom.describe(game.state)
      expect(hut).toContain(GLOW_ON_STAND)
      expect(hut.indexOf(GLOW_ON_STAND)).toBeGreaterThan(
        hut.indexOf('the way you move through your own kitchen.'),
      )
      expect(executeCommands(game, ['examine amulet'])).toContain(
        `${RUNES} Its glow quickens as you lean closer, steady as a heartbeat.`,
      )
    },
  )

  it('shows one glow sentence for both keepsakes and drops it when they go', () => {
    const game = gameIn('MirasHut')
    game.state.addItemToInventory(new Locket())
    game.state.addItemToInventory(new MothersLetter())
    const both = game.state.currentRoom.describe(game.state)
    expect(both.split(GLOW_ON_STAND)).toHaveLength(2)
    game.state.inventory.length = 0
    expect(game.state.currentRoom.describe(game.state)).not.toContain(
      GLOW_ON_STAND,
    )
  })
})

describe('Ancient Amulet after the handover', () => {
  it('leaves the stand empty, even while he carries the letter', () => {
    const game = gameIn('MirasHut')
    game.state.addItemToInventory(new MothersLetter())
    handOver(game)
    const hut = game.state.currentRoom.describe(game.state)
    expect(hut).not.toContain('glows brighter')
    expect(hut).toContain(`kitchen. ${EMPTY_STAND}\n`)
    expect(game.state.allRooms.MirasHut.getItemByName('amulet')).toBeNull()
  })
})

describe('Ancient Amulet in his hand', () => {
  it('is faintly warm anywhere else and changes no room', () => {
    const game = gameIn('VillageSquare')
    handOver(game)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      `${RUNES} It is faintly warm in your hand.`,
    )
  })

  it('hums at the mill only once the mechanism is jammed', () => {
    const game = gameIn('OldMill')
    handOver(game)
    const whirring = game.state.currentRoom.describe(game.state)
    expect(whirring).not.toContain(MILL_HUM)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      `${RUNES} It is faintly warm in your hand.`,
    )
    jamMechanism(game)
    const jammed = game.state.currentRoom.describe(game.state)
    expect(jammed).toContain(`silent at last. ${MILL_HUM}`)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      `${RUNES} It hums softly in your hand, as if answering something ` +
        'stirring beneath the floor.',
    )
  })

  it('does not hum at the mill without the amulet in hand', () => {
    const game = gameIn('OldMill')
    jamMechanism(game)
    expect(game.state.currentRoom.describe(game.state)).not.toContain(MILL_HUM)
  })

  it('glows by the mossy stone, dim or sunlit, before the closing line', () => {
    const game = gameIn('HiddenGlade')
    handOver(game)
    const dim = game.state.currentRoom.describe(game.state)
    expect(dim).toContain(GLADE_GLOW)
    expect(dim.indexOf(GLADE_GLOW)).toBeGreaterThan(
      dim.indexOf('too deep in shadow to read.'),
    )
    const glade = game.state.currentRoom
    if (glade instanceof HiddenGlade) glade.lightSpellCast = true
    const sunlit = game.state.currentRoom.describe(game.state)
    expect(sunlit).toContain(GLADE_GLOW)
    expect(sunlit.indexOf(GLADE_GLOW)).toBeGreaterThan(
      sunlit.indexOf('a plainer hand'),
    )
    expect(executeCommands(game, ['examine amulet'])).toContain(
      `${RUNES} It glows in your hand, brightest when you hold it near the mossy stone.`,
    )
  })

  it('shows nothing in the glade without the amulet', () => {
    const game = gameIn('HiddenGlade')
    expect(game.state.currentRoom.describe(game.state)).not.toContain(
      GLADE_GLOW,
    )
  })

  it('reads the same after a save and reload', () => {
    const game = gameIn('OldMill')
    handOver(game)
    jamMechanism(game)
    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    expect(loaded.state.currentRoom.describe(loaded.state)).toContain(MILL_HUM)
  })

  it('keeps the bag line at "in your hand" after examining it elsewhere', () => {
    const game = gameIn('OldMill')
    handOver(game)
    jamMechanism(game)
    executeCommands(game, ['examine amulet'])
    const amulet = game.state.inventory.find((i) => i.name === 'ancient amulet')
    expect(amulet?.description).toBe(
      `${RUNES} It is faintly warm in your hand.`,
    )
  })
})

describe('Ancient Amulet and the hut across a save', () => {
  it('shows the empty stand exactly once after reload', () => {
    const game = gameIn('MirasHut')
    game.state.addItemToInventory(new MothersLetter())
    handOver(game)
    game.state.currentRoom.describe(game.state)
    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    const hut = loaded.state.currentRoom.describe(loaded.state)
    expect(hut.split(EMPTY_STAND)).toHaveLength(2)
    expect(hut).not.toContain('glows brighter')
  })
})

describe('Ancient Amulet pickup refusal', () => {
  it('has Mira keep it back in her own voice, with no talk of preparations', () => {
    const game = gameIn('MirasHut')

    const response = executeCommands(game, ['take amulet'])

    expect(response).toContain(' puts her hand over the ')
    expect(response).toContain('Not that one, ')
    expect(response).toContain('It has waited a long while for you')
    expect(response).not.toContain('preparations')
  })
})
