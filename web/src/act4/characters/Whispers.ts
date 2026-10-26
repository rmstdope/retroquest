import {
  Character,
  type GameState,
  dialogue,
  effect,
  normaliseSpokenWord,
  type NameOptions,
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
    doing: 'is holding the gate',
    line: 'A knight does not leave his post. Mine is the threshold. Go on, lad.',
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
      'A small light flickers at the edge of your eye, and in your pack the ' +
      "crystalline pendant she gave you, Nyx's Token, is warm.",
  },
]

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
  /** Named by what they are, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
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

  /** They point at the way out: name one who stayed. */
  override talkTo(_gameState: GameState): string {
    return (
      'They do not answer you. They only say it again, closer: your ' +
      'friends have left you. No one is coming. Name one who stayed, if ' +
      'you can.'
    )
  }

  /** A friend's name is answered through the token; other words are swallowed. */
  override sayTo(gameState: GameState, words: string): string {
    const word = normaliseSpokenWord(words)
    const friend = FRIENDS.find((f) => f.words.includes(word))
    if (!friend) {
      if (word === 'grandmother') {
        return (
          effect(
            'You say it into the dark, and something in you steadies — but ' +
              'she is far from here, and the whispers know it.',
          ) + ' Name one who came with you to the gate.'
        )
      }
      return 'The whispers swallow the word. Name one who stayed, if you can.'
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
    const leadIn = friend.ownLeadIn ?? LEAD_INS[named]
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
