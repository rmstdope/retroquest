import { Character, type GameState, type Item } from '@/engine'
import { RoomKey } from '../items/RoomKey'
import { DruidicCharm } from '../items/DruidicCharm'
import {
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
} from '../Act2StoryFlags'

/** Python's str.title(): every word starts upper-cased, the rest lower-cased. */
function title(text: string): string {
  return text.replace(
    /[A-Za-z]+/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  )
}

/** Innkeeper NPC who sells wares and rewards the player after Elena's cure. */
export class InnkeeperMarcus extends Character {
  wares: Record<string, { item: Item; price: number }> = {
    'room key': { item: new RoomKey(), price: 10 },
  }
  dialogueOptions: string[] = [
    'Welcome to The Silver Stag Inn! We offer comfortable rooms and warm meals ' +
      'for weary travelers.',
    'These have been difficult times, but we still maintain the finest ' +
      'accommodations in Greendale.',
    "A good night's rest in a private room can work wonders for mind and body.",
  ]
  dialogueIndex = 0
  hasGivenCharm = false

  constructor() {
    super({
      name: 'innkeeper marcus',
      description:
        'A kind-hearted man who runs The Silver Stag Inn. He has worry lines on ' +
        'his face and glances frequently toward his daughter with obvious ' +
        'concern.',
    })
  }

  /** Reward the cure with the Druidic Charm, or list the wares and plead for help. */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)) {
      if (!this.hasGivenCharm) {
        // First time speaking after Elena is cured - give the Druidic Charm
        this.hasGivenCharm = true
        const druidicCharm = new DruidicCharm()
        gameState.addItemToInventory(druidicCharm)

        const charmName = druidicCharm.name
        const name = this.name
        const head =
          `[character_name]${name}[/character_name]: [dialogue]*tears of joy in his eyes* ` +
          'You have given me back my daughter! There are no words to express my ' +
          'gratitude. '
        const body =
          `This [item_name]${charmName}[/item_name] has been in my family for ` +
          'generations - it was blessed by the ancient druids who first settled ' +
          'in these lands. Please, take it as a token of our eternal gratitude. ' +
          'May it bring you protection and guidance on your heroic journey![/dialogue]\n\n'
        const tail =
          '[success]Marcus places the sacred charm in your hands with reverence. ' +
          'You can feel the ancient magic thrumming within the carved wood.[/success]'
        return head + body + tail
      } else {
        return (
          `[character_name]${this.name}[/character_name]: [dialogue]My daughter is ` +
          'healthy and happy again, all thanks to you! The Silver Stag Inn will ' +
          'always be your home. Whatever you need - rooms, meals, information - ' +
          "it's yours freely.[/dialogue]"
        )
      }
    }

    // Build wares information
    let waresInfo = 'I can offer you:\n'
    const entries = Object.entries(this.wares)
    if (entries.length > 0) {
      for (const [wareName, details] of entries) {
        waresInfo +=
          `- [item_name]${title(wareName)}[/item_name]: ${details.price} ` +
          '[item_name]gold coins[/item_name]\n'
      }
    } else {
      waresInfo = "I'm currently not offering any services.\n"
    }

    // Cycle through dialogue options
    const dialogue = this.dialogueOptions[this.dialogueIndex]
    this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueOptions.length
    const name = this.name

    if (gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE)) {
      const dialogueBlock =
        `The [character_name]${name}[/character_name] says: [dialogue]"${dialogue} ` +
        `${waresInfo.trim()}"[/dialogue]\n\n`
      const plea =
        "You've spoken with [character_name]Elena[/character_name]? Then you " +
        'understand my desperation. The curse grows stronger each day, and I ' +
        "fear we don't have much time left. If you truly can help her, I'll " +
        'give you anything - rooms, information, whatever you need.'
      return dialogueBlock + plea
    } else {
      const dialogueBlock =
        `The [character_name]${name}[/character_name] says: [dialogue]"${dialogue} ` +
        `${waresInfo.trim()}"[/dialogue]\n\n`
      const closing =
        'Though I must say, these have been dark times for my family. My daughter... ' +
        "well, perhaps you should speak with her yourself if you're looking to help " +
        'those in need.'
      return dialogueBlock + closing
    }
  }

  /** Handle buying items from Innkeeper Marcus. */
  override buyItem(gameState: GameState, itemName: string): string {
    const itemNameToBuy = itemName.toLowerCase()
    const seller = this.name
    const eventMsg =
      `[event]You try to buy the [item_name]${itemNameToBuy}[/item_name] from the ` +
      `[character_name]${seller}[/character_name].[/event]`

    // Check if item is available
    if (!(itemNameToBuy in this.wares)) {
      const itemDisp = `[item_name]${itemNameToBuy}[/item_name]`
      return (
        eventMsg +
        '\n' +
        (`[dialogue]"Sorry, I don't have any '${itemDisp}' ` +
          'for sale. Check what I can offer you."[/dialogue]')
      )
    }

    const wareDetails = this.wares[itemNameToBuy]
    const price = wareDetails.price

    // Count total coins in inventory using the batching system
    const totalCoins = gameState.getItemCount('coins')

    // Check if player has enough coins
    if (totalCoins < price) {
      return (
        eventMsg +
        '\n' +
        ("[failure]You don't have enough [item_name]coins[/item_name] for the " +
          `[item_name]${itemNameToBuy}[/item_name]. It costs ${price} ` +
          `[item_name]gold coins[/item_name] but you only have ${totalCoins}.[/failure]`)
      )
    }

    // Check if already have the item in inventory (not counting display items in room)
    const inventory = gameState.inventory
    if (
      inventory.some(
        (item) =>
          item.name.toLowerCase() === itemNameToBuy && item.canBeCarried,
      )
    ) {
      return (
        eventMsg +
        '\n' +
        (`[dialogue]"You already have a [item_name]${itemNameToBuy}[/item_name]. ` +
          'One room should be sufficient for your stay."[/dialogue]')
      )
    }

    // Purchase the item - spend coins using the batching system
    const coinsRemoved = gameState.removeItemFromInventory('coins', price)
    if (coinsRemoved !== price) {
      return (
        eventMsg +
        '\n' +
        '[failure]Transaction failed. Unable to process payment.[/failure]'
      )
    }

    // Remove the display item from the room (if present)
    const roomItems = gameState.currentRoom.items
    const roomIndex = roomItems.findIndex(
      (item) => item.name.toLowerCase() === itemNameToBuy,
    )
    if (roomIndex !== -1) {
      roomItems.splice(roomIndex, 1)
    }

    // Create new carriable instance of the item to add to inventory
    let newItem: Item | null = null
    if (itemNameToBuy === 'room key') {
      newItem = new RoomKey()
    }

    if (newItem) {
      newItem.canBeCarried = true // Ensure the purchased item is carriable
      gameState.addItemToInventory(newItem)
      const remainingCoins = gameState.getItemCount('coins')
      const purchaseMsg =
        `[success]You purchase the [item_name]${itemNameToBuy}[/item_name] from ` +
        `[character_name]${seller}[/character_name] for ${price} ` +
        '[item_name]gold coins[/item_name]. He hands you a brass key and ' +
        'explains how to access the private rooms upstairs. ' +
        `You have ${remainingCoins} [item_name]coins[/item_name] remaining.[/success]`
      return eventMsg + '\n' + purchaseMsg
    } else {
      // Should not happen if item is in wares, but safety check
      return (
        eventMsg +
        '\n' +
        '[failure]An unexpected error occurred trying to rent the room.[/failure]'
      )
    }
  }
}
