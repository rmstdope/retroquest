import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED } from '../Act3StoryFlags'
import { BindingResin } from './BindingResin'
import { BrassMirrorSegment } from './BrassMirrorSegment'

/**
 * An empty socket on the terraces. The mount can be examined to reveal a hidden
 * Brass Mirror Segment once, accepts segments and resin via useWith, and supports
 * a mend operation to finalize repairs.
 */
export class MirrorMount extends Item {
  private installed = false
  /** Whether this mount has already revealed its hidden segment. */
  private segmentRevealed = false
  /** Whether binding resin has been applied after installation. */
  private resinApplied = false

  constructor() {
    super({
      name: 'Mirror Mount',
      description:
        'A brass-and-stone mount fixed into the terrace socket. It needs a ' +
        'brass segment and binding resin to secure and repair the mirror face.',
      shortName: 'mirror mount',
      canBeCarried: false,
    })
  }

  /**
   * Allow use with a BrassMirrorSegment to install it into the mount (requires
   * four segments in inventory; consumes four), or with BindingResin afterwards.
   */
  override useWith(gameState: GameState, other: Item): string {
    // If the player uses binding resin on the mount, handle it here
    if (other instanceof BindingResin) {
      if (!this.installed) {
        return (
          '[failure]There is nothing to bind yet — prepare the mount with ' +
          'the mirror segments first.[/failure]'
        )
      }
      if (this.resinApplied) {
        return '[dim]Binding resin has already been applied to this mount.[/dim]'
      }
      // Remove one resin from inventory
      const resinName = new BindingResin().name
      gameState.removeItemFromInventory(resinName, 1)
      this.resinApplied = true
      return (
        '[success]You apply the binding resin carefully around the seams; ' +
        'the brass segments sit firmer and the joints set.[/success]'
      )
    }

    if (!(other instanceof BrassMirrorSegment)) {
      return (
        `[failure]You can't use the [item_name]${this.name}[/item_name] with ` +
        `the [item_name]${other.name}[/item_name].[/failure]`
      )
    }

    // Requirement: player must have at least 4 brass mirror segments total
    const segName = new BrassMirrorSegment().name
    if (gameState.getItemCount(segName) < 4) {
      return (
        '[failure]You need more brass mirror segments in your pack before ' +
        'you can install them into the terrace mounts.[/failure]'
      )
    }

    // Remove four segments from the player's inventory
    gameState.removeItemFromInventory(segName, 4)

    // Mark this mount as installed; resin still needs to be applied before mend
    this.installed = true

    return (
      '[success]With a careful, ringing press you seat the brass segments and ' +
      'secure their alignment. The terrace mount accepts the fittings.[/success]'
    )
  }

  /**
   * Finalize mirror repairs across the terraces and set the Mirrors of
   * Emberlight completion flag when the mount is installed and resin applied.
   */
  mend(gameState: GameState): string {
    if (!this.installed) {
      return (
        '[failure]This mount has not yet been prepared with the brass segments; ' +
        'there is nothing to mend.[/failure]'
      )
    }

    // Require binding resin to have been applied before final mending
    if (!this.resinApplied) {
      return (
        '[failure]The mirror segments are seated but still loose. You should ' +
        'apply Binding Resin to the mount before attempting the final mend.[/failure]'
      )
    }

    // Set the completion flag; idempotent
    gameState.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)
    return (
      '[success]A whispered mend gathers in your hands and the mirrors ' +
      'answer — seams knit, polish brightens, and the whole face hums. ' +
      "When the sun's beams strike the great mirror they are coaxed and " +
      'folded together until they pour from the terraces as a single, ' +
      'piercing ray. The light lances into the mountainside, strikes a ' +
      'hidden trigger, and a narrow passage grinds open to the east.[/success]'
    )
  }

  /** Examine the mount and reveal a brass segment hidden in the sand (once). */
  override examine(gameState: GameState): string {
    if (this.segmentRevealed) {
      return super.examine(gameState)
    }
    const segment = new BrassMirrorSegment()
    gameState.currentRoom.addItem(segment)
    this.segmentRevealed = true
    return (
      '[event]You sift the ash and grit beneath the mount and find a ' +
      `[item_name]${segment.name}[/item_name]. It lies half-buried ` +
      'in the sand and has been added to the terrace.[/event]'
    )
  }
}
