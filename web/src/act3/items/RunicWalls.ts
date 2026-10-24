import { Item, type GameState } from '@/engine'
import { ResonantChantRubbings } from './ResonantChantRubbings'
import { echoHeard, playEcho } from '../EchoNight'

/** Runic walls containing the Resonant Chant. */
export class RunicWalls extends Item {
  private rubbingsDiscovered = false

  constructor() {
    super({
      name: 'runic walls',
      description:
        'Ancient walls carved with mystical runes that describe a chant ' +
        'to quiet phantoms and wandering spirits.',
      canBeCarried: false,
      shortName: 'walls',
    })
  }

  /**
   * Reveal the Resonant Chant instructions and add rubbings to the room. A
   * second examine, if the echo has not been heard yet, plays it instead.
   */
  override examine(gameState: GameState): string {
    if (this.rubbingsDiscovered && !echoHeard(gameState)) {
      return playEcho(gameState)
    }
    // Add ResonantChantRubbings to the current room if not already discovered
    if (!this.rubbingsDiscovered) {
      gameState.currentRoom.addItem(new ResonantChantRubbings())
      this.rubbingsDiscovered = true
    }
    return (
      'The runes describe a chant to quiet the phantoms: ' +
      "'Let stillness echo, let silence bind.' You notice you could make " +
      'rubbings of these ancient symbols.'
    )
  }
}
