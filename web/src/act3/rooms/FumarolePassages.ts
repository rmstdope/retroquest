import { Room, event } from '@/engine'
import type { Exits, GameState } from '@/engine'
import {
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
} from '../Act3StoryFlags'
import { VentStone } from '../items/VentStone'
import type { HeatWardMix } from '../items/HeatWardMix'
import { PhoenixGuardian } from '../characters/PhoenixGuardian'
import { CEDRIC_HEAT_WARD, cedricAdds } from '../CedricLines'

/** Narrow tunnels exhaling rhythmic heat like a great sleeping bellows. */
export class FumarolePassages extends Room {
  /** How many vent stones have been installed/calibrated here. */
  ventCalibrations = 0

  constructor() {
    super({
      name: 'Fumarole Passages',
      description:
        'Narrow tunnels exhale a rhythmic, breath-like heat; stone vents chuff ' +
        'and sigh as if the mountain itself sleeps and dreams. Curtains of ' +
        'steam veil the low passages, and the air tastes faintly of sulfur ' +
        'and warm metal. Here and there a vent hisses sparks that glass the ' +
        'rock into smoky, translucent streaks, while the floor bears the ' +
        'pale scars of old fittings—tiny holes and rubbed brass where mounts ' +
        'were once bolted. Each step sends a warm gust that carries a distant ' +
        'clink of metal and the steady, low sigh of fumaroles farther below.',
      // Multiple vent stones so players can perform the three required
      // calibrations during the Breath of the Mountain side quest.
      items: [new VentStone(), new VentStone(), new VentStone()],
      characters: [new PhoenixGuardian()],
      exits: { south: 'PhoenixCrater', west: 'MirrorTerraces' },
    })
  }

  /**
   * Called when a VentStone is used in this room. Tracks calibrations.
   *
   * After three calibrations the vents are considered synchronized and the
   * Breath of the Mountain quest can be progressed by applying the heat ward.
   */
  calibrateWithStone(gameState: GameState, stone: VentStone): string {
    gameState.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED, true)

    // Remove the stone from inventory (one use per stone), else from the room
    const inInventory = gameState.inventory.indexOf(stone)
    if (inInventory >= 0) {
      gameState.inventory.splice(inInventory, 1)
    } else {
      const inRoom = this.items.indexOf(stone)
      if (inRoom >= 0) this.items.splice(inRoom, 1)
    }

    this.ventCalibrations += 1
    if (this.ventCalibrations < 3) {
      return event(
        'You press the vent stone into the channel. The vents click and ' +
          'a rhythmic hiss grows steadier—the timing seems closer to being ' +
          'synchronized.',
      )
    }

    return event(
      "With a final fit, the vents' rhythms align into a deep, slow " +
        'breath. You sense the passages will now accept a heat ward to steady ' +
        'the crossing intervals.',
    )
  }

  /** Apply the heat ward mix to the calibrated vents. Requires calibration. */
  applyHeatWard(gameState: GameState, mix: HeatWardMix): string {
    if (this.ventCalibrations < 3) {
      return (
        '[failure]The vents are not yet synchronized; the ward would be ' +
        'unstable. Calibrate more vent stones first.[/failure]' +
        cedricAdds(gameState, CEDRIC_HEAT_WARD)
      )
    }

    // Consume the mix from inventory if present
    const index = gameState.inventory.indexOf(mix)
    if (index >= 0) gameState.inventory.splice(index, 1)

    // Set completion flag and open the path to Phoenix Crater
    gameState.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, true)

    return event(
      'You daub the heat-ward mix into the vents and seams. The rock ' +
        'grows a touch cooler around your hands as the ward seals into place. ' +
        'Down the tunnel you notice the gusting heat flatten into a steady ' +
        'breath—passage through the fumaroles is now safe for a short interval.',
    )
  }

  /** Return exits, hiding south until Breath of the Mountain completed. */
  override getExits(gameState: GameState): Exits {
    const exits = { ...this.exits }
    if (!gameState.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED)) {
      delete exits.south
    }
    return exits
  }

  /** Set the Breath of the Mountain started flag when entering the room. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED, true)
  }
}
