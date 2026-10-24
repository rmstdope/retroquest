import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { FLAG_ACT3_VOW_OF_COURAGE_MADE } from '../Act3StoryFlags'
import { CrystalOfLight } from '../items/CrystalOfLight'
import { TRIAL_STEPS, TideBornGuardian } from '../characters/TideBornGuardian'

/** The key of this room in the act's rooms; `east` leads back to itself. */
const SANCTUM_KEY = 'SanctumOfTheTide'

/**
 * A domed chamber where water stands glass-still with rippling sigils.
 *
 * Until the vow of courage is made the Guardian puts out every light and the
 * room is the trial: `east` wades three steps into the black water (the
 * Guardian keeps the step), `west` from a step turns back, and the Crystal of
 * Light is only there once the water has parted. After the vow the room is
 * lit for good and has a single exit, west.
 */
export class SanctumOfTheTide extends Room {
  constructor() {
    super({
      name: 'Sanctum of the Tide',
      description:
        'A vaulted chamber where water hangs like a dark mirror, its surface ' +
        'etched with sigils that breathe and shift. Pale motes of light drift ' +
        'along the ripples, arranging themselves into slow, impatient runes. ' +
        "At the room's heart a shallow basin holds a cold, humming brightness; " +
        'the air tastes of brine and vows left unsaid.',
      items: [],
      characters: [new TideBornGuardian()],
      exits: { west: 'SubmergedAntechamber' },
    })
  }

  /** The Tide-Born Guardian that keeps the trial, or null if it is gone. */
  private guardian(): TideBornGuardian | null {
    return this.characters.find((c) => c instanceof TideBornGuardian) ?? null
  }

  /** True while the lights are out: the vow has not been made. */
  private isDark(gameState: GameState): boolean {
    return !gameState.getStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE)
  }

  /** East (into the black water) and west before the vow; west only after. */
  override getExits(gameState: GameState): Exits {
    if (!this.isDark(gameState)) return this.exits
    return { west: this.exits.west, east: SANCTUM_KEY }
  }

  /** The east exit leads into the black water, not to another room. */
  override exitLabel(gameState: GameState, direction: string): string | null {
    return direction === 'east' && this.isDark(gameState)
      ? 'the black water'
      : null
  }

  /**
   * In the dark `east` takes a step into the water, revealing the Crystal of
   * Light on the third, and `west` from a step wades back to the edge.
   */
  override walk(gameState: GameState, direction: string): string | null {
    const guardian = this.guardian()
    if (!guardian || !this.isDark(gameState)) return null
    if (direction === 'east') {
      const text = guardian.walkEast(gameState)
      this.syncCrystal(gameState)
      return text
    }
    if (direction === 'west' && guardian.step() > 0) {
      const text = guardian.turnBack()
      this.syncCrystal(gameState)
      return text
    }
    return null
  }

  /**
   * In the dark the Crystal of Light is in the room only while the water is
   * parted (the third step); anywhere else before the vow it is taken out
   * of the item list, which also tidies saves made before the trial existed.
   */
  private syncCrystal(gameState: GameState): void {
    const guardian = this.guardian()
    if (!guardian || !this.isDark(gameState)) return
    const present = this.getItemByName('Crystal of Light') !== null
    if (guardian.step() >= TRIAL_STEPS) {
      if (!present) this.addItem(new CrystalOfLight())
    } else if (present) {
      this.removeItem('Crystal of Light')
    }
  }

  /** Describe the room, with the crystal listed only when it is really there. */
  override describe(gameState: GameState): string {
    this.syncCrystal(gameState)
    return super.describe(gameState)
  }

  /**
   * On entering, the lights go out: the first time the chamber is described
   * as it was and then darkened, later times only the short return line.
   * Elior always starts at the edge. Nothing happens once the vow is made.
   */
  override enterText(gameState: GameState): string {
    const guardian = this.guardian()
    if (!guardian) return ''
    const first = !(guardian.trialBegun ?? false)
    const darkness = guardian.enterLine(gameState)
    this.syncCrystal(gameState)
    if (darkness === '' || !first) return darkness
    return this.description + '\n' + darkness
  }

  /** In the dark the room is only the line for where Elior stands. */
  override descriptionFor(gameState: GameState): string {
    const guardian = this.guardian()
    if (!guardian || !this.isDark(gameState)) return this.description
    return guardian.lookLine(gameState)
  }

  /** While the lights are out the Guardian refuses the spell. */
  castLightHere(gameState: GameState): string {
    const guardian = this.guardian()
    if (!guardian || !this.isDark(gameState)) return this.light(gameState)
    return guardian.refuseLight()
  }
}
