import { Item, type GameState, event, writing } from '@/engine'
import { FLAG_READ_SQUIRES_DIARY } from '../Act2StoryFlags'

/** The diary's description; `Act2.afterLoad` restores it in older saves. */
export const SQUIRES_DIARY_DESCRIPTION =
  'A worn leather-bound diary belonging to a former squire. The pages are ' +
  'filled with observations about castle life and training exercises. There are ' +
  "also notes about Sir Cedric's supposed disgrace and the night the king " +
  'vanished.'

/** A personal diary containing clues about Sir Cedric's past and missing documents. */
export class SquiresDiary extends Item {
  constructor() {
    super({
      name: "squire's diary",
      shortName: 'diary',
      description: SQUIRES_DIARY_DESCRIPTION,
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
      '\n\n' +
      '[italic]The morning after the king vanished:[/italic]' +
      '\n' +
      writing(
        "'They have taken Sir Cedric's sword. Two men of the night watch swear " +
          "he left the king's wall at the third bell. I was on the yard steps " +
          "until midnight, and he never moved.'",
      ) +
      '\n\n' +
      '[italic]Some days later:[/italic]' +
      '\n' +
      writing(
        "'One of those two watchmen is gone. He packed in the night and took " +
          'the road to Heavensforth, they say. A man with a clear conscience ' +
          "does not run.'",
      ) +
      '\n\n' +
      '[italic]Last entry:[/italic]' +
      '\n' +
      writing(
        "'A carter swears the watchman sent something back from Heavensforth, " +
          'papers, with a merchant caravan bound for Greendale. The caravan ' +
          'never came; they say it was lost on the forest road. If those ' +
          "papers are still out there, they could clear Sir Cedric's name.'",
      ) +
      '\n\n[success]The diary points to papers sent from Heavensforth by a ' +
      "watchman who fled, on a caravan that never arrived. The lost caravan's " +
      'papers might still be out there…[/success]\n\n' +
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
