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
    "Welcome to Aldric's. Rope that holds, lanterns that stay lit, and " +
      'nothing that comes apart on the road.',
    "Planning an expedition? Tell me where, and I'll tell you what you'll " +
      "wish you'd brought.",
    "I've heard tales of strange happenings in the forest. The carters who " +
      'still go in buy two things from me: a lantern and a good rope.',
    'Bread costs near twice what it did in spring. The farms west of the city ' +
      'send half the grain they used to, and what does come is grey at the ' +
      'husk. Not my trade, mind, but my suppliers talk of little else.',
  ]
  dialogueIndex = 0
  closedDialogue =
    characterName('Master Merchant Aldric') +
    ' looks at your boots, then at your face. ' +
    speech(
      'I deal only with established customers. A new face brings me an ' +
        'introduction. Even one of my own handbills will do.',
    )
  gaveFlyer = false

  constructor() {
    super({
      name: 'master merchant aldric',
      description:
        'A broad man in a good coat, standing among coils of rope and racks ' +
        'of lanterns. He looks at your boots before he looks at your face.',
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
        ' turns the flyer over and finds his own name on it. ' +
        speech(
          'One of mine. Then someone thought you worth sending. This flyer ' +
            'grants you access to our premium selection. Have a look.',
        ) +
        '[/success]'
      )
    }

    // Non-flyer items are politely declined
    return (
      characterName('Master Merchant Aldric') +
      ` turns the [item_name]${item.name}[/item_name] over and hands it back. ` +
      speech(
        "I deal in adventure gear, not donations. Bring coin, and we'll talk.",
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
        `I don't stock any [item_name]${itemNameToBuy}[/item_name]. ` +
          'What I sell is laid out here.',
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
        `You've a [item_name]${itemNameToBuy}[/item_name] already. ` +
          "I'd sooner sell you something you'll use.",
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
