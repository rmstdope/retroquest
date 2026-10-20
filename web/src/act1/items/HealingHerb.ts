import { Item } from '@/engine'

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

  /** Block pickup and deliver Mira's stewardship dialogue. */
  override preventPickup(): string {
    return (
      '[character_name]Mira[/character_name] gently but firmly stops you. ' +
      "[dialogue]'Those herbs are part of my stores, " +
      '[character_name]Elior[/character_name]. They are not for taking, but for ' +
      "healing those who truly need them.'" +
      '[/dialogue]'
    )
  }
}
