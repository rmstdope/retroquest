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
        'Broken stone fills the gallery to the roof, and the way east is ' +
        'gone under it. Put your ear to it and you hear, faintly, someone ' +
        'tapping: three knocks, a wait, three knocks.',
      shortName: 'rock',
      canBeCarried: false,
    })
  }

  /** Examine the fallen rock to understand the situation. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED, true)
    return (
      'Loose stones hang over the pile, and the ceiling sags above them. ' +
      'Behind it the tapping goes on. Pull one stone now and the roof comes ' +
      'with it: it needs holding up first.'
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
          'The wedge blocks bite into the cracks, and the pile gives way. ' +
          'Through the gap, grey with dust, the miners come out one at a ' +
          'time, blinking at your light.' +
          cedricAdds(gameState, CEDRIC_WEDGE)
        )
      }
      return '[dim]The wedge blocks are already securing the passage.[/dim]'
    }
    return "[failure]That won't help with the fallen rock.[/failure]"
  }
}
