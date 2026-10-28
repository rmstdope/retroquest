import {
  Character,
  type GameState,
  dialogue,
  effect,
  saysAnyOf,
  type NameOptions,
  nameInSentence as nameReading,
} from '@/engine'
import {
  FLAG_ACT4_TOWER_STAIR_OPEN,
  FLAG_ACT4_WHISPERS_CEDRIC_NAMED,
  FLAG_ACT4_WHISPERS_MIRA_NAMED,
  FLAG_ACT4_WHISPERS_NYX_NAMED,
} from '../Act4StoryFlags'

/** The Loyalty Token's name, which must be in the pack for a name to be heard. */
const TOKEN_NAME = 'Loyalty Token'

/** One friend who can be named to the whispers. */
interface Friend {
  /** The name the friend is shown under. */
  name: string
  /** The spoken words that name the friend, normalised. */
  words: string[]
  /** The story flag set once the friend is named. */
  flag: string
  /** "his" or "her", for the no-token line. */
  pronoun: string
  /** "him" or "her", for the repeat line. */
  object: string
  /** What the friend is doing, for the repeat line. */
  doing: string
  /** The friend's line through the token. */
  line: string
  /** The narrated lead-in that always goes with this friend, if any. */
  ownLeadIn?: string
  /** The item that must be carried for the friend's own lead-in to be true. */
  ownLeadInNeeds?: string
}

const FRIENDS: Friend[] = [
  {
    name: 'Mira',
    words: ['mira'],
    flag: FLAG_ACT4_WHISPERS_MIRA_NAMED,
    pronoun: 'her',
    object: 'her',
    doing: 'is holding the gate',
    line: "I'm at the gate, Elior. I said I'd hold it, and I'm holding it.",
  },
  {
    name: 'Sir Cedric',
    words: ['cedric', 'sir cedric'],
    flag: FLAG_ACT4_WHISPERS_CEDRIC_NAMED,
    pronoun: 'his',
    object: 'him',
    doing: 'is in the hall below',
    line: 'I am in the hall below you, Elior. I have not left. Go on up.',
  },
  {
    name: 'Nyx',
    words: ['nyx'],
    flag: FLAG_ACT4_WHISPERS_NYX_NAMED,
    pronoun: 'her',
    object: 'her',
    doing: 'is keeping close',
    line: "Left? I'm right here. I never was anywhere else.",
    ownLeadIn:
      'The token warms against your palm. A small light flickers at the edge ' +
      'of your eye, and in your pack the crystalline pendant she gave you, ' +
      "Nyx's Token, is warm too.",
    ownLeadInNeeds: "Nyx's Token",
  },
]

/** What the whispers make of Elior naming himself, the answer of the sea. */
const MYSELF_WORDS = ['myself', 'me', 'elior']

/** The lead-ins for the first and second name said, whoever it is. */
const LEAD_INS = [
  'The token warms against your palm, and the whispers falter.',
  'The token warms again. The whispers draw back from the stair.',
]

/**
 * The whispers on the stair of the Tower of Shadows. They say Elior's friends
 * have left him; the answer is to name the friends who stayed, with the
 * Loyalty Token in the pack. The count of names lives in story flags, so it
 * survives a save at any point; the third name opens the stair and the
 * whispers leave the room.
 */
export class Whispers extends Character {
  /**
   * Named by what they are, so it reads "the …" and, a group and not a title,
   * stays lower case mid-sentence (see `nameInSentence`).
   */
  override nameInSentence(options?: NameOptions): string {
    return nameReading('character', this.name.toLowerCase(), {
      ...options,
      common: true,
    })
  }

  /** Several of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

  constructor() {
    super({
      name: 'Whispers',
      description:
        'Voices without mouths, thick on the stair, saying the same thing ' +
        'again and again.',
    })
  }

  /** They dare Elior to do the one thing that answers them: name one who stayed. */
  override talkTo(_gameState: GameState): string {
    return (
      'They do not answer you. They only say it again, closer: your ' +
      'friends have left you. No one is coming. Name one who stayed. You ' +
      'cannot.'
    )
  }

  /**
   * A friend's name, alone or in a sentence, is answered through the token;
   * a sentence naming several answers the first not yet named. Grandmother
   * and Elior himself get taunts of their own; other words are swallowed.
   */
  override sayTo(gameState: GameState, words: string): string {
    const mentioned = FRIENDS.filter((f) => saysAnyOf(words, f.words))
    const friend =
      mentioned.find((f) => !gameState.getStoryFlag(f.flag)) ?? mentioned[0]
    if (!friend) {
      if (saysAnyOf(words, ['grandmother'])) {
        return (
          effect(
            'You say it into the dark, and something in you steadies — but ' +
              'she is far from here, and the whispers know it.',
          ) + ' She did not come to the gate, they say. Who did? No one.'
        )
      }
      if (saysAnyOf(words, MYSELF_WORDS)) {
        return (
          'The whispers like that answer. Yes, they say: you, and only you, ' +
          'alone on a stair.'
        )
      }
      return (
        'The whispers swallow the word and go on: no one stayed. Name one, ' +
        'if you can.'
      )
    }
    if (!gameState.hasItem(TOKEN_NAME)) {
      return (
        effect(`You say ${friend.pronoun} name into the dark.`) +
        ' Nothing answers but ' +
        'the whispers. Your hand closes on nothing, where the token used ' +
        'to be.'
      )
    }
    if (gameState.getStoryFlag(friend.flag)) {
      return (
        `The token is still warm from ${friend.object}. ${friend.name} ` +
        `${friend.doing}; you know that now. The whispers want someone ` +
        'else.'
      )
    }
    const named = FRIENDS.filter((f) => gameState.getStoryFlag(f.flag)).length
    gameState.setStoryFlag(friend.flag, true)
    const ownLeadIn =
      friend.ownLeadInNeeds && !gameState.hasItem(friend.ownLeadInNeeds)
        ? undefined
        : friend.ownLeadIn
    const leadIn = ownLeadIn ?? LEAD_INS[named]
    const parts = [
      ...(leadIn ? [leadIn] : []),
      dialogue(friend.name, friend.line),
    ]
    if (named === FRIENDS.length - 1) {
      gameState.setStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN, true)
      gameState.currentRoom.characters =
        gameState.currentRoom.characters.filter(
          (character) => character !== this,
        )
      parts.push(
        '[success]The whispers have nothing left to say. They thin like ' +
          'smoke, and the stair above lies open.[/success]',
      )
    }
    return parts.join('\n')
  }
}
