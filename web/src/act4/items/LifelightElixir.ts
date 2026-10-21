import { Item, type Character, type GameState, event } from '@/engine'
import { Malakar } from '../characters/Malakar'
import { CrystalPrison } from './CrystalPrison'
import { Wound } from './Wound'

/** What the elixir says when it is aimed at anything but the two targets. */
const WRONG_TARGET =
  "[failure]The elixir is for the king's prison, or for Malakar's wound.[/failure]"

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
        'A shimmering elixir that seems to contain liquid starlight. ' +
        'Threads of crystal clarity, phoenix flame, and draconic essence ' +
        'swirl within the glass vial.',
      canBeCarried: true,
      shortName: 'elixir',
    })
  }

  /** The elixir's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }

  /** The Malakar of the current room, if the player stands in his chamber. */
  private static malakarHere(gameState: GameState): Malakar | undefined {
    return gameState.currentRoom.characters.find(
      (character) => character instanceof Malakar,
    )
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
    const refusal = malakar.elixirRefusal(gameState)
    if (refusal) return refusal
    if (other instanceof CrystalPrison) return other.breakWith(gameState)
    if (other instanceof Wound) return malakar.receiveElixir(gameState)
    return WRONG_TARGET
  }

  /** On Malakar it heals him; on anyone else here it is refused. */
  override useOnCharacter(gameState: GameState, target: Character): string {
    const malakar = LifelightElixir.malakarHere(gameState)
    if (!malakar) return super.useOnCharacter(gameState, target)
    const refusal = malakar.elixirRefusal(gameState)
    if (refusal) return refusal
    if (target instanceof Malakar) return target.receiveElixir(gameState)
    return WRONG_TARGET
  }
}
