import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
  dialogue,
  type NameOptions,
} from '@/engine'
import { EntryPass } from '../items/EntryPass'
import { CastleApproach } from '../rooms/CastleApproach'

/** Court official who verifies credentials and grants audience passes. */
export class Herald extends Character {
  receivedPass = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'herald',
      description:
        'A thin man in a tabard of the royal arms, a ledger open on a stand ' +
        'beside him. He looks hard at every seal and not at much else.',
    })
  }

  /** Ask for credentials, or confirm audience rights once the pass is registered. */
  override talkTo(_gameState: GameState): string {
    const name = this.name
    if (this.receivedPass) {
      return dialogue(
        name,
        'Your credentials have been verified. The courtyard is through the ' +
          'west arch; you will find ' +
          characterName('Sir Cedric') +
          ' there.',
      )
    } else {
      return dialogue(
        name,
        'Greetings, traveler. I must examine your credentials before you ' +
          'pass into the courtyard. A sealed pass will do, or a letter. ' +
          'Forgive the quiet halls. Since King Alden vanished, half the ' +
          'court has gone home to wait for news.',
      )
    }
  }

  /** Handle giving items to the Herald. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof EntryPass) {
      // Only the Castle Approach has a courtyard exit to open.
      const room = gameState.currentRoom
      if (room instanceof CastleApproach) {
        room.enableCastleCourtyard()
      }
      this.receivedPass = true
      const name = this.name
      return (
        '[success]The ' +
        characterName(name) +
        ' examines the seal carefully and nods with approval. ' +
        speech('A sound seal. You may pass into the courtyard.') +
        ' He does not look at the line above the seal, where the name has ' +
        'been scraped away. He writes something in his ledger.[/success]'
      )
    } else {
      return super.giveItem(gameState, item)
    }
  }
}
