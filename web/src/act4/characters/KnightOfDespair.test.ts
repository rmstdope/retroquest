import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { TruthSight } from '../spells/TruthSight'
import { GuardiansChain } from '../items/GuardiansChain'
import { EchoStone } from '../items/EchoStone'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
  FLAG_ACT4_KNIGHT_SEEN_THROUGH,
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
    expect(talk).toContain(
      'So you see me. Then you know what I am, and what I have done. There is no redemption for a man like me. Do not waste the word.',
    )
    expectDialogueSpeaker(talk, 'Knight of Despair')
    expect(executeCommands(game, ['go east'])).toContain(BLOCK)
  })

  it('refuses the word until he is seen through and the chain is raised', () => {
    const game = createGameInHall()
    expect(executeCommands(game, ['say redemption to knight'])).toContain(
      NOT_SEEN,
    )
    executeCommands(game, ['cast truth sight on knight of despair'])
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
    ["use guardian's chain", 'cast truth sight on knight of despair'],
    ['cast truth sight on knight of despair', "use guardian's chain"],
  ]) {
    it(`redeems him after ${order.join(' then ')}`, () => {
      const game = createGameInHall()
      executeCommands(game, order)
      const out = executeCommands(game, ['say redemption to knight'])
      const parts = [
        "You say the word, and the knight's despair breaks against the chain's light like a wave on stone. Slowly, he lifts his visor. The face beneath is grey and tired, and very human.",
        'I was the stranger in Willowbrook. Malakar sent me for an amulet, and for the child it hid. It was my token that fouled your well.',
        'The night King Alden was taken, I paid the watch to look away, and I put my seal to the lie that shamed Sir Cedric.',
        'And when I saw what my master was doing to the king, I stopped believing he could be saved. That is all despair is. You have given me something to believe in again.',
        'When you see Sir Cedric again, tell him the knight in grey is sorry. Tell him I will say it to his face, if he will let me.',
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
      expect(out.match(/\[character_name\]Knight of Despair/g)).toHaveLength(4)
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
      'cast truth sight on knight of despair',
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
})
