import { Room, clue, effect } from '@/engine'
import type { Exits, GameState } from '@/engine'
import {
  FLAG_ACT3_FUMAROLE_WARD_APPLIED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
} from '../Act3StoryFlags'
import { VentStone } from '../items/VentStone'
import type { HeatWardMix } from '../items/HeatWardMix'
import { PhoenixGuardian } from '../characters/PhoenixGuardian'
import { CEDRIC_HEAT_WARD, cedricAdds } from '../CedricLines'

/** The vents' three-step breath once the ward is set: out, a held pause, in. */
export type VentBreath = 'out' | 'pause' | 'in'

/** The order the breath follows; each rest moves one step along it. */
const BREATH_ORDER: readonly VentBreath[] = ['out', 'pause', 'in']

const WILD_BREATH =
  'The vents gust and sputter without rhythm; there is no telling when they ' +
  'will breathe next.'

/** The breath line shown for each step of the breath. */
const BREATH_LINES: Record<VentBreath, string> = {
  out: 'The vents exhale. A scalding gust roars up out of the southern tunnel.',
  pause:
    'The vents fall still, holding their breath. The heat hangs heavy and ' +
    'unmoving.',
  in: 'The vents draw in. A cool draught tugs past you toward the south.',
}

const WARD_BREATH_TEXT =
  'The wild gusting settles into a slow, even breath: out, a held pause, ' +
  'and in. Each time it draws in, a cool draught runs south.'

const DRIVEN_BACK_ON_OUT =
  'You step into the southern tunnel just as the mountain breathes out. ' +
  'The heat drives you back to the mouth of the passage.'

const DRIVEN_BACK_ON_PAUSE =
  'You edge forward into air that is still and searing, and retreat to the ' +
  'mouth of the passage before the next breath can catch you.'

const CROSSING_TEXT =
  'You walk with the draught at your back, down through the cooling ' +
  'tunnel, and out beneath the open sky of the crater.'

/**
 * Narrow tunnels exhaling rhythmic heat like a great sleeping bellows. Once
 * the vents are calibrated and warded they breathe out, pause and in; the way
 * south can only be crossed on the in-breath, and only `rest`/`wait` (or a
 * failed try south) moves the breath on. It restarts on the out-breath on
 * every entry.
 */
export class FumarolePassages extends Room {
  /** Where the vents are in their breath; saved with the room. */
  breath: VentBreath = 'out'

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
      return (
        'The vents click and ' +
        'a rhythmic hiss grows steadier—the timing seems closer to being ' +
        'synchronized.'
      )
    }

    return (
      "With a final fit, the vents' rhythms align into a deep, slow " +
      'breath. You sense the passages will now accept a heat ward to steady ' +
      'the crossing intervals.'
    )
  }

  /** Apply the heat ward mix to the calibrated vents. Requires calibration. */
  applyHeatWard(gameState: GameState, mix: HeatWardMix): string {
    if (this.ventCalibrations < 3) {
      return (
        clue(
          'The vents still gust out of time with each other. ' +
            'A ward laid on them now would crack at the first wrong breath.',
        ) + cedricAdds(gameState, CEDRIC_HEAT_WARD)
      )
    }

    // Consume the mix from inventory if present
    const index = gameState.inventory.indexOf(mix)
    if (index >= 0) gameState.inventory.splice(index, 1)

    // The ward lists the way south and starts the breath; crossing completes the quest
    gameState.setStoryFlag(FLAG_ACT3_FUMAROLE_WARD_APPLIED, true)

    return (
      'The rock ' +
      'grows a touch cooler around your hands as the ward seals into place. ' +
      'Down the tunnel you notice the gusting heat flatten into a steady ' +
      'breath—passage through the fumaroles is now safe for a short interval. ' +
      WARD_BREATH_TEXT
    )
  }

  /** The current breath; a save made before the breath existed has none, which reads as the out-breath. */
  private currentBreath(): VentBreath {
    return this.breath ?? 'out'
  }

  /** Whether the ward is set (a quest completed under the old rules counts). */
  private isWarded(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT3_FUMAROLE_WARD_APPLIED) ||
      gameState.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED)
    )
  }

  /** The breath line for the current breath, or the wild gusting before the ward. */
  private breathLine(gameState: GameState): string {
    const text = this.isWarded(gameState)
      ? BREATH_LINES[this.currentBreath()]
      : WILD_BREATH
    return `[breath]${text}[/breath]`
  }

  /** Move the breath one step along out → pause → in → out. */
  private advanceBreath(): void {
    const next =
      (BREATH_ORDER.indexOf(this.currentBreath()) + 1) % BREATH_ORDER.length
    this.breath = BREATH_ORDER[next]
  }

  /** Return exits, hiding south until the heat ward is applied. */
  override getExits(gameState: GameState): Exits {
    const exits = { ...this.exits }
    if (!this.isWarded(gameState)) delete exits.south
    return exits
  }

  /** The description followed by the current breath on a line of its own. */
  override descriptionFor(gameState: GameState): string {
    return `${this.description}\n${this.breathLine(gameState)}`
  }

  /**
   * After the ward, resting (or waiting) counts the breath: it moves one step
   * and the new breath is shown. Before the ward it is an ordinary rest.
   */
  override rest(gameState: GameState): string {
    if (!this.isWarded(gameState)) return super.rest(gameState)
    this.advanceBreath()
    return `${effect('You stand still and count.')}\n${this.breathLine(gameState)}`
  }

  /**
   * Going south off the in-breath drives the player back, and the breath moves
   * on one step; on the in-breath the move goes ahead as usual.
   */
  override walk(gameState: GameState, direction: string): string | null {
    if (direction !== 'south' || !this.isWarded(gameState)) return null
    if (this.currentBreath() === 'in') return null
    const text =
      this.currentBreath() === 'out' ? DRIVEN_BACK_ON_OUT : DRIVEN_BACK_ON_PAUSE
    this.advanceBreath()
    return text
  }

  /** Crossing south on the in-breath says so and completes Breath of the Mountain. */
  override departText(gameState: GameState, direction: string): string {
    if (direction !== 'south') return ''
    gameState.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, true)
    return `${CROSSING_TEXT}\n\n`
  }

  /** Start the quest and the breath on the out-breath on every entry. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED, true)
    this.breath = 'out'
  }
}
