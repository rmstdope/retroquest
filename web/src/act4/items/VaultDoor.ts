import { Item, type GameState, event } from '@/engine'
import {
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_VAULT_DOOR_OPENED,
} from '../Act4StoryFlags'

/** The door's look until the Shadow is answered. */
const DOOR_DARK =
  'A round door of pale stone, carved with the same runes as your amulet ' +
  'around the sigil of the Wardens of the Dawn. It has no handle and no ' +
  'keyhole.'

/** The door's look once the Shadow is answered. */
const DOOR_GLOWING =
  'A round door of pale stone, carved with the same runes as your amulet ' +
  'around the sigil of the Wardens of the Dawn. The runes glow faintly now, ' +
  'as if they are waiting.'

/**
 * The sealed door on the Memory Vault's east wall. It answers to the Ancient
 * Amulet once the Shadow has been answered, and then stays open for good.
 */
export class VaultDoor extends Item {
  constructor() {
    super({
      name: 'Door',
      description: DOOR_DARK,
      canBeCarried: false,
    })
  }

  /** Also answers to "sealed door". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'sealed door'
  }

  /** The door's look, which changes once the Shadow is answered. */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)) {
      return event(DOOR_GLOWING)
    }
    return event(DOOR_DARK)
  }

  /**
   * The Ancient Amulet (an Act 1 item, so recognised by name) opens the door,
   * but only once the Shadow is answered; any other item falls through.
   */
  override usedBy(gameState: GameState, item: Item): string | null {
    if (!item.answersTo('ancient amulet')) return null
    if (gameState.getStoryFlag(FLAG_ACT4_VAULT_DOOR_OPENED)) {
      return '[dim]The door already stands open.[/dim]'
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)) {
      return (
        '[failure]You hold the amulet to the door, but its runes stay dark. ' +
        'Something in this vault is not ready to let you in.[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_VAULT_DOOR_OPENED, true)
    return event(
      'The runes on the door wake to the runes on the amulet, and the stone ' +
        'rolls aside without a sound.',
    )
  }
}
