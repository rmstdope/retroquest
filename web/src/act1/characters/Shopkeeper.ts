import {
  Character,
  type GameState,
  type Item,
  type NameOptions,
  characterName,
  speech,
  clue,
  attributeSpeech,
} from '@/engine'
import { Rope } from '../items/Rope'
import { Apple } from '../items/Apple'
import { Matches } from '../items/Matches'
import { Coin } from '../items/Coin'
import { Armor } from '../items/Armor'
import { Sword } from '../items/Sword'
import { Patches } from './Patches'
import {
  FLAG_HEMLOCK_HEARD_PATCHES_STAYED,
  FLAG_MET_HEMLOCK,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_RUSTY_HOE_SECOND_COIN_FOUND,
} from '../Act1StoryFlags'

/** Python's str.capitalize(): first character upper-cased, the rest lower-cased. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Old Man Hemlock, the shopkeeper of Willowbrook's General Store.
 *
 * He has shut the store to look for his missing cat, Patches, and reopens it
 * when Elior carries her home, paying the notice's reward of a coin. If
 * Elior lets her stay with his grandmother instead, she sends word, the store
 * reopens, and Hemlock gives Elior a rope and his usual apple in place of
 * the coin. Saves made
 * when the hoe still gave a second coin keep the store open and get no
 * second reward.
 *
 * The store's matches are kept for the priest: they are not among the wares
 * and are handed over for free once Elior has spoken with the priest.
 */
export class Shopkeeper extends Character {
  wares: Record<string, { item: Item; price: number }> = {
    rope: { item: new Rope(), price: 1 },
    sword: { item: new Sword(), price: 5 },
    armor: { item: new Armor(), price: 10 },
  }
  priestMatchesGiven = false
  dialogueOptions: string[] = [
    'Welcome to my humble store! Finest goods in Willowbrook, ' +
      'I assure you.',
    'Looking for something specific, or just browsing?',
    'Heard some strange tales from travelers lately. This village ' +
      "isn't as sleepy as it seems.",
  ]
  dialogueIndex = 0

  constructor() {
    super({
      name: 'shopkeeper',
      description:
        `Old Man ${characterName('Hemlock')}, the owner of the General Store, ` +
        'always bustling about and eager to strike a bargain or share a rumor.',
    })
  }

  /**
   * Also answers to his name as the game gives it, "Hemlock", "Old Hemlock"
   * or "Old Man Hemlock": his description, the notice and his own
   * introduction all name him.
   */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['hemlock', 'old hemlock', 'old man hemlock'].includes(name.toLowerCase())
    )
  }

  /** Named by what it is, so it reads "the shopkeeper" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /**
   * Whether the store is open: once Patches is home, or staying with
   * grandmother, or in a save made when the hoe's second coin, not Patches,
   * paid for the rope.
   */
  private isOpen(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_PATCHES_RETURNED) ||
      gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER) ||
      gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    )
  }

  /**
   * Why the store is shut: Hemlock introduces himself the first time, then
   * only asks after Patches.
   */
  private shutDialogue(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_MET_HEMLOCK)) {
      gameState.setStoryFlag(FLAG_MET_HEMLOCK, true)
      return (
        `${this.nameInSentence({ atStart: true })} looks up from the window, ` +
        'his face creased with worry. ' +
        speech(
          `Oh! Forgive me, lad. ${characterName('Hemlock')}'s the name, ` +
            'and this is my store. Or it would be, if I could keep my mind ' +
            `on it. My cat, ${characterName('Patches')}, has been gone for days. ` +
            `Can't think about business with ${characterName('Patches')} ` +
            "out there in the cold, so the store stays shut until she's home.",
        ) +
        '\n' +
        speech(
          'She was last seen near the old well. If you find her, ' +
            "there's a reward in it for you.",
        ) +
        '\n' +
        speech(
          'And the caravans have stopped coming, now the king is ill and the ' +
            "roads are what they are. Malakar's luck, my father would have " +
            'called it.',
        )
      )
    }
    return (
      `${this.nameInSentence({ atStart: true })} shakes his head. ` +
      speech(
        `No sign of ${characterName('Patches')} yet? ` +
          "The store stays shut until she's home, lad. " +
          'She was last seen near the old well.',
      )
    )
  }

  /**
   * Take Patches back from Elior, pay the notice's coin (unless the save
   * already had the hoe's second coin), reopen the store and settle her on
   * the counter.
   */
  private welcomePatchesHome(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    gameState.setStoryFlag(FLAG_MET_HEMLOCK, true)
    gameState.currentRoom.addCharacter(new Patches())
    const paid = !gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    if (paid) gameState.addItemToInventory(new Coin())
    const reward = paid
      ? "Here, the reward I promised. It isn't much, but it's honestly given."
      : "You'll always be welcome in this store, lad."
    return (
      `${characterName('Patches')} butts her head against ` +
      `${this.nameInSentence()}'s hand, and his face lights up. ` +
      speech(
        `${characterName('Patches')}! You found her! ` +
          `Old ${characterName('Hemlock')} won't forget this. ` +
          `${reward} And the store's open again, so have a look around.`,
      ) +
      (paid ? '\n' + 'You receive a [item_name]coin[/item_name].' : '') +
      '\n' +
      `${characterName('Patches')} curls up beside the till and begins to purr.`
    )
  }

  /**
   * Hemlock's first word after grandmother has kept Patches: he thanks Elior
   * and, unless the save already had the hoe's second coin, gives him a rope
   * and the apple that goes with every sale, in place of the coin.
   */
  private patchesStayedNews(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED, true)
    gameState.setStoryFlag(FLAG_MET_HEMLOCK, true)
    const gift = !gameState.getStoryFlag(FLAG_RUSTY_HOE_SECOND_COIN_FOUND)
    if (gift) {
      gameState.addItemToInventory(new Rope())
      const apple = new Apple()
      apple.canBeCarried = true
      gameState.addItemToInventory(apple)
    }
    return (
      `${this.nameInSentence({ atStart: true })} hurries over the moment you come in. ` +
      speech(
        `Your ${characterName('grandmother')} sent word, lad. ` +
          `${characterName('Patches')} is safe and warm by her hearth. ` +
          "I'll not drag her back; she always did like a fire better " +
          'than a draughty old store, and I can call in and see her.',
      ) +
      '\n' +
      speech(
        (gift
          ? 'The reward was for bringing her home, and she found a new one. ' +
            "But you'll not leave empty-handed: take this " +
            "[item_name]rope[/item_name], on the house, and there's " +
            'always an [item_name]apple[/item_name] to go with it. '
          : '') + "And the store's open again, so have a look around.",
      ) +
      (gift
        ? '\n' +
          ('You receive a [item_name]rope[/item_name] and an ' +
            '[item_name]apple[/item_name].')
        : '')
    )
  }

  /**
   * Hemlock's answer while the store is shut or a Patches scene is due, or
   * null once it is open: Patches in Elior's arms is welcomed home first, then
   * the news that she stays with grandmother; otherwise he explains why the
   * store is shut.
   */
  private whileShut(gameState: GameState): string | null {
    const stayed = gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)
    if (
      gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      !gameState.getStoryFlag(FLAG_PATCHES_RETURNED) &&
      !stayed
    ) {
      return this.welcomePatchesHome(gameState)
    }
    if (stayed && !gameState.getStoryFlag(FLAG_HEMLOCK_HEARD_PATCHES_STAYED)) {
      return this.patchesStayedNews(gameState)
    }
    return this.isOpen(gameState) ? null : this.shutDialogue(gameState)
  }

  /**
   * Greet Elior: while the store is shut, welcome Patches home or ask after
   * her; once open, hand over the priest's matches or list the wares.
   */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What the shopkeeper answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
    const shut = this.whileShut(gameState)
    if (shut) return shut

    // Check if priest needs matches and shopkeeper hasn't given them yet
    if (
      gameState.getStoryFlag('priest_talked_to') &&
      !this.priestMatchesGiven
    ) {
      // Give matches to player for the priest
      gameState.currentRoom.removeItem('Matches')

      const newMatches = new Matches() // Create a new instance for the inventory
      gameState.addItemToInventory(newMatches)

      // Remember the hand-over so the matches can't be given again
      this.priestMatchesGiven = true

      return (
        `${this.nameInSentence({ atStart: true })} leans in. ` +
        speech(
          `Ah, you spoke to the ${characterName('priest')}? ` +
            'He does get through his [item_name]matches[/item_name]. ' +
            'Here, take these for him, on the house. Tell him I said hello!',
        ) +
        '\n\n' +
        'You receive a box of [item_name]matches[/item_name].'
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
      `${this.nameInSentence({ atStart: true })} says: ` +
      speech(`${dialogue} ${waresInfo.trim()}`)
    )
  }

  /**
   * Bring a shopkeeper from a save made before the matches left the wares up
   * to date. Such saves listed the matches for sale until the hand-over and
   * had no `priestMatchesGiven`, so the hand-over is read from their absence
   * before they are dropped from the wares. Safe to run more than once.
   */
  migrateLegacyWares(): void {
    this.priestMatchesGiven ??= !('matches' in this.wares)
    delete this.wares.matches
  }

  /** The shopkeeper does not accept gifts. */
  override giveItem(_gameState: GameState, _item: Item): string {
    return (
      `${this.nameInSentence({ atStart: true })} chuckles. ` +
      speech(
        'Not looking for donations, friend, but I appreciate the ' + 'thought!',
      )
    )
  }

  /**
   * Sell a ware for coins, adding the bonus apple to the inventory. Nothing
   * is sold while the store is shut (Patches in Elior's arms is welcomed home
   * instead), and the matches are kept for the priest
   * and never sold.
   */
  override buyItem(gameState: GameState, itemName: string): string {
    return attributeSpeech(this.name, this.buyAnswer(gameState, itemName))
  }

  /** What the shopkeeper answers to a purchase, before the speaker is labelled. */
  private buyAnswer(gameState: GameState, itemName: string): string {
    const shut = this.whileShut(gameState)
    if (shut) return shut
    const itemNameToBuy = itemName.toLowerCase()
    if (gameState.currentRoom.getItemByName(itemNameToBuy) instanceof Matches) {
      return speech(
        `Those [item_name]matches[/item_name] are the ${characterName('priest')}'s. ` +
          "He gets them on the house whenever he asks, so they're not for sale.",
      )
    }
    if (!(itemNameToBuy in this.wares)) {
      return speech("Sorry, friend, that's not something I carry.")
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
      return clue("You don't have enough coins for that.")
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
      `The [item_name]${newItem.name}[/item_name] is yours for ${price} ` +
      '[item_name]coin(s)[/item_name], with an extra ' +
      '[item_name]apple[/item_name] as a bonus!'
    )
  }
}
