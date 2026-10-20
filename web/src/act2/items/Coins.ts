import { Item, type GameState } from '@/engine'

/** Pouch-like currency item that tracks an integer coin balance. */
export class Coins extends Item {
  amount: number

  constructor(amount = 100) {
    super({
      name: 'coins',
      description:
        `A pouch containing ${amount} gold coins. These will be useful for purchasing ` +
        'supplies and equipment in Greendale.',
      canBeCarried: true,
    })
    this.amount = amount
  }

  /** Count the coins in the pouch. */
  override use(_gameState: GameState): string {
    return (
      `You count your coins. You have ${this.amount} gold pieces to spend on ` +
      'supplies and equipment.'
    )
  }

  /** Spend coins if enough are available. */
  spend(amount: number): boolean {
    if (this.amount >= amount) {
      this.amount -= amount
      this.description =
        `A pouch containing ${this.amount} gold coins. These will be useful for ` +
        'purchasing supplies and equipment in Greendale.'
      return true
    }
    return false
  }

  /** Return the current coin balance. */
  getAmount(): number {
    return this.amount
  }
}
