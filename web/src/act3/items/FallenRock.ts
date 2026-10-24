import { Item, clue, type GameState } from '@/engine'
import { FLAG_ACT3_MINERS_RESCUE_STARTED } from '../Act3StoryFlags'
import { CEDRIC_BRACES, CEDRIC_WEDGE, cedricAdds } from '../CedricLines'
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
      'The collapse ' +
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
        return clue(
          'You heft the braces toward the rock and stop. You do not ' +
            'yet know where the ceiling sags, and one wrong push would bring ' +
            'the whole gallery down.',
        )
      }
      if (!this.collapseStabilized) {
        this.collapseStabilized = true
        gameState.removeItemFromInventory(other.name)
        return (
          'The reinforced braces wedge under the sagging ceiling and steady ' +
          'the collapse. The immediate danger of ' +
          'further cave-in is reduced, but the braces need to be secured ' +
          'before you can safely clear the passage.' +
          cedricAdds(gameState, CEDRIC_BRACES)
        )
      }
      return (
        '[dim]The braces are already in place, holding the ceiling ' +
        'steady.[/dim]'
      )
    }

    if (other instanceof SupportStraps) {
      if (!this.collapseStabilized) {
        return clue(
          'The straps have nothing to hold. There is no brace under ' +
            'the ceiling for them to bind.',
        )
      }
      if (!this.strapsSecured) {
        this.strapsSecured = true
        gameState.removeItemFromInventory(other.name)
        return (
          'The support straps bind the reinforced braces securely, so they ' +
          'can withstand the pressure when the debris is cleared. The structure is now stable ' +
          'enough for the final excavation.'
        )
      }
      return '[dim]The straps are already securing the braces.[/dim]'
    }

    if (other instanceof WedgeBlocks) {
      if (!this.strapsSecured) {
        return clue(
          'The braces stand loose under the ceiling. One blow of a ' +
            'wedge and they would walk out from under it.',
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
        return (
          'The wedge blocks bite into the cracks and free the blocked ' +
          'passage. The fallen rock crumbles away, clearing ' +
          'the path forward. Through the newly opened gap, you see the ' +
          'trapped miners emerging from the depths!' +
          cedricAdds(gameState, CEDRIC_WEDGE)
        )
      }
      return '[dim]The wedge blocks are already securing the passage.[/dim]'
    }
    return "[failure]That won't help with the fallen rock.[/failure]"
  }
}
