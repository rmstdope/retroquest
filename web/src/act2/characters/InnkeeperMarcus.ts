import {
  Character,
  type GameState,
  type Item,
  characterName,
  clue,
  remembered,
  dialogue,
} from '@/engine'
import { RoomKey } from '../items/RoomKey'
import { DruidicCharm } from '../items/DruidicCharm'
import {
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_MARCUS_TOLD_TRUTH,
  VIRTUE_TRUTH,
} from '../Act2StoryFlags'

/** Python's str.title(): every word starts upper-cased, the rest lower-cased. */
function title(text: string): string {
  return text.replace(
    /[A-Za-z]+/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  )
}

/**
 * Innkeeper NPC who sells wares and rewards the player after Elena's cure.
 * After the cure every talk ends with his "ill wind" line until Elior tells
 * him the truth about the silver mask: the optional truth moment.
 */
export class InnkeeperMarcus extends Character {
  wares: Record<string, { item: Item; price: number }> = {
    'room key': { item: new RoomKey(), price: 10 },
  }
  /** The talk lines he cycles through; static, so old saves get the current wording. */
  private static readonly IDLE_LINES: readonly string[] = [
    'Welcome to The Silver Stag. Hot stew, clean sheets, and a door that locks.',
    'Hard times or not, this house changes its sheets every week.',
    'A night in a room of your own does more for a body than any healer.',
  ]
  dialogueIndex = 0
  hasGivenCharm = false

  constructor() {
    super({
      name: 'innkeeper marcus',
      description:
        'A big man in a stained apron who runs The Silver Stag Inn. He talks ' +
        'to every guest and watches only one: his daughter, across the room.',
    })
  }

  /** Also answers to his first name, which the `say truth to marcus` command uses. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'marcus'
  }

  /**
   * Take the truth about the curse. After the cure, saying "truth" tells him
   * the silver mask was set on Elena on purpose: his reply and the remembered
   * line, recorded once. Before the cure he points at her; afterwards he
   * has heard it. Any other words get the usual reply.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (words.trim().toLowerCase() !== 'truth') {
      return super.sayTo(gameState, words)
    }
    if (!gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)) {
      return dialogue(
        this.name,
        'The truth? The only truth I care about is over there, and ' +
          "she's getting worse.",
      )
    }
    if (gameState.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH)) {
      return dialogue(
        this.name,
        'I heard you the first time, friend. ' +
          "I've not slept right since, but I'd rather know.",
      )
    }
    gameState.setStoryFlag(FLAG_MARCUS_TOLD_TRUTH, true)
    gameState.addVirtue(VIRTUE_TRUTH)
    return (
      `You tell ${characterName('Marcus')} about the silver mask on ` +
      `${characterName('Elena')}'s wrist: the curse was no ill wind. ` +
      'Someone set it on her on purpose.' +
      '\n' +
      dialogue(
        this.name,
        'On purpose. … Someone chose my girl. … Then this house sleeps ' +
          'with one eye open from now on. Thank you for telling me. ' +
          "I'd sooner know it than be comforted by a lie.",
      ) +
      '\n' +
      remembered('Truth')
    )
  }

  /**
   * Reward the cure with the Druidic Charm, or list the wares and plead for
   * help. Every line he speaks is a quote opening with his name and a colon,
   * which the story view shows as the speaker's label.
   */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)) {
      if (!this.hasGivenCharm) {
        // First time speaking after Elena is cured - give the Druidic Charm
        this.hasGivenCharm = true
        const druidicCharm = new DruidicCharm()
        gameState.addItemToInventory(druidicCharm)

        const charm = `[item_name]${druidicCharm.name}[/item_name]`
        const direction =
          characterName('Marcus') + ' has to wipe his eyes before he can speak.'
        const words =
          `You gave me back my girl. … This ${charm} has hung over our ` +
          "door longer than there's been a Silver Stag. My grandmother said " +
          'it came out of the forest, and the forest would know it again. ' +
          'Take it. It kept this house. Let it keep you.'
        const tail =
          '[success]He presses the carved wood into your hands. ' +
          `You receive a ${charm}.[/success]`
        return direction + '\n\n' + dialogue(this.name, words) + '\n\n' + tail
      } else {
        const usual = dialogue(
          this.name,
          'My daughter is healthy and happy again. Hear her? Singing over ' +
            "the trays. Your room's free here as long as this house stands.",
        )
        if (gameState.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH)) return usual
        return (
          usual +
          '\n\n' +
          dialogue(
            this.name,
            "An ill wind, that's all it was. Bad luck, blown in off the " +
              'road, settling on the one soul in this house who never harmed ' +
              'anyone.',
          )
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
    const option = InnkeeperMarcus.IDLE_LINES[this.dialogueIndex]
    this.dialogueIndex =
      (this.dialogueIndex + 1) % InnkeeperMarcus.IDLE_LINES.length
    const name = this.name

    if (gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE)) {
      const dialogueBlock =
        dialogue(name, `${option} ${waresInfo.trim()}`) + '\n\n'
      const plea = dialogue(
        name,
        "You've spoken with " +
          characterName('Elena') +
          ". Then you've seen. She says she's only tired. … If you can " +
          'help her, name it, and this house will find it.',
      )
      const weekTheKingWent =
        '\n\n' +
        dialogue(
          name,
          'It came on her the week the king went. The whole town was out in ' +
            'the streets asking after him, and I was upstairs with a cold cloth.',
        )
      return dialogueBlock + plea + weekTheKingWent
    } else {
      const dialogueBlock =
        dialogue(name, `${option} ${waresInfo.trim()}`) + '\n\n'
      const closing = dialogue(
        name,
        "My girl, Elena. She's been poorly three weeks. … Talk to her, if " +
          "you've a kind word to spare. She'll tell it better than I can.",
      )
      return dialogueBlock + closing
    }
  }

  /** Handle buying items from Innkeeper Marcus. */
  override buyItem(gameState: GameState, itemName: string): string {
    const itemNameToBuy = itemName.toLowerCase()
    const seller = this.name

    // Check if item is available
    if (!(itemNameToBuy in this.wares)) {
      return dialogue(
        this.name,
        "I've rooms to let, and nothing else for sale.",
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
    const inventory = gameState.inventory
    if (
      inventory.some(
        (item) =>
          item.name.toLowerCase() === itemNameToBuy && item.canBeCarried,
      )
    ) {
      return dialogue(
        this.name,
        `You've a [item_name]${itemNameToBuy}[/item_name] already. ` +
          "One room's plenty for one guest.",
      )
    }

    // Purchase the item - spend coins using the batching system
    const coinsRemoved = gameState.removeItemFromInventory('coins', price)
    if (coinsRemoved !== price) {
      return '[failure]Transaction failed. Unable to process payment.[/failure]'
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
      const purchaseMsg =
        `[success]The [item_name]${itemNameToBuy}[/item_name] is yours for ` +
        `${price} [item_name]gold coins[/item_name]. ` +
        characterName('Marcus') +
        ' hands you a brass key and nods at the [item_name]door[/item_name] ' +
        'behind the bar.[/success]'
      const lodger = dialogue(
        seller,
        'That room upstairs? Its last lodger was a man in a grey cloak. ' +
          'Never gave a name, wrote half the night by candle, and was ' +
          'gone one morning without paying. It was the week the king ' +
          "went. I've aired it since. You'll find it clean.",
      )
      return purchaseMsg + '\n\n' + lodger
    } else {
      // Should not happen if item is in wares, but safety check
      return '[failure]An unexpected error occurred trying to rent the room.[/failure]'
    }
  }
}
