import { Item, type GameState, event, writing } from '@/engine'
import { FLAG_READ_SQUIRES_DIARY } from '../Act2StoryFlags'

/** A personal diary containing clues about Sir Cedric's past and missing documents. */
export class SquiresDiary extends Item {
  constructor() {
    super({
      name: "squire's diary",
      shortName: 'diary',
      description:
        'A worn leather-bound diary belonging to a former squire. The pages are ' +
        'filled with observations about castle life and training exercises. There are ' +
        "also notes about Sir Cedric's supposed disgrace and details about events from " +
        'years ago.',
      canBeCarried: true,
    })
  }

  /** Use the diary: set story flag, remove the item, and return narrative text. */
  override use(gameState: GameState): string {
    // Set the flag that the squire's diary has been read
    gameState.setStoryFlag(FLAG_READ_SQUIRES_DIARY, true)

    // Remove the diary from inventory and/or current room after use
    const inventoryIndex = gameState.inventory.indexOf(this)
    if (inventoryIndex >= 0) gameState.inventory.splice(inventoryIndex, 1)
    const roomIndex = gameState.currentRoom.items.indexOf(this)
    if (roomIndex >= 0) gameState.currentRoom.items.splice(roomIndex, 1)

    // The quest should already be accepted by talking to Training Master
    return (
      event(
        "You carefully read through the squire's diary. The entries reveal " +
          'a troubling story...',
      ) +
      '\n\nEntry from three years ago:\n' +
      writing(
        "'Sir Cedric has been accused of " +
          'abandoning his post during the Battle of Thornfield Pass. ' +
          'Official reports claim he fled when the enemy charged, leaving ' +
          'his men behind. But this makes no sense - Sir Cedric is the most ' +
          "honorable knight I've ever known.'",
      ) +
      '\n\nLater entry:\n' +
      writing(
        "'I've been asking questions, and something doesn't add up. A merchant " +
          'caravan was due from Heavensforth, carrying secret military ' +
          "documents that could prove Sir Cedric's innocence. Those " +
          'documents contained witness testimonies and reports that showed ' +
          "the real truth about Thornfield Pass.'",
      ) +
      '\n\nFinal entry:\n' +
      writing(
        "'The caravan arrived, but the secret documents were nowhere to be " +
          'found. The merchants claimed they never received such documents. ' +
          'There were rumors of attacks and lost goods along the mountain ' +
          "roads. Without those documents, Sir Cedric's name could not be " +
          'cleared. I pray someone will find the truth and restore his ' +
          "honor.'",
      ) +
      '\n\n[success]The diary confirms what the Training Master ' +
      'suspected - secret documents from Heavensforth would clear Sir ' +
      "Cedric's name. They mysteriously went missing when the caravan " +
      "arrived. The lost caravan's documents might still be out " +
      'there...[/success]\n\n' +
      event(
        'After reading the diary, you place it back where you found it. ' +
          'This keeps the information safe while you no longer carry the ' +
          'diary.',
      )
    )
  }

  /** Return a short examination string describing the diary and its entries. */
  override examine(_gameState: GameState): string {
    return event(
      `You examine the [item_name]squire's diary[/item_name]. ${this.description}` +
        ' The handwriting is careful and deliberate. Several entries focus ' +
        "on Sir Cedric's disgrace and the missing evidence that could " +
        'clear his name.',
    )
  }
}
