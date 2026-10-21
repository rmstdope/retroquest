import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TruthSight } from '../spells/TruthSight'
import { GuardiansChain } from '../items/GuardiansChain'
import { EchoStone } from '../items/EchoStone'
import { LoyaltyToken } from '../items/LoyaltyToken'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_ECHO_STONE_HEARD,
  FLAG_ACT4_KNIGHT_SEEN_THROUGH,
  FLAG_ACT4_CHAIN_GIVEN,
} from '../Act4StoryFlags'
import { KnightOfDespair } from './KnightOfDespair'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectMarkupWellFormed,
  expectQuestCompleted,
  expectSpellKnown,
  expectStoryFlag,
} from '@/testing/gameHelpers'

const SEEN =
  "Your sight sharpens, and the gloom peels away from the knight. His grey cloak is a traveller's, hooded and road-worn, and its clasp bears a twisted rune you know: the rune on the token that fouled Willowbrook's well, and the seal on the Secret Documents that cleared Sir Cedric's name. This is the cloaked stranger the villagers whispered about. Behind the visor, the knight is weeping."
const NOT_SEEN =
  'The word means nothing to a man you cannot truly see. He does not even turn his head.'
const NO_CHAIN =
  "You open your mouth, and the knight's despair rolls over you like cold water. The word dies in your throat. You could not say it with nothing between you and his sorrow."
const BLOCK = 'there is no way past him'

/** The hall's three sights, in the order of the golden path. */
const THREE_SIGHTS = [
  'cast truth sight on knight of despair',
  'cast truth sight on banners',
  'cast truth sight on echo stone',
]

/** The failure for one or two sights, and the knight's line then. */
const SOME_SEEN =
  'The word catches in your throat. You have seen something of him, but you do not yet know what he has done. There is more in this hall to see through.'
const SOMETHING_OF_ME =
  'So you see something of me. That is not the same as knowing me. Look around you, if you must know.'

/** A game in the Hall of Echoes with Truth Sight, the chain and the stone. */
function createGameInHall(): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms.HallOfEchoes
  game.state.learnSpell(new TruthSight())
  game.state.addItemToInventory(new GuardiansChain())
  game.state.addItemToInventory(new EchoStone())
  return game
}

describe('KnightOfDespair', () => {
  it('stands with his back to the door Elior came in by', () => {
    const knight = new KnightOfDespair()

    expect(knight.description).toContain(
      'He stands with his back to the door you came in by.',
    )
  })

  it('answers to knight, knight of despair and redeemed knight', () => {
    const knight = new KnightOfDespair()
    for (const name of ['knight', 'Knight of Despair', 'redeemed knight']) {
      expect(knight.answersTo(name)).toBe(true)
    }
    expect(knight.answersTo('captain')).toBe(false)
  })

  it('keeps today’s lines before Truth Sight and starts the quest', () => {
    const game = createGameInHall()
    const look = executeCommands(game, ['examine knight of despair'])
    expect(look).toContain('His visor is down')
    expectStoryFlag(game.state, FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED)
    const talk = executeCommands(game, ['talk to knight of despair'])
    expect(talk).toContain('Return when you have the truth.')
    expectDialogueSpeaker(talk, 'Knight of Despair')
  })

  it('starts the quest on the first talk in a game saved in the hall', () => {
    const game = createGameInHall()
    executeCommands(game, ['talk to knight'])
    expectStoryFlag(game.state, FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED)
  })

  it('is seen through by Truth Sight, once', () => {
    const game = createGameInHall()
    const cast = executeCommands(game, [
      'cast truth sight on knight of despair',
    ])
    expect(cast).toContain(SEEN)
    expectMarkupWellFormed(cast)
    expectStoryFlag(game.state, FLAG_ACT4_KNIGHT_SEEN_THROUGH)
    expect(
      executeCommands(game, ['cast truth sight on knight of despair']),
    ).toBe('[dim]You have already seen the knight as he truly is.[/dim]')
    expect(executeCommands(game, ['examine knight of despair'])).toContain(
      'The grey cloak, the twisted rune at its clasp, the tears behind the visor. The cloaked stranger from Willowbrook stands before you, and he knows you have seen him.',
    )
    const talk = executeCommands(game, ['talk to knight of despair'])
    expect(talk).toContain(SOMETHING_OF_ME)
    expectDialogueSpeaker(talk, 'Knight of Despair')
    executeCommands(game, THREE_SIGHTS.slice(1))
    expect(executeCommands(game, ['talk to knight of despair'])).toContain(
      'So you see me. Then you know what I am, and what I have done. There is no redemption for a man like me. Do not waste the word.',
    )
    expect(executeCommands(game, ['go east'])).toContain(BLOCK)
  })

  it('shows the banners and the Echo Stone in any order, once each', () => {
    const game = createGameInHall()
    expect(executeCommands(game, ['examine banners'])).toContain(
      'Something is stitched beneath the dirt.',
    )
    const stone = executeCommands(game, ['cast truth sight on echo stone'])
    expect(stone).toContain("It is the knight's voice.")
    expectMarkupWellFormed(stone)
    expect(executeCommands(game, ['cast truth sight on echo stone'])).toBe(
      "[dim]You have already heard the knight's voice in the stone.[/dim]",
    )
    const banners = executeCommands(game, ['cast truth sight on banner'])
    expect(banners).toContain("the gate company of King Alden's guard")
    expectMarkupWellFormed(banners)
    expect(executeCommands(game, ['cast truth sight on banners'])).toBe(
      '[dim]You have already seen the banners as they truly are.[/dim]',
    )
    expect(executeCommands(game, ['talk to knight'])).toContain(SOMETHING_OF_ME)
  })

  it('answers the Echo Stone in its niche as well as in the pack', () => {
    const game = createGameInHall()
    const stone = game.state.inventory.pop()
    if (stone) game.state.currentRoom.addItem(stone)
    expect(executeCommands(game, ['cast truth sight on echo stone'])).toContain(
      'Under the hall',
    )
  })

  it('catches the word in the throat with one or two sights, in any order', () => {
    const game = createGameInHall()
    executeCommands(game, [THREE_SIGHTS[1]])
    expect(executeCommands(game, ['say redemption to knight'])).toContain(
      SOME_SEEN,
    )
    executeCommands(game, [THREE_SIGHTS[2]])
    expect(executeCommands(game, ['say redemption to knight'])).toContain(
      SOME_SEEN,
    )
    executeCommands(game, [THREE_SIGHTS[0]])
    expect(executeCommands(game, ['say redemption to knight'])).toContain(
      NO_CHAIN,
    )
  })

  it('refuses the word until he is seen through and the chain is raised', () => {
    const game = createGameInHall()
    expect(executeCommands(game, ['say redemption to knight'])).toContain(
      NOT_SEEN,
    )
    executeCommands(game, THREE_SIGHTS)
    expect(executeCommands(game, ['say redemption to knight'])).toContain(
      NO_CHAIN,
    )
    expect(executeCommands(game, ['say hello to knight'])).toBe(
      '[dim]The knight does not answer.[/dim]',
    )
    expectStoryFlag(game.state, FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, false)
    expectItemInInventory(game.state, 'Echo Stone', true)
  })

  it('refuses the word with only the chain raised', () => {
    const game = createGameInHall()
    executeCommands(game, ["use guardian's chain"])
    expect(executeCommands(game, ['say redemption to knight'])).toContain(
      NOT_SEEN,
    )
  })

  for (const order of [
    ["use guardian's chain", ...THREE_SIGHTS],
    [...THREE_SIGHTS, "use guardian's chain"],
  ]) {
    it(`redeems him after ${order.join(' then ')}`, () => {
      const game = createGameInHall()
      executeCommands(game, order)
      const out = executeCommands(game, ['say redemption to knight'])
      const parts = [
        "You say the word, and the knight's despair breaks against the chain's light like a wave on stone. Slowly, he lifts his visor. The face beneath is grey and tired, and very human.",
        'You.',
        'Me.',
        'I was the stranger in Willowbrook. Malakar sent me for an amulet, and for the child it hid. It was my token that fouled your well.',
        'The night King Alden was taken, I paid the watch to look away. The captain of the watch was a good man. I made sure he was asleep. And I put my seal to the lie that shamed Sir Cedric.',
        'And when I saw what my master was doing to the king, I stopped believing he could be saved. That is all despair is. You have given me something to believe in again.',
        'Sir Cedric. I am sorry. I have no right to ask anything of you, so I will not.',
        'Sir Cedric does not move from the door.',
        'I heard you. That will have to be enough, for now.',
        "You received [item_name]Knight's Redemption[/item_name]!",
        "The Echo Stone grows warm in your pack. A new voice has joined the echoes inside it: the knight's own, speaking the truth at last.",
        "Redemption's Light",
        'Light that reminds a fallen soul of who it was.',
      ]
      let at = 0
      for (const part of parts) {
        const found = out.indexOf(part, at)
        expect(found, part).toBeGreaterThanOrEqual(at)
        at = found
      }
      expect(out.match(/\[character_name\]Knight of Despair/g)).toHaveLength(5)
      expectMarkupWellFormed(out)
      expectStoryFlag(game.state, FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)
      expectItemInInventory(game.state, "Knight's Redemption", true)
      expectItemInInventory(game.state, 'Enhanced Echo Stone', true)
      expectSpellKnown(game.state, 'redemptions_light', true)
      expectQuestCompleted(game.state, 'The Knight of Despair')
    })
  }

  it('shows him kneeling as the Redeemed Knight and opens the stair', () => {
    const game = createGameInHall()
    executeCommands(game, [
      "use guardian's chain",
      ...THREE_SIGHTS,
      'say redemption to knight',
    ])
    const hall = game.state.currentRoom.describe(game.state)
    expect(hall).toContain(
      'The echoes have softened to a murmur. By the stair to the east the knight kneels with his helm beside him, his grey cloak folded on the stone. Among the tattered banners, ghostly warriors still fight a battle that ended long ago.',
    )
    expect(hall).toContain('Redeemed Knight')
    expect(hall).toContain('east')
    for (const name of ['knight', 'knight of despair', 'redeemed knight']) {
      expect(executeCommands(game, [`examine ${name}`])).toContain(
        'He kneels by the stair, his helm beside him. Without the visor he looks like any tired soldier far from home.',
      )
    }
    const talk = executeCommands(game, ['talk to knight'])
    expect(talk).toContain(
      'I will wait here. If you come back down those stairs, I will know there is still hope.',
    )
    expectDialogueSpeaker(talk, 'Redeemed Knight')
    expect(executeCommands(game, ['say redemption to knight'])).toBe(
      '[dim]He has already found his way back. He bows his head to you.[/dim]',
    )
    expect(executeCommands(game, ['say hello to knight'])).toContain(
      'He has already found his way back',
    )
    executeCommands(game, ['go east'])
    expect(game.state.currentRoom.name).toBe('Tower of Shadows')
  })

  describe('with the Loyalty Token instead of the chain', () => {
    const GONE =
      "You open your mouth, and the knight's despair rolls over you like cold water. The word dies in your throat. You need something to shield you from it. The chain is gone with the captain, but you are not as alone as the knight would have you believe."
    const TOKEN_OPENING =
      "You say the word, and the knight's despair breaks against the warmth at your heart like a wave on stone. Slowly, he lifts his visor. The face beneath is grey and tired, and very human."

    function gameWithoutChain(): Game {
      const game = createGameInHall()
      game.state.removeItemFromInventory("Guardian's Chain")
      game.state.addItemToInventory(new LoyaltyToken())
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH, true)
      game.state.setStoryFlag(FLAG_ACT4_BANNERS_SEEN, true)
      game.state.setStoryFlag(FLAG_ACT4_ECHO_STONE_HEARD, true)
      game.state.setStoryFlag(FLAG_ACT4_CHAIN_GIVEN, true)
      return game
    }

    it('adds the nudge to the refusal once the chain is given away', () => {
      const game = gameWithoutChain()
      const answer = executeCommands(game, ['say redemption to knight'])
      expect(answer).toContain(GONE)
      expectMarkupWellFormed(answer)
      expect(
        game.state.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED),
      ).toBe(false)
    })

    it('redeems him with the token raised, with the token opening', () => {
      const game = gameWithoutChain()
      executeCommands(game, ['use loyalty token'])
      const answer = executeCommands(game, ['say redemption to knight'])
      expect(answer).toContain(TOKEN_OPENING)
      expect(answer).not.toContain("chain's light")
      expect(answer).toContain('Knight’s Redemption'.replace('’', "'"))
      expectStoryFlag(game.state, FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)
      expectMarkupWellFormed(answer)
    })

    it('loses the chain’s protection if it is given away after raising', () => {
      const game = createGameInHall()
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH, true)
      game.state.setStoryFlag(FLAG_ACT4_BANNERS_SEEN, true)
      game.state.setStoryFlag(FLAG_ACT4_ECHO_STONE_HEARD, true)
      executeCommands(game, ["use guardian's chain"])
      game.state.removeItemFromInventory("Guardian's Chain")
      game.state.setStoryFlag(FLAG_ACT4_CHAIN_GIVEN, true)
      expect(executeCommands(game, ['say redemption to knight'])).toContain(
        GONE,
      )
    })

    it('keeps the chain version when the chain is raised and kept', () => {
      const game = createGameInHall()
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH, true)
      game.state.setStoryFlag(FLAG_ACT4_BANNERS_SEEN, true)
      game.state.setStoryFlag(FLAG_ACT4_ECHO_STONE_HEARD, true)
      executeCommands(game, ["use guardian's chain"])
      const answer = executeCommands(game, ['say redemption to knight'])
      expect(answer).toContain("breaks against the chain's light")
    })

    it('gives today’s refusal alone when the chain is kept but not raised', () => {
      const game = createGameInHall()
      game.state.setStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH, true)
      game.state.setStoryFlag(FLAG_ACT4_BANNERS_SEEN, true)
      game.state.setStoryFlag(FLAG_ACT4_ECHO_STONE_HEARD, true)
      const answer = executeCommands(game, ['say redemption to knight'])
      expect(answer).toContain(NO_CHAIN)
      expect(answer).not.toContain('The chain is gone')
    })
  })
})
