import { Character, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_ENHANCED_ECHO_STONE_ACQUIRED,
  FLAG_ACT4_GUARDIANS_CHAIN_RAISED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
  FLAG_ACT4_KNIGHT_SEEN_THROUGH,
  FLAG_ACT4_KNIGHTS_REDEMPTION_ACQUIRED,
} from '../Act4StoryFlags'
import { EchoStone } from '../items/EchoStone'
import { KnightsRedemption } from '../items/KnightsRedemption'
import { RedemptionsLight } from '../spells/RedemptionsLight'
import { GhostlyWarriors } from './GhostlyWarriors'
import {
  HALL_AFTER_REDEMPTION,
  HALL_WARRIORS_SENTENCE,
} from '../rooms/hallDescriptions'
import { normaliseSpokenWord } from '../spokenWord'

/** What the knight is called once he is redeemed. */
const REDEEMED_NAME = 'Redeemed Knight'

/** The four speeches of the confession, in order. */
const CONFESSION = [
  'I was the stranger in Willowbrook. Malakar sent me for an amulet, and for ' +
    'the child it hid. It was my token that fouled your well.',
  'The night King Alden was taken, I paid the watch to look away. The ' +
    'captain of the watch was a good man. I made sure he was asleep. And I ' +
    'put my seal to the lie that shamed Sir Cedric.',
  'And when I saw what my master was doing to the king, I stopped believing ' +
    'he could be saved. That is all despair is. You have given me something ' +
    'to believe in again.',
  'When you see Sir Cedric again, tell him the knight in grey is sorry. Tell ' +
    'him I will say it to his face, if he will let me.',
]

/**
 * The knight who blocks the stair to the Tower of Shadows. Truth Sight shows
 * him as he is; with the Guardian's Chain raised, the word "redemption"
 * redeems him, and he kneels in the hall as the Redeemed Knight.
 */
export class KnightOfDespair extends Character {
  constructor() {
    super({
      name: 'Knight of Despair',
      description:
        'A knight in tarnished armour, a shredded grey cloak hanging from his ' +
        'shoulders. His visor is down, and he does not move. When he speaks, ' +
        "his voice is hollow: 'Return when you have the truth.'",
    })
  }

  /** Also answers to "knight" and "redeemed knight", whatever his name is now. */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['knight', 'knight of despair', 'redeemed knight'].includes(
        name.toLowerCase(),
      )
    )
  }

  /** Truth Sight: shows him as he is (once); starts the quest like any meeting. */
  seeThrough(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH)) {
      return '[dim]You have already seen the knight as he truly is.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH, true)
    return event(
      'Your sight sharpens, and the gloom peels away from the knight. His ' +
        "grey cloak is a traveller's, hooded and road-worn, and its clasp " +
        'bears a twisted rune you know: the rune on the token that fouled ' +
        "Willowbrook's well, and the seal on the Secret Documents that " +
        "cleared Sir Cedric's name. This is the cloaked stranger the " +
        'villagers whispered about. Behind the visor, the knight is weeping.',
    )
  }

  /** The knight's look, which changes as he is seen through and redeemed. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)) {
      return event(
        'He kneels by the stair, his helm beside him. Without the visor he ' +
          'looks like any tired soldier far from home.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH)) {
      return event(
        'The grey cloak, the twisted rune at its clasp, the tears behind the ' +
          'visor. The cloaked stranger from Willowbrook stands before you, ' +
          'and he knows you have seen him.',
      )
    }
    return event(this.description)
  }

  /** What he says changes as he is seen through and redeemed. */
  override talkTo(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)) {
      return dialogue(
        this.name,
        'I will wait here. If you come back down those stairs, I will know ' +
          'there is still hope.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH)) {
      return dialogue(
        this.name,
        'So you see me. Then you know what I am, and what I have done. There ' +
          'is no redemption for a man like me. Do not waste the word.',
      )
    }
    return dialogue(
      this.name,
      'There is nothing you can say to me that I have not already told ' +
        'myself. Go. Return when you have the truth.',
    )
  }

  /** Only the word "redemption" works, and only once he is seen through and the chain raised. */
  override sayTo(gameState: GameState, words: string): string {
    gameState.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED)) {
      return '[dim]He has already found his way back. He bows his head to you.[/dim]'
    }
    const word = normaliseSpokenWord(words)
    if (word !== 'redemption') return '[dim]The knight does not answer.[/dim]'
    if (!gameState.getStoryFlag(FLAG_ACT4_KNIGHT_SEEN_THROUGH)) {
      return (
        '[failure]The word means nothing to a man you cannot truly see. He ' +
        'does not even turn his head.[/failure]'
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED)) {
      return (
        "[failure]You open your mouth, and the knight's despair rolls over " +
        'you like cold water. The word dies in your throat. You need ' +
        'something to shield you from it.[/failure]'
      )
    }
    return this.redeem(gameState)
  }

  /**
   * The redemption: the confession, then the rewards (the badge, the
   * enhanced stone, the spell), the open stair and the changed hall.
   */
  private redeem(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    gameState.setStoryFlag(FLAG_ACT4_KNIGHTS_REDEMPTION_ACQUIRED, true)
    const confession = CONFESSION.map((speech) => dialogue(this.name, speech))
    this.name = REDEEMED_NAME

    gameState.addItemToInventory(new KnightsRedemption())
    const spell = new RedemptionsLight()
    gameState.learnSpell(spell)

    const room = gameState.currentRoom
    room.description = HALL_AFTER_REDEMPTION + HALL_WARRIORS_SENTENCE
    room.addCharacter(new GhostlyWarriors())

    const lines = [
      event(
        "You say the word, and the knight's despair breaks against the " +
          "chain's light like a wave on stone. Slowly, he lifts his visor. " +
          'The face beneath is grey and tired, and very human.',
      ),
      ...confession,
      event("You received [item_name]Knight's Redemption[/item_name]!"),
    ]
    const stone = this.findEchoStone(gameState)
    if (stone) {
      stone.enhance()
      gameState.setStoryFlag(FLAG_ACT4_ENHANCED_ECHO_STONE_ACQUIRED, true)
      lines.push(
        event(
          'The Echo Stone grows warm in your pack. A new voice has joined ' +
            "the echoes inside it: the knight's own, speaking the truth at last.",
        ),
      )
    }
    lines.push(
      event(
        `You have learned the [spell_name]${spell.name}[/spell_name] spell! ` +
          spell.description,
      ),
    )
    return lines.join('\n')
  }

  /** The Echo Stone, carried or left in any room. */
  private findEchoStone(gameState: GameState): EchoStone | null {
    const items = [
      ...gameState.inventory,
      ...Object.values(gameState.allRooms).flatMap((room) => room.items),
    ]
    return items.find((item) => item instanceof EchoStone) ?? null
  }
}
