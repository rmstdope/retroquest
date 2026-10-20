import {
  Character,
  type GameState,
  type Item,
  event,
  characterName,
  speech,
} from '@/engine'
import { Rope } from '../items/Rope'
import { Apple } from '../items/Apple'
import { Matches } from '../items/Matches'
import { Coin } from '../items/Coin'
import { Armor } from '../items/Armor'
import { Sword } from '../items/Sword'
import { FLAG_CONNECT_WITH_NATURE } from '../Act1StoryFlags'

/** Python's str.capitalize(): first character upper-cased, the rest lower-cased. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/** The shopkeeper NPC in Willowbrook's General Store. */
export class Shopkeeper extends Character {
  wares: Record<string, { item: Item; price: number }> = {
    rope: { item: new Rope(), price: 1 },
    matches: { item: new Matches(), price: 4 },
    sword: { item: new Sword(), price: 5 },
    armor: { item: new Armor(), price: 10 },
  }
  dialogueOptions: string[] = [
    'Welcome to my humble store! Finest goods in Willowbrook, ' +
      'I assure you.',
    'Looking for something specific, or just browsing?',
    'Heard some strange tales from travelers lately. This village ' +
      "isn't as sleepy as it seems.",
  ]
  dialogueIndex = 0
  closedDialogue =
    `The ${characterName('Shopkeeper')} shakes his head. ` +
    speech(
      "'Sorry, not open for business just yet. Come back later, lad—" +
        "there's something you need to discover first.'",
    )

  constructor() {
    super({
      name: 'shopkeeper',
      description:
        'The owner of the General Store, always bustling about and eager to ' +
        'strike a bargain or share a rumor.',
    })
  }

  /** Greet Elior, hand over the priest's matches or list the wares for sale. */
  override talkTo(gameState: GameState): string {
    // If Elior hasn't been tasked to connect with nature, shop is not open yet
    if (!gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE)) {
      return this.closedDialogue
    }

    // Check if priest needs matches and shopkeeper hasn't given them yet
    if (gameState.getStoryFlag('priest_talked_to') && 'matches' in this.wares) {
      // Give matches to player for the priest
      gameState.currentRoom.removeItem('Matches')

      const newMatches = new Matches() // Create a new instance for the inventory
      gameState.addItemToInventory(newMatches)

      // Remove matches from wares so they can't be bought/given again
      delete this.wares.matches

      return (
        `The ${characterName('Shopkeeper')} leans in. ` +
        speech(
          `"Ah, you spoke to the ${characterName('priest')}? ` +
            'He does get through his [item_name]matches[/item_name]. ' +
            'Here, take these for him, on the house. Tell him I said hello!"',
        ) +
        '\n\n' +
        event('You receive a box of [item_name]matches[/item_name].')
      )
    }

    // Standard dialogue if matches aren't being given for the priest
    let waresInfo = 'I have a few things for sale:\n'
    const entries = Object.entries(this.wares)
    if (entries.length > 0) {
      for (const [name, details] of entries) {
        waresInfo +=
          `- [item_name]${capitalize(name)}[/item_name]: ${details.price} ` +
          '[item_name]coin(s)[/item_name]\n'
      }
    } else {
      waresInfo = "I'm currently out of stock of items for sale.\n"
    }

    waresInfo +=
      'And remember, you always get an extra [item_name]apple[/item_name] ' +
      'with every purchase!\n'

    const dialogue = this.dialogueOptions[this.dialogueIndex]
    this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueOptions.length

    return (
      `The ${characterName('Shopkeeper')} says: ` +
      speech(`"${dialogue} ${waresInfo.trim()}"`)
    )
  }

  /** The shopkeeper does not accept gifts. */
  override giveItem(_gameState: GameState, _item: Item): string {
    return (
      `The ${characterName('Shopkeeper')} chuckles. ` +
      speech(
        '"Not looking for donations, friend, but I appreciate the ' +
          'thought!"',
      )
    )
  }

  /** Sell a ware for coins, adding the bonus apple to the inventory. */
  override buyItem(gameState: GameState, itemName: string): string {
    if (!gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE)) {
      return this.closedDialogue
    }
    const itemNameToBuy = itemName.toLowerCase()
    const eventMsg = event(
      `You try to buy the [item_name]${itemNameToBuy}[/item_name] from the ` +
        `${characterName(this.name)}.`,
    )
    if (!(itemNameToBuy in this.wares)) {
      return (
        eventMsg +
        '\n' +
        speech(
          "Sorry, I don't have any '[item_name]" +
            `${itemNameToBuy}[/item_name]' for sale.`,
        )
      )
    }

    const wareDetails = this.wares[itemNameToBuy]
    const price = wareDetails.price

    // Check if player has enough coins
    let coinCount = 0
    for (const item of gameState.inventory) {
      if (item instanceof Coin) {
        coinCount += 1
      }
    }

    if (coinCount < price) {
      return (
        eventMsg +
        '\n' +
        "[failure]You don't have enough [item_name]coins[/item_name] for " +
        `the [item_name]${itemNameToBuy}[/item_name]. It costs ${price} ` +
        '[item_name]coin(s)[/item_name].[/failure]'
      )
    }

    // Remove coins from inventory
    let removedCoins = 0
    for (const item of [...gameState.inventory]) {
      // Iterate over a copy for safe removal
      if (item instanceof Coin && removedCoins < price) {
        gameState.inventory.splice(gameState.inventory.indexOf(item), 1)
        removedCoins += 1
      }
    }

    // Add item to inventory
    // Need to create a new instance of the item to add to inventory
    const apple = new Apple() // The shopkeeper gives an apple with every purchase
    apple.canBeCarried = true
    gameState.addItemToInventory(apple)
    let newItem: Item
    if (itemNameToBuy === 'rope') {
      newItem = new Rope()
    } else if (itemNameToBuy === 'matches') {
      newItem = new Matches()
    } else if (itemNameToBuy === 'sword') {
      newItem = new Sword()
    } else if (itemNameToBuy === 'armor') {
      newItem = new Armor()
    } else {
      // Should not happen if itemNameToBuy is in this.wares
      return 'An unexpected error occurred trying to sell the item.'
    }
    newItem.canBeCarried = true
    gameState.addItemToInventory(newItem)

    // The store has infinite stock; the player buys one instance.

    return (
      '\n' +
      event(
        `You bought a [item_name]${newItem.name}[/item_name] for ${price} ` +
          '[item_name]coin(s)[/item_name] and got an extra ' +
          '[item_name]apple[/item_name] as a bonus!',
      )
    )
  }
}
