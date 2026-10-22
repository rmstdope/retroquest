import { Item, characterName, speech, event, type GameState } from '@/engine'

/** Static, non-removable medicinal resource controlled by Mira (Act I healer). */
export class HealingHerb extends Item {
  constructor() {
    super({
      name: 'healing herb',
      description:
        'A bundle of fragrant green herbs, known for their restorative properties. ' +
        'Useful for healing wounds or brewing potions.',
      shortName: 'herb',
    })
  }

  /** Grow crowds the pot: a rewarded second use of the spell, in Mira's hut. */
  override grow(_gameState: GameState): string {
    return (
      event(
        'The herb crowds its pot and spills green over the rim, twice what ' +
          'it was.',
      ) +
      '\n' +
      characterName('Mira') +
      ' raises an eyebrow. ' +
      speech(
        'That was dear, that herb. Now there is more of it. I will not ' +
          'complain.',
      )
    )
  }

  /** Block pickup and deliver Mira's stewardship dialogue. */
  override preventPickup(): string {
    return (
      characterName('Mira') +
      ' gently but firmly stops you. ' +
      speech(
        'Those herbs are part of my stores, ' +
          characterName('Elior') +
          '. They are not for taking, but for ' +
          'healing those who truly need them.',
      )
    )
  }
}
