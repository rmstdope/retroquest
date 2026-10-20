import { Item, characterName, speech, type GameState } from '@/engine'

/**
 * Mira's herbal preparations for ritual stabilization (Act III). Non-carriable;
 * interaction restricted to preserve ritual integrity and reserve for guided use.
 */
export class HealingHerbs extends Item {
  constructor() {
    super({
      name: 'healing herbs',
      shortName: 'herbs',
      description:
        "Bundles of resin-sweet stems and silverleaf—Mira's blends for " +
        'steadying wounds and sharpening ritual focus during complex workings.',
      canBeCarried: false,
    })
  }

  /** Block pickup with narrative explanation through Mira. */
  override preventPickup(): string {
    return (
      characterName('Mira') +
      ' lifts a sachet, then shakes her head. ' +
      speech(
        "'Leave these for the circles and crossings. When the " +
          "rite calls for them, I will place them in your hands.'",
      )
    )
  }

  /** Provide flavor text when using the herb preparations. */
  override use(_gameState: GameState): string {
    return (
      "You sort the sachets by scent and potency. Mira's mix will steady " +
      'breath and sharpen focus—useful in rites and long treks between ' +
      'thresholds.'
    )
  }
}
