import { Character } from './Character'
import type { GameState } from './GameState'
import type { Item } from './Item'
import { clue } from './markup'
import { numberInWords } from './numberInWords'

/**
 * One ware on a seller's shelves: the item and its price in coins. A sale
 * hands over a new item of the same class, so a ware's class takes no
 * constructor arguments.
 */
export type Ware = { item: Item; price: number }

/**
 * A character who sells wares for coins. It says its prices in one sentence,
 * lists what it sells, and takes a purchase through: refuse, count the coins,
 * take them and hand the ware over. A subclass declares its `wares`, writes its
 * own lines and overrides the steps where its trade differs.
 *
 * The class keeps no fields of its own: a save restores a seller without
 * running constructors, so everything it saves is declared by the subclass.
 */
export abstract class Seller extends Character {
  /** The wares by the name the player buys them under, in the order spoken. */
  abstract wares: Record<string, Ware>

  /**
   * The prices as one spoken sentence: "A [kit]'s fifty [gold coins], the
   * [lantern]'s forty and the [rope]'s twenty." Only the first ware names the
   * coin (see `firstWarePrice`). Returns an empty string when there is nothing
   * for sale.
   */
  protected priceSentence(): string {
    const spoken = Object.entries(this.wares).map(([name, { price }], index) =>
      index === 0
        ? this.firstWarePrice(name, price)
        : `the [item_name]${name}[/item_name]'s ${numberInWords(price)}`,
    )
    const last = spoken.pop()
    if (last === undefined) return ''
    return spoken.length === 0
      ? `${last}.`
      : `${spoken.join(', ')} and ${last}.`
  }

  /** The opening clause of the price sentence, which names the coin. */
  protected firstWarePrice(wareName: string, price: number): string {
    return (
      `A [item_name]${wareName}[/item_name]'s ${numberInWords(price)} ` +
      '[item_name]gold coins[/item_name]'
    )
  }

  /** The name of the carried item the seller takes as payment, one a coin. */
  protected coinName(): string {
    return 'coins'
  }

  /**
   * Lists every ware; a subclass leaves out what `buyItem` would refuse
   * outright. It must only read the state.
   */
  override sells(_gameState: GameState): string[] {
    return Object.keys(this.wares)
  }

  /**
   * Sell the ware named, in any case, in this order: `refusalBeforeSale`, a
   * ware not stocked, too few coins, `refusalAfterPayment`, and otherwise the
   * coins are taken, the ware is handed over and `soldAnswer` is said. A
   * refusal takes nothing.
   */
  override buyItem(gameState: GameState, itemName: string): string {
    const wareName = itemName.toLowerCase()
    const refusal = this.refusalBeforeSale(gameState, wareName)
    if (refusal !== null) return refusal
    if (!Object.hasOwn(this.wares, wareName)) {
      return this.notSoldAnswer(wareName)
    }
    const ware = this.wares[wareName]
    const coin = this.coinName()
    if (gameState.getItemCount(coin) < ware.price) {
      return clue("You don't have enough coins for that.")
    }
    const unwanted = this.refusalAfterPayment(gameState, wareName)
    if (unwanted !== null) return unwanted
    gameState.removeItemFromInventory(coin, ware.price)
    const item = this.handOver(gameState, wareName, ware)
    return this.soldAnswer(gameState, item, ware.price)
  }

  /**
   * An answer given before the wares are looked at, such as a shut shop, or
   * null (the default) to go on with the sale.
   */
  protected refusalBeforeSale(
    _gameState: GameState,
    _wareName: string,
  ): string | null {
    return null
  }

  /** The answer to a name that is not among the wares. */
  protected abstract notSoldAnswer(wareName: string): string

  /**
   * An answer that turns down a buyer who has the coins, or null (the
   * default) to go on with the sale.
   */
  protected refusalAfterPayment(
    _gameState: GameState,
    _wareName: string,
  ): string | null {
    return null
  }

  /**
   * Take the shown ware off the room once one is sold: by default the first
   * item in the room with the ware's name.
   */
  protected clearDisplay(gameState: GameState, wareName: string): void {
    const items = gameState.currentRoom.items
    const shown = items.findIndex(
      (item) => item.name.toLowerCase() === wareName,
    )
    if (shown !== -1) items.splice(shown, 1)
  }

  /**
   * Clear the display, then put a new item of the ware's class in the
   * inventory, free to carry, and return it. The ware stays on sale.
   */
  protected handOver(gameState: GameState, wareName: string, ware: Ware): Item {
    this.clearDisplay(gameState, wareName)
    const WareClass = ware.item.constructor as new () => Item
    const item = new WareClass()
    item.canBeCarried = true
    gameState.addItemToInventory(item)
    return item
  }

  /** "The [ware] is yours for N [gold coins].", for a sale's answer. */
  protected yoursFor(wareName: string, price: number): string {
    return (
      `The [item_name]${wareName}[/item_name] is yours for ` +
      `${price} [item_name]gold coins[/item_name].`
    )
  }

  /** What a completed sale answers. */
  protected soldAnswer(
    _gameState: GameState,
    item: Item,
    price: number,
  ): string {
    return `[success]${this.yoursFor(item.name, price)}[/success]`
  }
}
