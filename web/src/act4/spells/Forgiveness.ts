import {
  Spell,
  clue,
  dialogue,
  type Character,
  type GameState,
  type Item,
} from '@/engine'
import { Grandmother } from '../characters/Grandmother'
import { KingAlden } from '../characters/KingAlden'
import { Malakar } from '../characters/Malakar'
import { Mira } from '../characters/Mira'
import { MiraAtTheGate } from '../characters/MiraAtTheGate'
import { SirCedric } from '../characters/SirCedric'
import { SirCedricInTheHall } from '../characters/SirCedricInTheHall'
import { endingPlayed } from '../endings'
import { Wound } from '../items/Wound'

/** What the spell says when it is aimed at Malakar. */
const ALREADY_FORGIVEN = clue(
  'Malakar is already forgiven. It is the wound that needs it.',
)

/** Mira closes his hand on it, here or at the gate. */
const MIRA_ANSWER =
  'She closes your hand over the light before it reaches her.\n' +
  dialogue('Mira', 'Not with a spell, Elior. Me you can just tell.')

/** Sir Cedric will do his own forgiving, here or in the hall. */
const CEDRIC_ANSWER =
  'The light stops short of him.\n' +
  dialogue(
    'Sir Cedric',
    'I did not ask for that. What I forgive, I forgive on my own feet.',
  )

/** Grandmother puts it away, as she does most things. */
const GRANDMOTHER_ANSWER =
  'The light settles on her apron and goes out.\n' +
  dialogue('Grandmother', 'Oh, put that away, dear. I made my own bed.')

/** The king, asleep in the crystal. */
const KING_ASLEEP =
  'The light settles on the crystal and slides away. The king does not stir.'

/** The king, awake once the wound is closed. */
const KING_AWAKE = dialogue(
  'King Alden',
  'Keep it, farmer. A king is forgiven by his kingdom, or not at all.',
)

/**
 * Learned from saying "forgiveness" to the healed Malakar. Cast on the wound
 * it plays the Redemption ending.
 */
export class Forgiveness extends Spell {
  constructor() {
    super({
      id: 'forgiveness',
      name: 'Forgiveness',
      description: 'Magic that lets a wound close because it is forgiven.',
    })
  }

  /** On the wound it closes it (Redemption); elsewhere nothing answers it, as usual. */
  override castOnItem(gameState: GameState, target: Item): string {
    if (target instanceof Wound) return target.forgive(gameState)
    return super.castOnItem(gameState, target)
  }

  /** Malakar is already forgiven; those Elior loves each answer it their own way. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof Malakar) return ALREADY_FORGIVEN
    if (target instanceof Mira || target instanceof MiraAtTheGate) {
      return MIRA_ANSWER
    }
    if (target instanceof SirCedric || target instanceof SirCedricInTheHall) {
      return CEDRIC_ANSWER
    }
    if (target instanceof Grandmother) return GRANDMOTHER_ANSWER
    if (target instanceof KingAlden) {
      return endingPlayed(gameState) ? KING_AWAKE : KING_ASLEEP
    }
    return super.castOnCharacter(gameState, target)
  }
}
