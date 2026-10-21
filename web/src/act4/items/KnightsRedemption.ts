import { Item, type GameState, event } from '@/engine'

/** The tarnished badge the redeemed knight presses into Elior's hand. */
export class KnightsRedemption extends Item {
  constructor() {
    super({
      name: "Knight's Redemption",
      description:
        "A tarnished knight's badge, warm to the touch. He pressed it into " +
        "your hand: proof that even one of Malakar's own can turn back.",
      canBeCarried: true,
    })
  }

  /** The badge's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }
}
