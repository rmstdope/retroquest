import {
  Character,
  type GameState,
  type Item,
  characterName,
  event,
  speech,
} from '@/engine'
import { EntryPass } from '../items/EntryPass'
import { CastleApproach } from '../rooms/CastleApproach'

/** Court official who verifies credentials and grants audience passes. */
export class Herald extends Character {
  receivedPass = false

  constructor() {
    super({
      name: 'herald',
      description:
        'An official court herald wearing ornate robes bearing the royal arms. ' +
        'He examines documents and credentials for those seeking audience ' +
        'with nobility.',
    })
  }

  /** Ask for credentials, or confirm audience rights once the pass is registered. */
  override talkTo(_gameState: GameState): string {
    const name = this.name
    if (this.receivedPass) {
      return (
        characterName(name) +
        ': ' +
        speech(
          'Your credentials have been verified and you have been granted ' +
            'formal audience rights. You may proceed to meet with ' +
            characterName('Sir Cedric') +
            ' and other members of the court.',
        )
      )
    } else {
      return (
        characterName(name) +
        ': ' +
        speech(
          'Greetings, traveler. I must examine your credentials before you ' +
            'can be granted audience with the nobility. Do you have a formal ' +
            'pass or letter of recommendation? Forgive the quiet halls. Since King ' +
            'Alden vanished, half the court has gone home to wait for news.',
        )
      )
    }
  }

  /** Handle giving items to the Herald. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof EntryPass) {
      // Python calls current_room.enable_castle_courtyard() unconditionally;
      // only the Castle Approach room defines it.
      const room = gameState.currentRoom
      if (room instanceof CastleApproach) {
        room.enableCastleCourtyard()
      }
      this.receivedPass = true
      const name = this.name
      const itemName = item.name
      return (
        event(
          `You offer the [item_name]${itemName}[/item_name] to the ` +
            characterName(name) +
            '.',
        ) +
        `\n[success]You present the [item_name]${itemName}[/item_name] to ` +
        'the ' +
        characterName(name) +
        '. He examines the seal carefully and nods with approval. ' +
        speech(
          "'This is a formal recommendation of excellent standing. You are " +
            "granted formal audience rights with the nobility.'",
        ) +
        ' The pass has been officially registered.[/success]'
      )
    } else {
      return super.giveItem(gameState, item)
    }
  }
}
