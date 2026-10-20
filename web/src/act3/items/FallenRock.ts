import { Item, event, type GameState } from '@/engine'
import { FLAG_ACT3_MINERS_RESCUE_STARTED } from '../Act3StoryFlags'
import { Miners } from '../characters/Miners'
import { ReinforcedBraces } from './ReinforcedBraces'
import { SupportStraps } from './SupportStraps'
import { WedgeBlocks } from './WedgeBlocks'

/** A mass of collapsed stone blocking the galleries. */
export class FallenRock extends Item {
  private collapseStabilized = false
  private strapsSecured = false
  private passageFreed = false

  constructor() {
    super({
      name: 'fallen rock',
      description:
        'A massive pile of stone and debris blocks the passage, sealing off ' +
        'any further venturing to the east. Muffled voices echo from beyond ' +
        'the collapse—panicked calls for help and the desperate scraping of ' +
        'hands against stone. The sounds confirm your worst fears: people are ' +
        'trapped behind this barrier, their fate hanging in the balance of ' +
        'whether you can find a way to safely clear the obstruction.',
      shortName: 'rock',
      canBeCarried: false,
    })
  }

  /** Examine the fallen rock to understand the situation. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED, true)
    return (
      event('You examine the massive pile of fallen rock.') +
      ' The collapse ' +
      'appears unstable, with loose stones precariously balanced above. You can ' +
      'hear desperate voices calling from beyond the barrier—miners are definitely ' +
      'trapped on the other side. The ceiling sags dangerously, but with the right ' +
      'reinforcement, you might be able to stabilize the collapse and then clear ' +
      'a safe passage through.'
    )
  }

  /** Handle rescue item usage on the fallen rock. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof ReinforcedBraces) {
      if (!gameState.getStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED)) {
        return (
          '[failure]You should examine the fallen rock first to understand ' +
          'the situation before attempting anything.[/failure]'
        )
      }
      if (!this.collapseStabilized) {
        this.collapseStabilized = true
        gameState.removeItemFromInventory(other.name)
        return event(
          'You wedge the reinforced braces under the sagging ' +
            'ceiling, stabilizing the collapse. The immediate danger of ' +
            'further cave-in is reduced, but the braces need to be secured ' +
            'before you can safely clear the passage.',
        )
      }
      return (
        '[dim]The braces are already in place, holding the ceiling ' +
        'steady.[/dim]'
      )
    }

    if (other instanceof SupportStraps) {
      if (!this.collapseStabilized) {
        return (
          '[failure]You need to stabilize the collapse with braces before ' +
          'securing them with straps.[/failure]'
        )
      }
      if (!this.strapsSecured) {
        this.strapsSecured = true
        gameState.removeItemFromInventory(other.name)
        return event(
          'You bind the reinforced braces securely with the ' +
            'support straps, ensuring they can withstand the pressure ' +
            'when the debris is cleared. The structure is now stable ' +
            'enough for the final excavation.',
        )
      }
      return '[dim]The straps are already securing the braces.[/dim]'
    }

    if (other instanceof WedgeBlocks) {
      if (!this.strapsSecured) {
        return (
          '[failure]The braces need to be secured with support straps ' +
          'before you can safely clear the passage.[/failure]'
        )
      }
      if (!this.passageFreed) {
        this.passageFreed = true
        gameState.removeItemFromInventory(other.name)
        // Remove the fallen rock from the current room since passage is cleared
        gameState.currentRoom.removeItem('fallen rock')
        // Add the miners to the room now that they can be reached
        const miners = new Miners()
        gameState.currentRoom.addCharacter(miners)
        return event(
          'You hammer the wedge blocks into the cracks, freeing ' +
            'the blocked passage. The fallen rock crumbles away, clearing ' +
            'the path forward. Through the newly opened gap, you see the ' +
            'trapped miners emerging from the depths!',
        )
      }
      return '[dim]The wedge blocks are already securing the passage.[/dim]'
    }
    return "[failure]That won't help with the fallen rock.[/failure]"
  }
}
