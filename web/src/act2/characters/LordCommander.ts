import { Character, type GameState, type Item } from '@/engine'
import { SecretDocuments } from '../items/SecretDocuments'
import {
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_EXAMINED_SECRET_DOCUMENTS,
} from '../Act2StoryFlags'

/** The military leader of Greendale who can officially restore Sir Cedric's honor. */
export class LordCommander extends Character {
  constructor() {
    super({
      name: 'lord commander',
      description:
        'A distinguished military officer wearing elaborate ceremonial armor adorned ' +
        "with Greendale's coat of arms. His bearing speaks of years of command and " +
        "the authority to make important decisions affecting the realm's knights.",
    })
  }

  /** Return the Lord Commander's words, which follow Sir Cedric's case. */
  override talkTo(gameState: GameState): string {
    const name = `[character_name]${this.name}[/character_name]`
    if (gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)) {
      return (
        `The ${name} nods with satisfaction. ` +
        "[dialogue]'Sir Cedric's honor has been fully restored. The false accusations " +
        'against him have been officially stricken from the record. It brings me ' +
        'great pleasure to see justice served and a good knight ' +
        "vindicated.'[/dialogue]"
      )
    }
    if (gameState.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)) {
      // Player has the secret documents and should present them
      return (
        `The ${name} looks at you with interest. ` +
        "[dialogue]'I understand you have evidence regarding Sir Cedric's case? If " +
        'you have the secret documents that prove his innocence, please present them ' +
        "to me so I can officially restore his honor.'[/dialogue]"
      )
    }
    return (
      `The ${name} greets you formally. ` +
      "[dialogue]'Welcome to Greendale's Great Hall. I oversee the military affairs of " +
      'our realm and ensure that justice is served among our knights and ' +
      "soldiers.'[/dialogue]"
    )
  }

  /** Handle giving items to the Lord Commander, who accepts only the secret documents. */
  override giveItem(gameState: GameState, item: Item): string {
    const name = `[character_name]${this.name}[/character_name]`
    if (item instanceof SecretDocuments) {
      if (!gameState.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)) {
        return (
          `The ${name} examines the documents carefully but shakes his head. ` +
          "[dialogue]'These appear to be legal papers, but I need you to understand " +
          'their significance first. Please examine them thoroughly and then return ' +
          "to me.'[/dialogue]"
        )
      }

      // Player has examined the documents and understands their importance
      gameState.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)

      // Remove the documents from inventory
      const index = gameState.inventory.indexOf(item)
      if (index >= 0) gameState.inventory.splice(index, 1)

      return (
        `[success]The ${name} carefully reviews the secret documents. ` +
        'His expression grows solemn as he reads the testimonies and evidence. ' +
        "[dialogue]'These documents clearly prove Sir Cedric's innocence in the " +
        'Battle of Thornfield Pass. The accusations of cowardice were completely ' +
        'unfounded - he was following direct orders and protecting civilians. ' +
        "I hereby officially restore Sir Cedric's honor and expunge all false charges " +
        "from his record. Justice has been served at last.'[/dialogue][/success]"
      )
    }

    const itemName = `[item_name]${item.name}[/item_name]`
    return `The ${name} has no need for your ${itemName}.`
  }
}
