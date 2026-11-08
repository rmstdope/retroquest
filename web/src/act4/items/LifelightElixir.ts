import { Item, type Character, type GameState, clue } from '@/engine'
import {
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from '../Act4StoryFlags'
import { KingAlden } from '../characters/KingAlden'
import { Malakar } from '../characters/Malakar'
import { CrystalPrison } from './CrystalPrison'
import { Wound } from './Wound'

/** What the elixir says when it is aimed at anything but the two targets. */
const WRONG_TARGET = clue(
  "The elixir is for the king's prison, or for Malakar's wound.",
)

/**
 * What the elixir says when it is aimed at the king's prison before Malakar
 * has been answered: the answer is about the prison, not Malakar's reach.
 */
const PRISON_NOT_YET = clue(
  'You hold the vial to the crystal. It is cold, and the king inside ' +
    'does not stir. Not yet.',
)

/**
 * The Lifelight Elixir Elior carries through Act IV (Act III's elixir, made
 * again for this act). It can be used once, in the Throne Chamber: on the
 * king's prison to free him, or on Malakar or his wound to heal him.
 */
export class LifelightElixir extends Item {
  constructor() {
    super({
      name: 'Lifelight Elixir',
      description:
        'A small glass vial the colour of first light. Something moves in ' +
        'it: a white glint, a thread of flame, a dark shimmer like a scale ' +
        'turning. Mira made it from the three relics.',
      canBeCarried: true,
      shortName: 'elixir',
    })
  }

  /** Give a save made before the Act IV wording review the current description. */
  override refreshSavedText(): void {
    this.description = new LifelightElixir().description
  }

  /** The elixir's look. */
  override examine(_gameState: GameState): string {
    return this.description
  }

  /** The Malakar of the current room, if the player stands in his chamber. */
  private static malakarHere(gameState: GameState): Malakar | undefined {
    return gameState.currentRoom.characters.find(
      (character) => character instanceof Malakar,
    )
  }

  /**
   * Why the elixir cannot be used on its target yet, or null. Aimed at the
   * prison or the king before the refrain, it answers about the prison;
   * otherwise Malakar's refusal stands.
   */
  private static refusal(
    malakar: Malakar,
    gameState: GameState,
    atPrison: boolean,
  ): string | null {
    if (
      atPrison &&
      !gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID) &&
      !gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)
    ) {
      return PRISON_NOT_YET
    }
    return malakar.elixirRefusal(gameState)
  }

  /** Used alone in the Throne Chamber it is held to the choice's rules. */
  override use(gameState: GameState): string {
    const malakar = LifelightElixir.malakarHere(gameState)
    if (!malakar) return super.use(gameState)
    return malakar.elixirRefusal(gameState) ?? WRONG_TARGET
  }

  /** On the prison it frees the king; on the wound it heals Malakar. */
  override useWith(gameState: GameState, other: Item): string {
    const malakar = LifelightElixir.malakarHere(gameState)
    if (!malakar) return super.useWith(gameState, other)
    const refusal = LifelightElixir.refusal(
      malakar,
      gameState,
      other instanceof CrystalPrison,
    )
    if (refusal) return refusal
    if (other instanceof CrystalPrison) {
      return other.breakWith(gameState)
    }
    if (other instanceof Wound) return malakar.receiveElixir(gameState)
    return WRONG_TARGET
  }

  /** On Malakar it heals him; on anyone else here it is refused. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    const malakar = LifelightElixir.malakarHere(gameState)
    if (!malakar) return super.useOnCharacter(gameState, target)
    const refusal = LifelightElixir.refusal(
      malakar,
      gameState,
      target instanceof KingAlden,
    )
    if (refusal) return refusal
    if (target instanceof Malakar) return target.receiveElixir(gameState)
    return WRONG_TARGET
  }
}
