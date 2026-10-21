import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_HEMLOCK_HEARD_PATCHES_STAYED,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_PRIEST_TALKED_TO,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { Matches } from '../items/Matches'
import { Patches } from './Patches'
import { Shopkeeper } from './Shopkeeper'
import { expectDialogueSpeaker } from '@/testing/gameHelpers'

const DIALOGUE_PATTERN = /\[dialogue\](.*?)\[\/dialogue\]/gs
const QUOTE_MARKS = '"\''

/** An Act I game with Elior standing in the General Store. */
function gameInStore({ shopOpen = true, priestTalkedTo = false } = {}): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.GeneralStore
  game.state.setStoryFlag(FLAG_PATCHES_RETURNED, shopOpen)
  game.state.setStoryFlag(FLAG_PRIEST_TALKED_TO, priestTalkedTo)
  return game
}

/**
 * An Act I game loaded from a save made before the matches left the
 * shopkeeper's wares: `matches` is still for sale until the hand-over, and
 * `priestMatchesGiven` does not exist yet.
 */
function legacySave({ handedOver }: { handedOver: boolean }): Game {
  const game = gameInStore({ priestTalkedTo: true })
  const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
  if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
  if (!handedOver) shopkeeper.wares.matches = { item: new Matches(), price: 4 }
  Reflect.deleteProperty(shopkeeper, 'priestMatchesGiven')
  const loaded = new Game([new Act1()])
  expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
  return loaded
}

/** No quote mark sits outside dialogue and each quoted block is closed. */
function expectQuotesInsideDialogue(text: string): void {
  const narration = text.replace(DIALOGUE_PATTERN, '')
  expect(narration, `double quote outside dialogue in: ${text}`).not.toContain(
    '"',
  )
  for (const [, block] of text.matchAll(DIALOGUE_PATTERN)) {
    if (QUOTE_MARKS.includes(block[0])) {
      expect(block.at(-1), `unclosed quotation in dialogue: ${block}`).toBe(
        block[0],
      )
    }
  }
}

describe('Shopkeeper dialogue markup', () => {
  it.each([1, 2, 3])('keeps quotes inside dialogue after %i talks', (talks) => {
    const game = gameInStore()
    let answer = ''
    for (let i = 0; i < talks; i++)
      answer = game.commandParser.parse('talk to shopkeeper')
    expect(answer).toContain('for sale')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('keeps the closed-shop reply inside dialogue', () => {
    const answer = gameInStore({ shopOpen: false }).commandParser.parse(
      'talk to shopkeeper',
    )
    expect(answer).toContain('Patches')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('keeps the matches hand-over inside dialogue', () => {
    const answer = gameInStore({ priestTalkedTo: true }).commandParser.parse(
      'talk to shopkeeper',
    )
    expect(answer).toContain('on the house')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('keeps the unknown-ware reply inside dialogue', () => {
    const answer = gameInStore().commandParser.parse(
      'buy lantern from shopkeeper',
    )
    expect(answer).toContain('for sale')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })

  it('reports a purchase without stray quotes', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    const answer = game.commandParser.parse('buy rope from shopkeeper')
    expect(answer).toContain('You bought a')
    expectQuotesInsideDialogue(answer)
  })

  it('keeps the refusal of a gift inside dialogue', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    const answer = game.commandParser.parse('give coin to shopkeeper')
    expect(answer).toContain('donations')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'shopkeeper')
  })
})

describe('Shopkeeper and the priest matches', () => {
  it('does not list the matches for sale', () => {
    const game = gameInStore()
    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('Rope')
    expect(answer).not.toContain('Matches')
    const wares = new GameController(game).getRoomWares().map((w) => w.name)
    expect(wares).toContain('rope')
    expect(wares).not.toContain('matches')
  })

  it('hands the matches over for the priest only once', () => {
    const game = gameInStore({ priestTalkedTo: true })
    game.commandParser.parse('talk to shopkeeper')

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).not.toContain('on the house')
    expect(
      game.state.inventory.filter((item) => item instanceof Matches),
    ).toHaveLength(1)
  })

  it.each([
    { handedOver: true, onTheHouse: false },
    { handedOver: false, onTheHouse: true },
  ])(
    'drops the matches from the wares of a save from before they left them ' +
      '(handed over: $handedOver)',
    ({ handedOver, onTheHouse }) => {
      const game = legacySave({ handedOver })

      const wares = new GameController(game).getRoomWares().map((w) => w.name)
      expect(wares).toContain('rope')
      expect(wares).not.toContain('matches')
      const answer = game.commandParser.parse('talk to shopkeeper')
      expect(answer.includes('on the house')).toBe(onTheHouse)
      expect(game.commandParser.parse('talk to shopkeeper')).not.toContain(
        'on the house',
      )
    },
  )

  it('keeps the matches for the priest instead of selling them', () => {
    const game = gameInStore()
    for (let i = 0; i < 4; i++) game.state.addItemToInventory(new Coin())

    const answer = game.commandParser.parse('buy matches from shopkeeper')

    expect(answer).toContain('priest')
    expect(answer).not.toContain('You bought')
    expectDialogueSpeaker(answer, 'shopkeeper')
  })
})

/** Number of coins Elior carries. */
function coins(game: Game): number {
  return game.state.inventory.filter((item) => item instanceof Coin).length
}

describe('Hemlock and his missing cat', () => {
  it('introduces himself by name and keeps the store shut for Patches', () => {
    const game = gameInStore({ shopOpen: false })
    const first = game.commandParser.parse('talk to shopkeeper')
    expect(first).toContain('[character_name]Hemlock[/character_name]')
    expect(first).toContain('[character_name]Patches[/character_name]')
    expect(first).not.toContain('for sale')
    const again = game.commandParser.parse('talk to shopkeeper')
    expect(again).not.toEqual(first)
    expect(again).toContain('[character_name]Patches[/character_name]')
    expectDialogueSpeaker(again, 'shopkeeper')
  })

  it('grumbles about the stopped caravans with Malakar as a byword on the first talk', () => {
    const game = gameInStore({ shopOpen: false })

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain(
      'And the caravans have stopped coming, now the king is ill and the ' +
        "roads are what they are. Malakar's luck, my father would have " +
        'called it.',
    )
    expectQuotesInsideDialogue(answer)
    expect(game.commandParser.parse('talk to shopkeeper')).not.toContain(
      "Malakar's luck",
    )
  })

  it('stays shut after Mira asks Elior to connect with nature', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    game.state.addItemToInventory(new Coin())
    expect(game.commandParser.parse('buy rope from shopkeeper')).not.toContain(
      'You bought',
    )
    expect(coins(game)).toBe(1)
  })

  it('rewards the return of Patches with a coin and reopens the store', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('[character_name]Hemlock[/character_name]')
    expectDialogueSpeaker(answer, 'shopkeeper')
    expectQuotesInsideDialogue(answer)
    expect(coins(game)).toBe(1)
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
    expect(
      game.state.currentRoom.characters.some((c) => c instanceof Patches),
    ).toBe(true)
    expect(game.commandParser.parse('talk to shopkeeper')).toContain('for sale')
    expect(game.commandParser.parse('talk to shopkeeper')).not.toContain(
      'You receive',
    )
    expect(coins(game)).toBe(1)
    expect(game.commandParser.parse('buy rope from shopkeeper')).toContain(
      'You bought',
    )
  })

  it('takes Patches back first when Elior tries to buy while carrying her', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('buy rope from shopkeeper')

    expect(answer).toContain('You found her')
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
    expect(coins(game)).toBe(1)
  })

  it('lets Patches purr from the counter once she is home', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.commandParser.parse('talk to shopkeeper')
    expect(game.commandParser.parse('talk to patches')).toContain('purr')
  })

  it('keeps the store open for a save that found the second hoe coin', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND, true)
    expect(game.commandParser.parse('talk to shopkeeper')).toContain('for sale')
  })

  it('gives no second reward to a save that found the second hoe coin', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('talk to shopkeeper')

    expectDialogueSpeaker(answer, 'shopkeeper')
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
    expect(coins(game)).toBe(0)
  })
})

describe('Shopkeeper restored from a save made before Patches', () => {
  it('still talks and sells when the save holds the old closedDialogue text', () => {
    const game = gameInStore({ shopOpen: false })
    const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
    if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
    Object.defineProperty(shopkeeper, 'closedDialogue', {
      value: 'Sorry, not open for business just yet.',
      enumerable: true,
      writable: true,
      configurable: true,
    })
    game.state.addItemToInventory(new Coin())
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
    const restored = loaded.state.currentRoom.getCharacterByName('shopkeeper')
    expect(Object.keys(restored ?? {})).toContain('closedDialogue')

    const closed = loaded.commandParser.parse('talk to shopkeeper')
    expect(closed).toContain('[character_name]Patches[/character_name]')
    expect(loaded.commandParser.parse('buy rope from shopkeeper')).toContain(
      'Patches',
    )

    loaded.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    expect(loaded.commandParser.parse('talk to shopkeeper')).toContain(
      'You found her',
    )
    expect(loaded.commandParser.parse('buy rope from shopkeeper')).toContain(
      'You bought',
    )
  })
})

describe('Shopkeeper when Patches stays with grandmother', () => {
  /** A game in the shut store after grandmother has kept Patches. */
  function gameAfterPatchesStayed(): Game {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
    return game
  }

  it('reopens the store and gives a rope and an apple instead of the coin', () => {
    const game = gameAfterPatchesStayed()

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('[character_name]grandmother[/character_name]')
    expectDialogueSpeaker(answer, 'shopkeeper')
    expect(game.state.hasItem('rope')).toBe(true)
    expect(game.state.hasItem('apple')).toBe(true)
    expect(game.state.inventory.some((i) => i instanceof Coin)).toBe(false)
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(false)
    expect(
      game.state.allRooms.GeneralStore.characters.some(
        (c) => c instanceof Patches,
      ),
    ).toBe(false)
  })

  it('gives the rope only once, then lists his wares', () => {
    const game = gameAfterPatchesStayed()
    game.commandParser.parse('talk to shopkeeper')

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('for sale')
    expect(game.state.inventory.filter((i) => i.name === 'rope')).toHaveLength(
      1,
    )
  })

  it('tells the news before selling anything', () => {
    const game = gameAfterPatchesStayed()

    game.commandParser.parse('buy rope from shopkeeper')

    expect(game.state.getStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED)).toBe(
      true,
    )
    expect(game.state.inventory.filter((i) => i.name === 'rope')).toHaveLength(
      1,
    )
  })
})
