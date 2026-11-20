import { Item, clue } from '@/engine'

/** Everyday provisioning good emphasizing agrarian economy and baking culture. */
export class SackOfFlour extends Item {
  constructor() {
    super({
      name: 'sack of flour',
      description:
        'A heavy burlap sack of fine white flour. It leaves a pale dust on your ' +
        'sleeve.',
      shortName: 'flour',
    })
  }

  /** The sack stays in the yard; the refusal ties it to the baker's short flour. */
  override preventPickup(): string {
    return clue(
      "It is bound for the baker's, not for you. " +
        'Somebody in the village is already short of flour this week.',
    )
  }
}
