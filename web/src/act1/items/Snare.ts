import { Item, type GameState, remembered } from '@/engine'
import { FLAG_FOX_KIT_FREED, VIRTUE_MERCY } from '../Act1StoryFlags'
import { SharpKnife } from './SharpKnife'
import { refreshRoomDescription } from '../refreshRoomDescription'

/** What the player sees while the kit is caught. */
const KIT_DESCRIPTION =
  'A fox kit, no bigger than a cat, one hind leg caught fast in the wire. ' +
  'It watches you and does not struggle.'

/** What the player sees of the freed snare. */
const SNARE_CUT =
  "In the alcove lies a poacher's [item_name]snare[/item_name], cut and empty."

/** The line when the snare is tried without a blade. */
const NEED_BLADE =
  "The wire is pulled tight around the kit's leg, too tight for fingers."

/**
 * A poacher's snare in the Forest Path alcove, found once the vines are cut,
 * with a fox kit caught in it. Cutting it with the sharp knife frees the kit
 * and records the mercy virtue; the cut, empty snare stays in the alcove. The
 * snare also answers to `fox` and `kit`.
 */
export class Snare extends Item {
  /** Whether the kit has been cut free. */
  freed = false

  constructor() {
    super({
      name: 'snare',
      description: KIT_DESCRIPTION,
    })
  }

  /** The snare answers to its name and to `fox` and `kit`. */
  override answersTo(name: string): boolean {
    const wanted = name.toLowerCase()
    return super.answersTo(name) || wanted === 'fox' || wanted === 'kit'
  }

  /** The kit while it is caught; the cut, empty snare afterwards. */
  override examine(_gameState: GameState): string {
    return this.freed ? SNARE_CUT : KIT_DESCRIPTION
  }

  /** While the kit is caught, taking the snare needs a blade. */
  override preventPickup(): string {
    return this.freed ? super.preventPickup() : NEED_BLADE
  }

  /** While the kit is caught, using the snare by hand needs a blade. */
  override use(gameState: GameState): string {
    return this.freed ? super.use(gameState) : NEED_BLADE
  }

  /** While the kit is caught, opening the snare by hand needs a blade. */
  override open(gameState: GameState): string {
    return this.freed ? super.open(gameState) : NEED_BLADE
  }

  /**
   * Cut the kit free with the sharp knife: the kit bolts and the mercy virtue
   * is recorded, once. Cutting again says the snare is already cut.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (!(other instanceof SharpKnife)) return super.useWith(gameState, other)
    if (this.freed) {
      return 'The snare is already cut. There is nothing left in it to free.'
    }
    this.freed = true
    gameState.setStoryFlag(FLAG_FOX_KIT_FREED, true)
    gameState.addVirtue(VIRTUE_MERCY)
    refreshRoomDescription(gameState)
    return (
      'You kneel and saw through the wire, slow and careful. The moment it ' +
      'gives, the fox kit twists free, stares at you for one heartbeat, and ' +
      'bolts into the undergrowth.\n' +
      remembered('Mercy')
    )
  }
}
