import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import { LightSpell } from '../spells/LightSpell'
import { AncientAmulet } from '../items/AncientAmulet'

/** An Act I game standing in the Hidden Glade, knowing `light`. */
function gameInGlade(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.HiddenGlade
  game.state.learnSpell(new LightSpell())
  return game
}

/** The carved refrain, word for word. */
const REFRAIN = 'Power follows purpose; purpose follows truth.'

/** The lit-glade sentence that quotes the refrain. */
const SENTENCE = `Beneath it, in a plainer hand, is carved: \u201c${REFRAIN}\u201d`

describe('Hidden Glade', () => {
  it('is dim and overgrown until light is cast', () => {
    const game = gameInGlade()
    const before = game.state.currentRoom.describe(game.state)
    expect(before).toContain('dim')
    expect(before).not.toContain('golden sunlight')

    game.commandParser.parse('cast light')

    const after = game.state.currentRoom.describe(game.state)
    expect(after).toContain('golden sunlight')
    expect(after).not.toContain('darkness')
  })

  it('ends the dim glade on its darkness, not on a pun', () => {
    const game = gameInGlade()
    const before = game.state.currentRoom.describe(game.state)
    expect(before).toContain(
      'An unnatural darkness lingers here, though the sky above the branches is clear.',
    )
    expect(before).not.toContain('enlightened')
  })

  it('carries no mood lines once lit', () => {
    const game = gameInGlade()
    game.commandParser.parse('cast light')
    const after = game.state.currentRoom.describe(game.state)
    expect(after).not.toContain('expectant')
    expect(after).not.toContain('holds its breath')
    expect(after).not.toContain('enchanted')
    expect(after).toContain(SENTENCE)
  })

  it('keeps the lit glade free of mood lines with the Deer present', () => {
    const game = gameInGlade()
    game.commandParser.parse('cast light')
    game.state.setStoryFlag('deer_can_be_observed', true)
    game.commandParser.parse('rest')
    const after = game.state.currentRoom.describe(game.state)
    expect(after).toContain('grazes quietly')
    expect(after).not.toContain('holds its breath')
  })

  describe('resting', () => {
    it('refuses too early without telling the player to do more', () => {
      const game = gameInGlade()
      const text = game.commandParser.parse('rest')
      expect(text).toContain(
        'You rest a while. Birds, the grey grass, a stone you cannot read. ' +
          'Nothing comes. You catch yourself watching the brambles for it, ' +
          'whatever it is.',
      )
      expect(text).not.toContain('Perhaps something more needs')
    })

    it('brings the Deer and opens the flower', () => {
      const game = gameInGlade()
      game.state.setStoryFlag('deer_can_be_observed', true)
      const text = game.commandParser.parse('rest')
      expect(text).toContain(
        'After a while you stop listening for anything, and a ',
      )
      expect(text).toContain(
        ' steps out of the brambles. It stands and looks at you, quite still. ' +
          'Near the mossy stone, where there was only moss, a [item_name]rare flower[/item_name] has opened.',
      )
      expect(text).not.toContain('ancient eyes')
      expect(text).not.toContain('surge of gentle magical energy')
      expect(game.state.currentRoom.getItemByName('Rare Flower')).toBeDefined()
    })
  })

  describe('lighting the stone', () => {
    it('reads the runes plainly and teaches grow as a reading', () => {
      const game = gameInGlade()
      const text = game.commandParser.parse('cast light')
      expect(text).toContain(
        'The darkness lifts, and sunlight comes down through the branches. ' +
          'The runes on the mossy stone stand out clear at last. ' +
          'They speak of a seed, a song, and the sun.',
      )
      expect(text).toContain(
        'You read them slowly, and the spell comes with the reading. ' +
          'It does not wake in you the way the others did; this one you read, ' +
          'word by word, off the stone, and it feels like your own. ',
      )
      expect(text).not.toContain('ancient')
      expect(text).not.toContain('golden sunlight spills')
    })
  })

  describe('the carved refrain', () => {
    const LEAD_IN =
      'Carved beneath the runes, in a plainer hand, are words you can read:'
    const CLOSING =
      'You read them aloud. They mean nothing to you, and yet they stay with you.'
    const STONE =
      'In the center, a mossy stone bears a faint, magical inscription.'

    it('follows the grow line on the first cast', () => {
      const game = gameInGlade()
      const text = game.commandParser.parse('cast light')
      const grow = text.indexOf('You have learned the')
      const lead = text.indexOf(LEAD_IN)
      const refrain = text.indexOf(`[dialogue]${REFRAIN}[/dialogue]`)
      const closing = text.indexOf(CLOSING)
      expect(grow).toBeGreaterThan(-1)
      expect(lead).toBeGreaterThan(grow)
      expect(refrain).toBeGreaterThan(lead)
      expect(closing).toBeGreaterThan(refrain)
    })

    it('says grow is read off the stone and feels like his own, once, with the learn line', () => {
      const game = gameInGlade()
      const text = game.commandParser.parse('cast light')
      const own =
        'It does not wake in you the way the others did; this one you read, ' +
        'word by word, off the stone, and it feels like your own.'
      expect(text).toContain(own)
      expect(text.indexOf(own)).toBeLessThan(
        text.indexOf('You have learned the'),
      )
      expect(game.commandParser.parse('cast light')).not.toContain(own)
    })

    it('shows again on a later cast, without the grow line', () => {
      const game = gameInGlade()
      game.commandParser.parse('cast light')
      const text = game.commandParser.parse('cast light')
      expect(text).not.toContain('You have learned the')
      expect(text).toContain(LEAD_IN)
      expect(text).toContain(`[dialogue]${REFRAIN}[/dialogue]`)
      expect(text).toContain(CLOSING)
    })

    it('is absent while the glade is dark', () => {
      const game = gameInGlade()
      expect(game.state.currentRoom.describe(game.state)).not.toContain(REFRAIN)
    })

    it('is carved into the lit description, before the amulet sentence', () => {
      const game = gameInGlade()
      game.commandParser.parse('cast light')
      game.state.addItemToInventory(new AncientAmulet())
      const text = game.state.currentRoom.describe(game.state)
      const stone = text.indexOf(STONE)
      expect(stone).toBeGreaterThan(-1)
      expect(text.indexOf(SENTENCE)).toBe(stone + STONE.length + 1)
      expect(text.indexOf('begins to glow')).toBeGreaterThan(
        text.indexOf(SENTENCE),
      )
    })

    it('survives a save and reload', () => {
      const game = gameInGlade()
      game.commandParser.parse('cast light')
      const loaded = new Game([new Act1()])
      loaded.loadSaveData(game.toSaveData())
      expect(loaded.state.currentRoom.describe(loaded.state)).toContain(
        SENTENCE,
      )
    })
  })
})

describe('the Hidden Glade room card', () => {
  it('shows the sunlit glade once light is cast', () => {
    const game = gameInGlade()
    const card = new GameController(game)
    game.commandParser.parse('cast light')
    expect(card.getRoomDescription()).toContain('golden sunlight')
    expect(card.getRoomDescription()).not.toContain('too deep in shadow')
  })

  it('shows the amulet glowing in the glade while Elior carries it', () => {
    const game = gameInGlade()
    game.state.inventory.push(new AncientAmulet())
    expect(new GameController(game).getRoomDescription()).toContain(
      'in your hand begins to glow.',
    )
  })

  it('shows the carved refrain on the room card, also after look and after leaving and returning, once light is cast', () => {
    const game = gameInGlade()
    const card = new GameController(game)
    game.commandParser.parse('cast light')
    expect(card.getRoomDescription()).toContain(SENTENCE)
    game.commandParser.parse('look')
    expect(card.getRoomDescription()).toContain(SENTENCE)
    game.commandParser.parse('go north')
    game.commandParser.parse('go south')
    expect(card.getRoomDescription()).toContain(SENTENCE)
  })
})
