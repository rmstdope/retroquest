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

  describe('the carved refrain', () => {
    const REFRAIN = 'Power follows purpose; purpose follows truth.'
    const LEAD_IN =
      'Carved beneath the runes, in a plainer hand, are words you can read:'
    const CLOSING =
      'You read them aloud. They mean nothing to you, and yet they stay with you.'
    const STONE =
      'In the center, a mossy stone bears a faint, magical inscription.'
    const SENTENCE = `Beneath it, in a plainer hand, is carved: \u201c${REFRAIN}\u201d`

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
})
