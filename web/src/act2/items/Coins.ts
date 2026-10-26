import { Item, type GameState } from '@/engine'

/** The coins' description; `Act2.afterLoad` restores it in older saves. */
export const COINS_DESCRIPTION =
  'Gold coins, kept in a pouch at your belt. These will be useful for ' +
  'purchasing supplies and equipment in Greendale.'

/**
 * One gold coin. The bag holds as many of them as the player has (Sir Cedric
 * pays 150, the merchants take them back one by one), so the description
 * names no count of its own and `use` counts the coins actually carried.
 */
export class Coins extends Item {
  constructor() {
    super({
      name: 'coins',
      description: COINS_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** Count every coin carried, not just this one. */
  override use(gameState: GameState): string {
    return (
      `You count your coins. You have ${gameState.getItemCount('coins')} ` +
      'gold pieces to spend on supplies and equipment.'
    )
  }
}
