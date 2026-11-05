import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import {
  FLAG_DEER_CAN_BE_OBSERVED,
  FLAG_MAGIC_FULLY_UNLOCKED,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { DullKnife } from '../items/DullKnife'
import { MillstoneFragment } from '../items/MillstoneFragment'
import { RuneToken } from '../items/RuneToken'

/** An Act I game with Elior at the forge, having already met Borin. */
function gameAtForge(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.BlacksmithsForge
  executeCommands(game, ['talk to blacksmith'])
  return game
}

/** Lead Elior to the glade, rest until the deer comes, and back to the forge. */
function seeTheDeer(game: Game): void {
  game.state.setStoryFlag(FLAG_DEER_CAN_BE_OBSERVED, true)
  game.state.currentRoom = game.state.allRooms.HiddenGlade
  executeCommands(game, ['rest'])
  game.state.currentRoom = game.state.allRooms.BlacksmithsForge
}

describe('Borin sharpening the knife', () => {
  const TRADE =
    'Borin pockets the coin and puts the dull knife to the ' +
    'whetstone. It sings for a minute. He tests the edge on his thumbnail ' +
    'before he hands it back.\nYou receive a sharp knife.'

  /** The response with markup tags removed, so wording can be compared. */
  function plain(response: string): string {
    return response.replace(/\[\/?[a-z_]+\]/g, '')
  }

  it.each(['coin', 'dull knife'])(
    'names the coin then the knife when %s is handed over',
    (given) => {
      const game = gameAtForge()
      game.state.addItemToInventory(new Coin())
      game.state.addItemToInventory(new DullKnife())

      const response = executeCommands(game, [`give ${given} to blacksmith`])

      expect(plain(response)).toContain(TRADE)
      expect(game.state.hasItem('coin')).toBe(false)
      expect(game.state.hasItem('dull knife')).toBe(false)
      expect(game.state.hasItem('sharp knife')).toBe(true)
      expect(findMarkupProblems(response)).toEqual([])
    },
  )

  it('asks for a coin when given the knife without one', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new DullKnife())

    const response = executeCommands(game, ['give dull knife to blacksmith'])

    expect(plain(response)).toContain(
      'Borin eyes the dull knife. That edge has seen better days. ' +
        "I'll put it right for you, lad, but it'll cost a coin.",
    )
    expect(game.state.hasItem('dull knife')).toBe(true)
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('refuses the coin when no dull knife is carried', () => {
    // The starting dull knife lies in another room: only a carried knife
    // counts, so this must not be "simplified" back to a world-wide lookup.
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())

    const response = executeCommands(game, ['give coin to blacksmith'])

    expect(response).toContain(
      'Bring the [item_name]dull knife[/item_name] as well.',
    )
    expect(game.state.hasItem('coin')).toBe(true)
  })

  it('does not trade a coin lying on the floor', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new DullKnife())
    executeCommands(game, ['drop coin'])

    const response = executeCommands(game, ['give dull knife to blacksmith'])

    expect(response).toContain("it'll cost a")
    expect(game.state.hasItem('dull knife')).toBe(true)
    expect(game.state.hasItem('sharp knife')).toBe(false)
  })
})

describe('Borin by his own name', () => {
  it.each(['borin', 'Borin'])(
    'sharpens the knife when it is given to %s',
    (name) => {
      const game = gameAtForge()
      game.state.addItemToInventory(new Coin())
      game.state.addItemToInventory(new DullKnife())

      executeCommands(game, [`give knife to ${name}`])

      expect(game.state.hasItem('sharp knife')).toBe(true)
    },
  )

  it('answers to talk to borin as he does to the blacksmith', () => {
    const byName = gameAtForge()
    const byTrade = gameAtForge()

    expect(executeCommands(byName, ['talk to borin'])).toBe(
      executeCommands(byTrade, ['talk to blacksmith']),
    )
  })
})

describe('Borin as the act goes on', () => {
  it('just welcomes Elior back when nothing has happened yet', () => {
    const game = gameAtForge()

    const response = executeCommands(game, ['talk to blacksmith'])

    expect(response).toContain("What've you got for me?")
    expectDialogueSpeaker(response, 'Borin')
  })

  it('reminds Elior to oil the edge he sharpened', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new DullKnife())
    executeCommands(game, ['give coin to blacksmith'])

    const response = executeCommands(game, ['talk to blacksmith'])

    expect(response).toContain('Keep that edge oiled')
    expectDialogueSpeaker(response, 'Borin')
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('asks about the deer once Elior has seen it', () => {
    const game = gameAtForge()
    seeTheDeer(game)

    const response = executeCommands(game, ['talk to blacksmith'])

    expect(response).toContain('Saw it, did you?')
    expectDialogueSpeaker(response, 'Borin')
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('rotates through what he has to say, newest first', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new DullKnife())
    executeCommands(game, ['give coin to blacksmith'])
    seeTheDeer(game)
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

    const lines = [1, 2, 3, 4].map(() =>
      executeCommands(game, ['talk to blacksmith']),
    )

    expect(lines[0]).toContain("Can't hammer that into shape")
    expect(lines[1]).toContain('Saw it, did you?')
    expect(lines[2]).toContain('Keep that edge oiled')
    expect(lines[3]).toContain("Can't hammer that into shape")
    for (const line of lines) expectDialogueSpeaker(line, 'Borin')
  })

  it('comments on what is newest when Elior visits once after each event', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new DullKnife())
    executeCommands(game, ['give coin to blacksmith'])
    const afterKnife = executeCommands(game, ['talk to blacksmith'])
    seeTheDeer(game)
    const afterDeer = executeCommands(game, ['talk to blacksmith'])
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
    const afterMagic = executeCommands(game, ['talk to blacksmith'])

    expect(afterKnife).toContain('Keep that edge oiled')
    expect(afterDeer).toContain('Saw it, did you?')
    expect(afterMagic).toContain("Can't hammer that into shape")
  })

  it('knows the rune token for cold iron no honest smith forged, and hands it back', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['give rune token to blacksmith'])

    expect(response).toContain('not forged by any honest smith')
    expect(game.state.hasItem('rune token')).toBe(true)
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('tells Elior plainly to sit and rest a while in the glade', () => {
    const game = gameAtForge()
    game.state.addItemToInventory(new MillstoneFragment())

    const response = executeCommands(game, [
      'give millstone fragment to blacksmith',
    ])

    expect(response).toContain('sit down, rest a while')
    expect(response).toContain('[room_name]Hidden Glade[/room_name]')
    expectDialogueSpeaker(response, 'Borin')
  })
})

describe('Borin, named from the first moment', () => {
  it('is Borin before Elior has spoken to him, and answers to his old names', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.BlacksmithsForge
    const smith = game.state.currentRoom.characters[0]

    expect(smith.name).toBe('Borin')
    for (const word of ['blacksmith', 'borin', 'Borin']) {
      expect(smith.answersTo(word)).toBe(true)
    }
  })

  it('speaks under his name and is named in narration, not by his trade', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.BlacksmithsForge

    const talk = game.commandParser.parse('talk to blacksmith')
    const nothing = game.commandParser.parse('buy rope from borin')

    expectDialogueSpeaker(talk, 'Borin')
    expect(nothing).toBe(
      '[character_name]Borin[/character_name] has nothing to sell you.',
    )
  })

  it('is called Borin after loading a save made while he was the blacksmith', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.BlacksmithsForge
    game.state.currentRoom.characters[0].name = 'blacksmith'

    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())

    expect(loaded.state.currentRoom.characters.map((c) => c.name)).toEqual([
      'Borin',
    ])
    expectDialogueSpeaker(
      loaded.commandParser.parse('talk to blacksmith'),
      'Borin',
    )
  })
})

describe('Borin speaks to Elior as a neighbour (rq-m3fy)', () => {
  it('remarks that Elior has not been by since the harvest, without giving his name', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.BlacksmithsForge

    const first = executeCommands(game, ['talk to blacksmith'])

    expect(first).toContain('Mind the sparks, lad.')
    expect(first).toContain('Not seen you down here since the harvest.')
    expect(first).toContain('Still the same work: I make what this village')
    expect(first).not.toMatch(/Borin\[\/character_name\]\. I make/)
  })
})
