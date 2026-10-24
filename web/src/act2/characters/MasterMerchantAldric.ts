import {
  Character,
  type GameState,
  type Item,
  type Room,
  characterName,
  dialogue,
  clue,
  speech,
} from '@/engine'
import { ForestSurvivalKit } from '../items/ForestSurvivalKit'
import { EnhancedLantern } from '../items/EnhancedLantern'
import { QualityRope } from '../items/QualityRope'
import { MerchantsFlyer } from '../items/MerchantsFlyer'

/** Python's str.title(): the first letter of every word upper-cased, the rest lower. */
function title(text: string): string {
  return text.replace(
    /[A-Za-z]+/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  )
}

/** A room that can lay out display wares, like the Market District. */
function hasAddWares(room: Room): room is Room & { addWares: () => void } {
  return 'addWares' in room && typeof room.addWares === 'function'
}

/** Merchant dealing premium adventure gear and expedition supplies. */
export class MasterMerchantAldric extends Character {
  wares: Record<string, { item: Item; price: number }> = {
    'forest survival kit': { item: new ForestSurvivalKit(), price: 50 },
    'enhanced lantern': { item: new EnhancedLantern(), price: 40 },
    'quality rope': { item: new QualityRope(), price: 20 },
  }
  dialogueOptions: string[] = [
    "Welcome to Aldric's Premium Adventure Gear! Only the finest equipment for " +
      'discerning adventurers.',
    "Planning an expedition? You've come to the right place for quality supplies.",
    "I've heard tales of strange happenings in the forest. Good thing I stock the " +
      'best protective gear!',
    'Bread costs near twice what it did in spring. The farms west of the city ' +
      'send half the grain they used to, and what does come is grey at the ' +
      'husk. Not my trade, mind, but my suppliers talk of little else.',
  ]
  dialogueIndex = 0
  closedDialogue =
    'The ' +
    characterName('Master Merchant Aldric') +
    ' looks at you appraisingly. ' +
    speech(
      'I deal only with established customers and those with proper ' +
        'credentials. Do you have any introduction or referral that would ' +
        'qualify you for my premium services?',
    )
  gaveFlyer = false

  constructor() {
    super({
      name: 'master merchant aldric',
      description:
        'A prosperous merchant with keen eyes for quality goods. He specializes in ' +
        'premium adventure gear and has connections throughout the trading networks.',
    })
  }

  /** Turn away newcomers, or present the wares once the flyer was shown. */
  override talkTo(_gameState: GameState): string {
    // If merchant hasn't been given the flyer, shop is not fully open yet
    if (!this.gaveFlyer) {
      return this.closedDialogue
    }

    // Build wares information similar to Act 1 Shopkeeper
    let waresInfo = 'My premium selection includes:\n'
    const entries = Object.entries(this.wares)
    if (entries.length > 0) {
      for (const [name, details] of entries) {
        waresInfo +=
          `- [item_name]${title(name)}[/item_name]: ${details.price} ` +
          '[item_name]gold coins[/item_name]\n'
      }
    } else {
      waresInfo = "I'm currently restocking my premium inventory.\n"
    }

    // Cycle through dialogue options like Act 1 Shopkeeper
    const dialogue = this.dialogueOptions[this.dialogueIndex]
    this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueOptions.length

    return (
      'The ' +
      characterName('Master Merchant Aldric') +
      ' says: ' +
      speech(`${dialogue} ${waresInfo.trim()}`)
    )
  }

  /** Handle giving items to Master Merchant Aldric. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof MerchantsFlyer) {
      // Remove the flyer from inventory
      const index = gameState.inventory.indexOf(item)
      if (index >= 0) gameState.inventory.splice(index, 1)
      this.gaveFlyer = true
      if (hasAddWares(gameState.currentRoom)) gameState.currentRoom.addWares()
      return (
        '[success]' +
        characterName('Master Merchant Aldric') +
        "'s eyes light up as he examines the flyer. " +
        speech(
          'Ah, excellent! This flyer grants you access to our premium ' +
            'selection and preferred customer pricing. What quality goods can ' +
            'I help you acquire today?',
        ) +
        '[/success]'
      )
    }

    // Non-flyer items are politely declined
    const itemName = item.name
    return (
      'The ' +
      characterName('Master Merchant Aldric') +
      ` examines the ${itemName}. ` +
      speech(
        'I appreciate the offer, but I deal in adventure gear, not ' +
          'donations. Perhaps you could purchase something instead?',
      )
    )
  }

  /** Handle buying items from Master Merchant Aldric. */
  override buyItem(gameState: GameState, itemName: string): string {
    // Check if shop is accessible
    if (!this.gaveFlyer) {
      return this.closedDialogue
    }

    const itemNameToBuy = itemName.toLowerCase()

    // Check if item is available
    if (!(itemNameToBuy in this.wares)) {
      return dialogue(
        this.name,
        `Sorry, I don't have any ' [item_name]${itemNameToBuy}` +
          "[/item_name]' for sale. Check my current inventory for available " +
          'items.',
      )
    }

    const wareDetails = this.wares[itemNameToBuy]
    const price = wareDetails.price

    // Count total coins in inventory using the batching system
    const totalCoins = gameState.getItemCount('coins')

    // Check if player has enough coins
    if (totalCoins < price) {
      return clue("You don't have enough coins for that.")
    }

    // Check if already have the item in inventory (not counting display items in room)
    if (
      gameState.inventory.some(
        (item) =>
          item.name.toLowerCase() === itemNameToBuy && item.canBeCarried,
      )
    ) {
      return dialogue(
        this.name,
        `You already have a [item_name]${itemNameToBuy}[/item_name]. One ` +
          'should be sufficient for your needs.',
      )
    }

    // Purchase the item - spend coins using the batching system
    const coinsRemoved = gameState.removeItemFromInventory('coins', price)
    if (coinsRemoved !== price) {
      return '[failure]Transaction failed. Unable to process payment.[/failure]'
    }

    // Remove the display item from the room (if present)
    const roomItemToRemove =
      gameState.currentRoom.items.find(
        (item) => item.name.toLowerCase() === itemNameToBuy,
      ) ?? null

    if (roomItemToRemove) {
      gameState.currentRoom.items.splice(
        gameState.currentRoom.items.indexOf(roomItemToRemove),
        1,
      )
    }

    // Create new carriable instance of the item to add to inventory
    let newItem: Item | null = null
    if (itemNameToBuy === 'forest survival kit') {
      newItem = new ForestSurvivalKit()
    } else if (itemNameToBuy === 'enhanced lantern') {
      newItem = new EnhancedLantern()
    } else if (itemNameToBuy === 'quality rope') {
      newItem = new QualityRope()
    }

    if (newItem) {
      newItem.canBeCarried = true // Ensure the purchased item is carriable
      gameState.addItemToInventory(newItem)
      return (
        `[success]The [item_name]${itemNameToBuy}[/item_name] is yours for ` +
        `${price} [item_name]gold coins[/item_name].[/success]`
      )
    }
    // Should not happen if item is in wares, but safety check
    return (
      '[failure]An unexpected error occurred trying to sell the ' +
      `[item_name]${itemNameToBuy}[/item_name].[/failure]`
    )
  }
}
