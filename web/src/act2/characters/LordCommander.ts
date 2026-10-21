import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
} from '@/engine'
import { SirCedric } from './SirCedric'
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
    const name = characterName(this.name)
    if (gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)) {
      return (
        `The ${name} nods with satisfaction. ` +
        speech(
          "'Sir Cedric's knighthood is restored and the charge struck from the " +
            'record. As for the name in that letter, I have sent riders to ' +
            'Heavensforth for the watchman who wrote it. Whoever paid in that ' +
            "name will be found.'",
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)) {
      // Player carries the examined papers and should present them
      return (
        `The ${name} looks at you with interest. ` +
        speech(
          "'I am told you carry papers touching on Sir Cedric's case, and on " +
            'the night His Majesty vanished. If they bear on either, give them ' +
            "to me.'",
        )
      )
    }
    return (
      `The ${name} greets you formally. ` +
      speech(
        "'Welcome to Greendale's Great Hall. I oversee the military affairs of " +
          'our realm and, since King Alden vanished, I hold his court in his ' +
          'name. If you hear any word of His Majesty, you bring it to me ' +
          "first.'",
      )
    )
  }

  /** Handle giving items to the Lord Commander, who accepts only the secret documents;
   * clearing Cedric's name also returns his sword, which changes his description. */
  override giveItem(gameState: GameState, item: Item): string {
    const name = characterName(this.name)
    if (item instanceof SecretDocuments) {
      if (!gameState.getStoryFlag(FLAG_EXAMINED_SECRET_DOCUMENTS)) {
        return (
          `The ${name} glances at the papers and hands them back. ` +
          speech(
            "'A confession and a letter, but about what? Read them and know " +
              "what you bring me, then return.'",
          )
        )
      }

      // The player has examined the papers and understands them
      gameState.setStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED, true)
      for (const room of Object.values(gameState.allRooms))
        for (const character of room.characters)
          if (character instanceof SirCedric)
            character.refreshDescription(gameState)

      // Remove the documents from inventory
      const index = gameState.inventory.indexOf(item)
      if (index >= 0) gameState.inventory.splice(index, 1)

      return (
        `[success]The ${name} reads the confession, then the letter. At its ` +
        'last line his face goes grey. ' +
        speech(
          "'This is the old court script. It reads: [italic]By the will of " +
            "Malakar.[/italic]'",
        ) +
        ' He lowers the page. ' +
        speech(
          "'Malakar is a name from children's tales. Yet someone paid gold in " +
            'it, and on that night of all nights. Sir Cedric did not leave his ' +
            'post. He was chosen to carry the blame. I hereby restore his ' +
            "knighthood and strike the charge from the record.'",
        ) +
        ' He beckons a page and speaks a few quiet words. The boy runs off ' +
        'toward the armoury, and returns carrying a long bundle wrapped in ' +
        'oilcloth. ' +
        speech(
          "'Take this to the training yard. A knight should not stand among " +
            "his squires with an empty scabbard.'",
        ) +
        '[/success]'
      )
    }

    const itemName = `[item_name]${item.name}[/item_name]`
    return `The ${name} has no need for your ${itemName}.`
  }
}
