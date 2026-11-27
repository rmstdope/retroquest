import { describe, it, expect } from 'vitest'
import { Act } from './Act'
import { Game } from './Game'
import { Item } from './Item'
import { Room } from './Room'
import { Seller, type Ware } from './Seller'

/** A ware with nothing of its own. */
class Lamp extends Item {
  constructor() {
    super({ name: 'lamp', description: 'A lamp.' })
  }
}

/** A coin of the default currency. */
class Coins extends Item {
  constructor() {
    super({ name: 'coins', description: 'Coins.', canBeCarried: true })
  }
}

/** The smallest seller: one table and its own refusal line. */
class Stall extends Seller {
  override wares: Record<string, Ware> = {
    lamp: { item: new Lamp(), price: 2 },
  }
  /** What to answer before looking at the wares, if anything. */
  closed: string | null = null
  /** What to answer a buyer who can pay, if anything. */
  owned: string | null = null

  constructor() {
    super({ name: 'stall', description: 'A stall.' })
  }

  /** Its prices, for the test to read. */
  prices(): string {
    return this.priceSentence()
  }

  /** The stall's refusal of a ware it does not stock. */
  protected override notSoldAnswer(wareName: string): string {
    return `No ${wareName} here.`
  }

  /** Closed when the test says so. */
  protected override refusalBeforeSale(): string | null {
    return this.closed
  }

  /** Refuses a paying buyer when the test says so. */
  protected override refusalAfterPayment(): string | null {
    return this.owned
  }
}

/** A game with the player in a room holding the stall and its display lamp. */
function atStall(coins: number): { game: Game; stall: Stall; shown: Lamp } {
  const stall = new Stall()
  const shown = new Lamp()
  const room = new Room({ name: 'Square', description: 'A square.' })
  room.addCharacter(stall)
  room.items.push(shown)
  const act = new Act({
    name: 'Test Act',
    rooms: { Square: room },
    quests: [],
    musicFile: '',
    musicInfo: '',
  })
  const game = new Game([act])
  for (let i = 0; i < coins; i++) game.state.addItemToInventory(new Coins())
  return { game, stall, shown }
}

describe('Seller price sentence', () => {
  it('is empty when there is nothing for sale', () => {
    const stall = new Stall()
    stall.wares = {}
    expect(stall.prices()).toBe('')
  })

  it('names the coin with the only ware', () => {
    expect(new Stall().prices()).toBe(
      "A [item_name]lamp[/item_name]'s two [item_name]gold coins[/item_name].",
    )
  })

  it('names the coin with the first ware alone and joins the last with and', () => {
    const stall = new Stall()
    stall.wares = {
      lamp: { item: new Lamp(), price: 50 },
      oil: { item: new Lamp(), price: 40 },
      wick: { item: new Lamp(), price: 1 },
    }
    expect(stall.prices()).toBe(
      "A [item_name]lamp[/item_name]'s fifty [item_name]gold coins[/item_name], " +
        "the [item_name]oil[/item_name]'s forty and the " +
        "[item_name]wick[/item_name]'s one.",
    )
  })
})

describe('Seller selling', () => {
  it('lists its wares', () => {
    const { game, stall } = atStall(0)
    expect(stall.sells(game.state)).toEqual(['lamp'])
  })

  it('takes exactly the price and hands over a new carriable ware', () => {
    const { game, stall, shown } = atStall(3)

    expect(stall.buyItem(game.state, 'LAMP')).toBe(
      '[success]The [item_name]lamp[/item_name] is yours for 2 ' +
        '[item_name]gold coins[/item_name].[/success]',
    )

    expect(game.state.getItemCount('coins')).toBe(1)
    expect(game.state.currentRoom.items).not.toContain(shown)
    const bought = game.state.inventory.at(-1)
    expect(bought).toBeInstanceOf(Lamp)
    expect(bought).not.toBe(stall.wares.lamp.item)
    expect(bought).not.toBe(shown)
    expect(bought?.canBeCarried).toBe(true)
    expect(stall.sells(game.state)).toEqual(['lamp'])
  })

  it('refuses a ware it does not stock', () => {
    const { game, stall } = atStall(3)
    expect(stall.buyItem(game.state, 'Rope')).toBe('No rope here.')
    expect(game.state.getItemCount('coins')).toBe(3)
  })

  it('takes nothing from a purse that is short', () => {
    const { game, stall, shown } = atStall(1)
    stall.owned = 'You have one.'

    expect(stall.buyItem(game.state, 'lamp')).toContain(
      "You don't have enough coins for that.",
    )

    expect(game.state.getItemCount('coins')).toBe(1)
    expect(game.state.currentRoom.items).toContain(shown)
  })

  it('answers a refusal before the sale ahead of everything', () => {
    const { game, stall } = atStall(0)
    stall.closed = 'Closed.'
    expect(stall.buyItem(game.state, 'rope')).toBe('Closed.')
  })

  it('takes nothing when it refuses a buyer who can pay', () => {
    const { game, stall, shown } = atStall(2)
    stall.owned = 'You have one.'

    expect(stall.buyItem(game.state, 'lamp')).toBe('You have one.')

    expect(game.state.getItemCount('coins')).toBe(2)
    expect(game.state.currentRoom.items).toContain(shown)
  })
})
