import { describe, it, expect } from 'vitest'
import { Game, GameController, findMarkupProblems, type Item } from '@/engine'
import { Act1 } from '../Act1'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_MET_HEMLOCK,
  FLAG_HEMLOCK_HEARD_PATCHES_STAYED,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_PRIEST_TALKED_TO,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
  TRIGGER_PATCHES_RETURNS,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { Stick } from '../items/Stick'
import { Rope } from '../items/Rope'
import { Bread } from '../items/Bread'
import { Matches } from '../items/Matches'
import { Mechanism } from '../items/Mechanism'
import { RuneToken } from '../items/RuneToken'
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
    expect(answer).toContain('[item_name]sword[/item_name]')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'Hemlock')
  })

  it('keeps the closed-shop reply inside dialogue', () => {
    const answer = gameInStore({ shopOpen: false }).commandParser.parse(
      'talk to shopkeeper',
    )
    expect(answer).toContain('Patches')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'Hemlock')
  })

  it('keeps the matches hand-over inside dialogue', () => {
    const answer = gameInStore({ priestTalkedTo: true }).commandParser.parse(
      'talk to shopkeeper',
    )
    expect(answer).toContain('on the house')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'Hemlock')
  })

  it('keeps the unknown-ware reply inside dialogue', () => {
    const answer = gameInStore().commandParser.parse(
      'buy lantern from shopkeeper',
    )
    expect(answer).toContain('Not something I carry, lad.')
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'Hemlock')
  })

  it('reports a purchase without stray quotes', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    const answer = game.commandParser.parse('buy rope from shopkeeper')
    expect(answer).toContain('You receive a [item_name]rope[/item_name]')
    expectQuotesInsideDialogue(answer)
  })

  it('keeps the refusal of a gift inside dialogue', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Stick())
    const answer = game.commandParser.parse('give stick to shopkeeper')
    expect(answer).toContain("I don't take them in")
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'Hemlock')
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
    expect(answer).not.toContain('is yours for')
    expectDialogueSpeaker(answer, 'Hemlock')
  })
})

describe("Hemlock and the priest's errand while the store is shut (rq-l4ud)", () => {
  const ERRAND = "I'll see to him the day"

  it('answers the errand when first met after the priest asked', () => {
    const game = gameInStore({ shopOpen: false, priestTalkedTo: true })

    const answer = game.commandParser.parse('talk to hemlock')

    expect(answer).toContain(ERRAND)
    expectQuotesInsideDialogue(answer)
    expect(game.state.inventory.some((i) => i instanceof Matches)).toBe(false)
  })

  it('answers the errand when asked again while the store stays shut', () => {
    const game = gameInStore({ shopOpen: false, priestTalkedTo: true })
    game.commandParser.parse('talk to hemlock')

    const answer = game.commandParser.parse('talk to hemlock')

    expect(answer).toContain(ERRAND)
    expectDialogueSpeaker(answer, 'Hemlock')
  })

  it('says nothing of the errand before the priest has asked', () => {
    const game = gameInStore({ shopOpen: false })

    expect(game.commandParser.parse('talk to hemlock')).not.toContain(ERRAND)
    expect(game.commandParser.parse('take matches')).not.toContain(ERRAND)
  })

  it('refuses the matches with the errand, not the priest, as the reason', () => {
    const game = gameInStore({ shopOpen: false, priestTalkedTo: true })

    const answer = game.commandParser.parse('take matches')

    expect(answer).toContain(ERRAND)
    expect(answer).not.toContain('whenever he asks')
    expectQuotesInsideDialogue(answer)
    expect(game.state.inventory.some((i) => i instanceof Matches)).toBe(false)
  })

  it('keeps the errand out of the refusal while Elior carries Patches', () => {
    const game = gameInStore({ shopOpen: false, priestTalkedTo: true })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    expect(game.commandParser.parse('take matches')).not.toContain(ERRAND)
  })

  it('gives the errand after his byword on the first meeting', () => {
    const game = gameInStore({ shopOpen: false, priestTalkedTo: true })

    const answer = game.commandParser.parse('talk to hemlock')

    expect(answer.indexOf(ERRAND)).toBeGreaterThan(
      answer.indexOf('raps the counter'),
    )
  })

  it('hands the matches over once Patches is home', () => {
    const game = gameInStore({ shopOpen: false, priestTalkedTo: true })
    game.commandParser.parse('talk to hemlock')
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)

    const answer = game.commandParser.parse('talk to hemlock')

    expect(answer).toContain('on the house')
    expect(answer).not.toContain(ERRAND)
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
    expect(first).not.toContain('[item_name]sword[/item_name]')
    const again = game.commandParser.parse('talk to shopkeeper')
    expect(again).not.toEqual(first)
    expect(again).toContain('[character_name]Patches[/character_name]')
    expectDialogueSpeaker(again, 'Hemlock')
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
      'You receive a [item_name]rope[/item_name]',
    )
    expect(coins(game)).toBe(1)
  })

  it('rewards the return of Patches with a coin and reopens the store', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('[character_name]Hemlock[/character_name]')
    expectDialogueSpeaker(answer, 'Hemlock')
    expectQuotesInsideDialogue(answer)
    expect(coins(game)).toBe(1)
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
    expect(
      game.state.currentRoom.characters.some((c) => c instanceof Patches),
    ).toBe(true)
    expect(game.commandParser.parse('talk to shopkeeper')).toContain(
      '[item_name]sword[/item_name]',
    )
    expect(game.commandParser.parse('talk to shopkeeper')).not.toContain(
      'You receive',
    )
    expect(coins(game)).toBe(1)
    expect(game.commandParser.parse('buy rope from shopkeeper')).toContain(
      'You receive a [item_name]rope[/item_name]',
    )
  })

  it('speaks of his promised reward only when Elior heard of it (rq-btb2)', () => {
    const unheard = gameInStore({ shopOpen: false })
    unheard.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    const firstMeeting = unheard.commandParser.parse('talk to shopkeeper')
    expect(firstMeeting).not.toContain('promised')
    expect(coins(unheard)).toBe(1)

    const told = gameInStore({ shopOpen: false })
    told.state.setStoryFlag(FLAG_MET_HEMLOCK, true)
    told.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    expect(told.commandParser.parse('talk to shopkeeper')).toContain(
      'the reward I promised',
    )
  })

  it('speaks of his promised reward when Elior read the notice but never met him', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.currentRoom = game.state.allRooms.VillageSquare
    game.commandParser.parse('examine notice')
    game.state.currentRoom = game.state.allRooms.GeneralStore
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    expect(game.commandParser.parse('talk to shopkeeper')).toContain(
      'the reward I promised',
    )
  })

  it("fires the store's patches-returns sound trigger as Patches comes home, once", () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    expect(game.state.takeFiredSounds()).toEqual([])

    game.commandParser.parse('talk to shopkeeper')

    expect(game.state.takeFiredSounds()).toEqual([
      { roomKey: 'GeneralStore', trigger: TRIGGER_PATCHES_RETURNS },
    ])
    game.commandParser.parse('talk to shopkeeper')
    expect(game.state.takeFiredSounds()).toEqual([])
  })

  it('takes Patches back first when Elior tries to buy while carrying her', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('buy rope from shopkeeper')

    expect(answer).toContain('You found her')
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
    expect(coins(game)).toBe(1)
  })

  it('takes Patches back when Elior gives her to him while carrying her', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('give patches to shopkeeper')

    expect(answer).not.toContain("You don't have")
    expect(answer).toContain('You found her')
    expectDialogueSpeaker(answer, 'Hemlock')
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
    expect(coins(game)).toBe(1)
  })

  it('names his absence when Elior gives Patches away from the store', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.currentRoom = game.state.allRooms.AbandonedShed

    const answer = game.commandParser.parse('give patches to shopkeeper')

    expect(answer).toBe(
      "[failure]There is no character named 'Shopkeeper' here.[/failure]",
    )
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(false)
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
    expect(game.commandParser.parse('talk to shopkeeper')).toContain(
      '[item_name]sword[/item_name]',
    )
  })

  it('gives no second reward to a save that found the second hoe coin', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('talk to shopkeeper')

    expectDialogueSpeaker(answer, 'Hemlock')
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
      'You receive a [item_name]rope[/item_name]',
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
    expectDialogueSpeaker(answer, 'Hemlock')
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

  it('speaks of the reward as news when Elior never heard of it (rq-btb2)', () => {
    const unheard = gameAfterPatchesStayed()
    expect(unheard.commandParser.parse('talk to shopkeeper')).not.toContain(
      'The reward was for',
    )

    const told = gameAfterPatchesStayed()
    told.state.setStoryFlag(FLAG_MET_HEMLOCK, true)
    expect(told.commandParser.parse('talk to shopkeeper')).toContain(
      'The reward was for bringing her home',
    )
  })

  it('speaks of the reward as known when Elior read the notice but never met him', () => {
    const game = gameAfterPatchesStayed()
    game.state.currentRoom = game.state.allRooms.VillageSquare
    game.commandParser.parse('examine notice')
    game.state.currentRoom = game.state.allRooms.GeneralStore
    expect(game.commandParser.parse('talk to shopkeeper')).toContain(
      'The reward was for bringing her home',
    )
  })

  it('gives the rope only once, then lists his wares', () => {
    const game = gameAfterPatchesStayed()
    game.commandParser.parse('talk to shopkeeper')

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain("[item_name]Sword[/item_name]'s five")
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

describe('Hemlock has only the one rope (rq-28te)', () => {
  const LAST_ROPE =
    "That was my last good rope, lad. There'll be no more till spring."

  it('sells the rope once, keeps the second coin and drops it from his prices', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('buy rope from shopkeeper')

    const second = game.commandParser.parse('buy rope from shopkeeper')
    const prices = game.commandParser.parse('talk to shopkeeper')

    expect(second).toContain(LAST_ROPE)
    expectDialogueSpeaker(second, 'Hemlock')
    expect(game.state.inventory.filter((i) => i instanceof Coin)).toHaveLength(
      1,
    )
    expect(prices).toContain("[item_name]Sword[/item_name]'s five")
    expect(prices).not.toContain("[item_name]Rope[/item_name]'s")
  })

  it('sells no rope after giving one when Patches stays with grandmother', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('talk to shopkeeper')

    const answer = game.commandParser.parse('buy rope from shopkeeper')

    expect(answer).toContain(LAST_ROPE)
    expect(game.state.inventory.filter((i) => i instanceof Coin)).toHaveLength(
      1,
    )
  })

  it('remembers the sold rope through a save and load', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('buy rope from shopkeeper')
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(loaded.commandParser.parse('buy rope from shopkeeper')).toContain(
      LAST_ROPE,
    )
  })

  it.each([
    ['still holds the rope', false],
    ['has jammed the mechanism with it', true],
  ])(
    'counts the rope as sold in a save made before the rule when Elior %s',
    (_case, jammed) => {
      const game = gameInStore()
      game.state.addItemToInventory(new Coin())
      game.state.addItemToInventory(new Coin())
      game.commandParser.parse('buy rope from shopkeeper')
      if (jammed) {
        game.state.removeItemFromInventory('rope')
        const mechanism = Object.values(game.state.allRooms)
          .flatMap((room) => room.items)
          .find((item) => item instanceof Mechanism)
        if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
        mechanism.repaired = true
      }
      const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
      if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
      shopkeeper.wares.rope = { item: new Rope(), price: 1 }
      const loaded = new Game([new Act1()])
      expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

      expect(loaded.commandParser.parse('buy rope from shopkeeper')).toContain(
        LAST_ROPE,
      )
    },
  )

  it('takes the rope from the wares of a save that has it sold but still listed (rq-8xc9)', () => {
    const game = gameInStore()
    const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
    if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
    Reflect.set(shopkeeper, 'ropeSold', true)
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(
      new GameController(loaded).getRoomWares().map((ware) => ware.name),
    ).not.toContain('rope')
    expect(loaded.commandParser.parse('buy rope from shopkeeper')).toContain(
      LAST_ROPE,
    )
  })

  /** The store's own rope: the one on the shelf, not one Elior dropped. */
  function shelfRopes(game: Game): Item[] {
    return game.state.allRooms.GeneralStore.items.filter(
      (item) => item instanceof Rope && !item.canBeCarried,
    )
  }

  it('takes the rope off his shelf once it is sold (rq-kkhw)', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('buy rope from shopkeeper')

    expect(shelfRopes(game)).toHaveLength(0)
    expect(game.commandParser.parse('take rope')).not.toContain('merchandise')
  })

  it('takes the rope off his shelf once he gives it when Patches stays (rq-kkhw)', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
    game.commandParser.parse('talk to shopkeeper')

    expect(shelfRopes(game)).toHaveLength(0)
    expect(game.commandParser.parse('take rope')).not.toContain('merchandise')
  })

  it.each([
    ['sold', false],
    ['given when Patches stayed', true],
  ])(
    'clears the shelf in a save that still shows the rope he has %s (rq-kkhw)',
    (_case, gift) => {
      const game = gameInStore({ shopOpen: !gift })
      if (gift) {
        game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
        game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
        game.commandParser.parse('talk to shopkeeper')
      } else {
        game.state.addItemToInventory(new Coin())
        game.commandParser.parse('buy rope from shopkeeper')
      }
      if (shelfRopes(game).length === 0) {
        game.state.allRooms.GeneralStore.items.unshift(new Rope())
      }
      const loaded = new Game([new Act1()])
      expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

      expect(shelfRopes(loaded)).toHaveLength(0)
      expect(loaded.state.hasItem('rope')).toBe(true)
    },
  )

  it('still says apples come with every sale once the rope is gone (rq-kkhw)', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('buy rope from shopkeeper')

    expect(game.commandParser.parse('buy apple from shopkeeper')).toContain(
      "There's one with everything you buy.",
    )
  })

  it('keeps the rope on his shelf while it is still for sale (rq-kkhw)', () => {
    const game = gameInStore()
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(shelfRopes(loaded)).toHaveLength(1)
    expect(loaded.commandParser.parse('take rope')).toContain('merchandise')
  })

  it('still sells the rope in a save made before the rule with no rope bought', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
    if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
    Reflect.set(shopkeeper, 'ropeSold', undefined)
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    loaded.commandParser.parse('buy rope from shopkeeper')

    expect(loaded.state.hasItem('rope')).toBe(true)
  })
})

describe('no text offers the rope once it is gone (rq-8xc9)', () => {
  /** Every text of the store that can mention rope, asked in the store. */
  function ropeTexts(game: Game): string[] {
    const talks = [0, 1, 2, 3].map(() =>
      game.commandParser.parse('talk to shopkeeper'),
    )
    return [
      ...talks,
      game.commandParser.parse('examine shelves'),
      new GameController(game).getRoomDescription(),
    ]
  }

  function expectNoRopeOffered(game: Game): void {
    const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
    if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
    expect(shopkeeper.ropeGone()).toBe(true)
    for (const text of ropeTexts(game)) {
      expect(text).not.toMatch(/\brope\b/i)
    }
    expect(game.commandParser.parse('buy rope from shopkeeper')).toContain(
      'last good rope',
    )
  }

  it('is offered while he still has it', () => {
    const game = gameInStore()
    const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
    if (!(shopkeeper instanceof Shopkeeper)) throw new Error('no shopkeeper')
    expect(shopkeeper.ropeGone()).toBe(false)
    expect(ropeTexts(game).join('\n')).toMatch(/rope/i)
  })

  it('is mentioned by none of them once it is sold, before and after a save', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())
    game.commandParser.parse('buy rope from shopkeeper')
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    expectNoRopeOffered(loaded)
  })

  it('is mentioned by none of them once he has given it when Patches stayed', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
    game.commandParser.parse('talk to shopkeeper')

    expectNoRopeOffered(game)
  })
})

describe('Shopkeeper named as Hemlock, a proper name', () => {
  const HEMLOCK = '[character_name]Hemlock[/character_name]'

  it('refuses a gift as "Hemlock"', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Stick())
    const answer = game.commandParser.parse('give stick to shopkeeper')
    expect(
      answer.startsWith(`${HEMLOCK} chuckles and pushes it back`),
      answer,
    ).toBe(true)
  })

  it('stops every unpaid ware as "Hemlock"', () => {
    const wares = ['rope', 'apple', 'matches', 'sword', 'armor']
    const failures = wares.filter(
      (ware) =>
        !gameInStore()
          .commandParser.parse(`take ${ware}`)
          .includes(`${HEMLOCK} quickly steps over.`),
    )
    expect(failures).toEqual([])
  })

  it.each([
    ['talks while the store is shut', { shopOpen: false }],
    ['lists the wares', {}],
    ['hands over the priest matches', { priestTalkedTo: true }],
  ])('never reads "shopkeeper" when he %s', (_case, options) => {
    const answer =
      gameInStore(options).commandParser.parse('talk to shopkeeper')
    expect(answer).toContain(HEMLOCK)
    expect(answer).not.toContain('[character_name]shopkeeper')
    expect(answer).not.toContain('[character_name]Shopkeeper')
  })

  it('reads "Hemlock\'s hand" when Patches comes home', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    const answer = game.commandParser.parse('talk to shopkeeper')
    expect(answer).toContain(`butts her head against ${HEMLOCK}'s hand`)
  })

  it('opens with "Hemlock" when grandmother has kept Patches', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
    const answer = game.commandParser.parse('talk to shopkeeper')
    expect(answer.startsWith(`${HEMLOCK} hurries over`), answer).toBe(true)
  })

  it('shakes his head as "Hemlock" once Elior has met him', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_MET_HEMLOCK, true)
    const answer = game.commandParser.parse('talk to shopkeeper')
    expect(answer.startsWith(`${HEMLOCK} shakes his head before`), answer).toBe(
      true,
    )
  })
})

describe('the shopkeeper answers to his name', () => {
  it('answers to Hemlock before he has introduced himself', () => {
    const game = gameInStore({ shopOpen: false })

    const talk = game.commandParser.parse('talk to hemlock')

    expect(talk).not.toContain('There is no character')
    expectDialogueSpeaker(talk, 'Hemlock')
  })

  it.each(['old hemlock', 'old man hemlock'])(
    'answers to "%s", as the game names him',
    (name) => {
      const game = gameInStore()
      expect(game.commandParser.parse(`talk to ${name}`)).not.toContain(
        'There is no character',
      )
    },
  )

  it('reaches Hemlock by name once he has introduced himself', () => {
    const game = gameInStore({ shopOpen: false })
    game.commandParser.parse('talk to shopkeeper')
    game.state.addItemToInventory(new Bread())

    const talk = game.commandParser.parse('talk to hemlock')
    const give = game.commandParser.parse('give bread to hemlock')

    expect(talk).not.toContain('There is no character')
    expectDialogueSpeaker(talk, 'Hemlock')
    expect(give).not.toContain('There is no character')
    expect(give).toContain("I don't take them in")
  })
})

describe('Hemlock and the byword', () => {
  it('knocks on the counter after naming Malakar', () => {
    const game = gameInStore({ shopOpen: false })

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain(
      "Malakar's luck, my father would have called it.[/dialogue] " +
        'He raps the counter twice with his knuckles.',
    )
  })
})

describe('Hemlock and the rune token (rq-hkep)', () => {
  it("answers with his own gesture, not Tilda's knock, and without his byword", () => {
    const game = gameInStore()
    game.state.addItemToInventory(new RuneToken())

    const answer = game.commandParser.parse('give rune token to hemlock')

    expect(answer).toContain("I'll not have that on my counter, lad.")
    expect(answer).toContain('edge of his ledger')
    expect(answer.toLowerCase()).not.toContain('knock')
    expect(answer).not.toContain('my father would have called it')
    expect(answer).not.toContain("Malakar's luck")
    expectQuotesInsideDialogue(answer)
    expectDialogueSpeaker(answer, 'Hemlock')
  })
})

describe('Hemlock and the byword when first met with Patches (rq-12mz)', () => {
  const BYWORD =
    "Malakar's luck, my father would have called it.[/dialogue] " +
    'He raps the counter twice with his knuckles.'

  it('says the byword when Elior first meets him carrying Patches', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('You found her!')
    expect(answer).toContain(
      '[dialogue]And the caravans have stopped coming, now the king is ill',
    )
    expect(answer).toContain(BYWORD)
    expectQuotesInsideDialogue(answer)
    expect(game.commandParser.parse('talk to shopkeeper')).not.toContain(
      "Malakar's luck",
    )
  })

  it('says the byword when he is first met after Patches stayed with grandmother', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('sent word')
    expect(answer).toContain(BYWORD)
    expectQuotesInsideDialogue(answer)
  })

  it('does not repeat the byword in the reunion once he has said it', () => {
    const game = gameInStore({ shopOpen: false })
    expect(game.commandParser.parse('talk to shopkeeper')).toContain(
      "Malakar's luck",
    )
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('You found her!')
    expect(answer).not.toContain("Malakar's luck")
  })
})

describe('Hemlock idle lines', () => {
  it('opens his wares with no narration that only introduces them (rq-i2iu)', () => {
    const game = gameInStore()

    const answer = game.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('[item_name]sword[/item_name]')
    expectDialogueSpeaker(answer, 'Hemlock')
    expect(answer).not.toMatch(/:\s*\[dialogue\]/)
  })
})

describe('Hemlock, named from the first moment', () => {
  it('is Hemlock before Elior has spoken to him, and answers to his old names', () => {
    const game = gameInStore()
    const keeper = game.state.currentRoom.characters[0]

    expect(keeper.name).toBe('Hemlock')
    for (const word of [
      'shopkeeper',
      'hemlock',
      'old hemlock',
      'old man hemlock',
    ]) {
      expect(keeper.answersTo(word)).toBe(true)
    }
  })

  it('is named in narration, not by his trade, in the shut and open store', () => {
    for (const shopOpen of [false, true]) {
      const game = gameInStore({ shopOpen })
      game.state.addItemToInventory(new Stick())
      const answer = game.commandParser.parse('give stick to shopkeeper')
      expect(answer).toContain('[character_name]Hemlock[/character_name]')
      expect(answer).not.toMatch(/shopkeeper/i)
    }
    const game = gameInStore()
    game.state.addItemToInventory(new Stick())
    expect(game.commandParser.parse('give stick to hemlock')).toContain(
      '[character_name]Hemlock[/character_name] chuckles and pushes it',
    )
  })
})

describe('Shopkeeper price sentence', () => {
  it.each([0, 1, 2])(
    'says the prices in one bubble after opening line %i',
    (turn) => {
      const game = gameInStore()
      let answer = ''
      for (let i = 0; i <= turn; i++)
        answer = game.commandParser.parse('talk to shopkeeper')

      expect(answer).toContain("[item_name]sword[/item_name]'s five")
      expect(answer).toContain("[item_name]armor[/item_name]'s ten")
      expect(answer).toContain("[item_name]Rope[/item_name]'s a")
      expect(answer).toContain('[item_name]apple[/item_name]')
      expect(answer.match(/\[dialogue\]/g)).toHaveLength(1)
      expect(answer).not.toContain('- ')
      expect(answer).not.toContain('for sale')
      expect(answer.split('\n')).toHaveLength(2)
    },
  )
})

describe('Hemlock speaks to Elior as a neighbour (rq-m3fy)', () => {
  it('talks of Patches as a cat Elior knows, without introducing himself', () => {
    const game = gameInStore({ shopOpen: false })

    const answer = game.commandParser.parse('talk to hemlock')

    expect(answer).toContain('I was watching for her.')
    expect(answer).toContain('on this counter often enough')
    expect(answer).not.toContain("'s the name")
    expect(answer).not.toContain('this is my store')
    expect(answer).toContain('She was last seen near the old well.')
  })
})

describe('Hemlock repeat talks keep their wording (rq-m3fy)', () => {
  it('only asks after Patches the second time, and keeps the new first line out of an open store', () => {
    const shut = gameInStore({ shopOpen: false })
    shut.commandParser.parse('talk to hemlock')
    const again = shut.commandParser.parse('talk to hemlock')
    expect(again).toContain('No sign of')
    expect(again).not.toContain('I was watching for her')

    const open = gameInStore({ shopOpen: true })
    expect(open.commandParser.parse('talk to hemlock')).not.toContain(
      'I was watching for her',
    )
  })
})

describe('The store tells one story about its apples (rq-03s1)', () => {
  const APPLE_RULE = "There's one with everything you buy."

  it('refuses a taken apple by pointing at the free one, not at buying it', () => {
    const answer = gameInStore().commandParser.parse('take apple')

    expect(answer).toContain(APPLE_RULE)
    expect(answer).not.toContain('buy it proper-like')
    expect(tookApple(answer)).toBe(false)
  })

  it('does not sell an apple, and says why, instead of saying he does not carry one', () => {
    const game = gameInStore()
    game.state.addItemToInventory(new Coin())

    const answer = game.commandParser.parse('buy apple from shopkeeper')

    expect(answer).toContain(APPLE_RULE)
    expect(answer).not.toContain('Not something I carry')
    expect(game.state.hasItem('apple')).toBe(false)
    expect(coins(game)).toBe(1)
    expectDialogueSpeaker(answer, 'Hemlock')
  })

  it.each(['take apples', 'buy apples from shopkeeper'])(
    'tells the same story when Elior asks for apples: %s',
    (command) => {
      const game = gameInStore()
      game.state.addItemToInventory(new Coin())

      const answer = game.commandParser.parse(command)

      expect(answer).toContain(APPLE_RULE)
      expect(game.state.hasItem('apple')).toBe(false)
    },
  )
})

/** Whether a take answer reports the apple as picked up. */
function tookApple(answer: string): boolean {
  return answer.includes('It is crisp and cold')
}

describe('Hemlock answers the name of his cat', () => {
  const STOCK = "You'd best ask someone with more time than I have"

  it('talks of Patches as home on the counter once she is back', () => {
    const game = gameInStore()
    game.state.setStoryFlag(FLAG_MET_HEMLOCK, true)

    const answer = game.commandParser.parse('say patches to hemlock')

    expect(answer).not.toContain(STOCK)
    expect(answer).toContain('not stirred off that counter since')
    expectDialogueSpeaker(answer, 'Hemlock')
  })

  it('talks of Patches by the hearth once she stays with grandmother', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
    game.state.setStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED, true)
    game.state.setStoryFlag(FLAG_MET_HEMLOCK, true)

    const answer = game.commandParser.parse('say patches to hemlock')

    expect(answer).not.toContain(STOCK)
    expect(answer).toContain('warm spot by the hearth')
    expectDialogueSpeaker(answer, 'Hemlock')
    expect(findMarkupProblems(answer)).toEqual([])
  })

  it('asks after Patches while she is still missing', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_MET_HEMLOCK, true)

    const answer = game.commandParser.parse('say patches to hemlock')

    expect(answer).not.toContain(STOCK)
    expect(answer).toContain("You've not seen her, have you, lad?")
    expectDialogueSpeaker(answer, 'Hemlock')
    expect(findMarkupProblems(answer)).toEqual([])
  })

  it('meets Elior over her name the first time, as speaking to him does', () => {
    const game = gameInStore({ shopOpen: false })

    const answer = game.commandParser.parse('say patches to hemlock')

    expect(answer).toContain('Gone for days now')
    expect(game.state.getStoryFlag(FLAG_MET_HEMLOCK)).toBe(true)
    expect(game.commandParser.parse('talk to hemlock')).not.toContain(
      'Gone for days now',
    )
  })

  it('gives the news of her staying when he has not yet told it', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)

    const answer = game.commandParser.parse('say patches to hemlock')

    expect(answer).toContain('sent word, lad.')
    expect(game.state.getStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED)).toBe(
      true,
    )
  })

  it('takes her home when Elior says her name with her in his arms', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)

    const answer = game.commandParser.parse('say patches to hemlock')

    expect(answer).toContain('You found her!')
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(true)
  })
})

describe('Hemlock answers the healer by name', () => {
  const STOCK = "You'd best ask someone with more time than I have"

  it('speaks of Mira as a man who knows her, not with his stock reply', () => {
    const game = gameInStore()
    game.state.setStoryFlag(FLAG_MET_HEMLOCK, true)

    const answer = game.commandParser.parse('say mira to hemlock')

    expect(answer).not.toContain(STOCK)
    expect(answer).not.toContain("I've a shop to mind")
    expect(answer).toContain('set my wrist')
    expectDialogueSpeaker(answer, 'Hemlock')
    expect(findMarkupProblems(answer)).toEqual([])
  })

  it('answers her name the same while the store is shut', () => {
    const game = gameInStore({ shopOpen: false })
    game.state.setStoryFlag(FLAG_MET_HEMLOCK, true)

    const answer = game.commandParser.parse('say mira to hemlock')

    expect(answer).toContain('set my wrist')
  })

  it('answers her name before they have met, leaving the meeting to a talk', () => {
    const game = gameInStore({ shopOpen: false })

    expect(game.commandParser.parse('say mira to hemlock')).toContain(
      'set my wrist',
    )
    expect(game.state.getStoryFlag(FLAG_MET_HEMLOCK)).toBe(false)
    expect(game.commandParser.parse('talk to hemlock')).toContain(
      'Gone for days now',
    )
  })

  it('speaks his current lines after loading a save that holds the old ones', () => {
    const game = gameInStore()
    const shopkeeper = game.state.currentRoom.getCharacterByName('shopkeeper')
    Object.defineProperty(shopkeeper, 'dialogueOptions', {
      value: ['Welcome to my humble store!'],
      enumerable: true,
      writable: true,
      configurable: true,
    })
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const answer = loaded.commandParser.parse('talk to shopkeeper')

    expect(answer).toContain('Only store in Willowbrook')
    expect(answer).not.toContain('humble store')
  })
})
