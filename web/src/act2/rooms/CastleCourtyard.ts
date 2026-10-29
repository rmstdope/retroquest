import { Room, characterName, clue } from '@/engine'
import type { GameState } from '@/engine'
import { SirCedric } from '../characters/SirCedric'
import { TrainingMaster } from '../characters/TrainingMaster'
import { Squires } from '../characters/Squires'
import { SquiresDiary } from '../items/SquiresDiary'
import {
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_SQUIRES_TALKED_TO,
  FLAG_VISION_SHARED,
} from '../Act2StoryFlags'

/** The Castle Courtyard description; `Act2.afterLoad` restores it in older saves. */
export const CASTLE_COURTYARD_DESCRIPTION =
  'An expansive courtyard within the castle walls, featuring training grounds ' +
  'where knights practice their swordwork. Ancient oak trees provide shade for ' +
  'stone benches, and a stable houses magnificent warhorses, though half its ' +
  "stalls stand empty since the king's own guard rode out to search for him. " +
  "The castle's main hall rises before you, its great doors carved with the " +
  "symbols of Greendale's noble houses."

/**
 * Castle Courtyard room: martial training hub with dialogue-gated hidden diary.
 *
 * `search()` grants the Squire's Diary only after FLAG_SQUIRES_TALKED_TO is set;
 * `diaryFound` keeps the injection idempotent. `descriptionFor()` adds Cedric's
 * waiting line between the shared vision and the end of the act.
 */
export class CastleCourtyard extends Room {
  diaryFound = false

  constructor() {
    super({
      name: 'Castle Courtyard',
      description: CASTLE_COURTYARD_DESCRIPTION,
      items: [],
      characters: [new SirCedric(), new TrainingMaster(), new Squires()],
      exits: {
        east: 'CastleApproach',
        north: 'ResidentialQuarter',
        west: 'GreatHall',
      },
    })
  }

  /** Leaving the courtyard mid-bout abandons it: Cedric starts the bout over next time. */
  override onEnter(_gameState: GameState): void {
    for (const character of this.characters)
      if (character instanceof SirCedric) character.abandonBout()
  }

  /** The description, with Cedric's waiting line while he waits for Elior to answer the vision. */
  override descriptionFor(gameState: GameState): string {
    if (
      gameState.getStoryFlag(FLAG_VISION_SHARED) &&
      !gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
    )
      return (
        this.description +
        `\n\n${characterName('Sir Cedric')} is still waiting for you, his ` +
        'hand on his sword.'
      )
    return this.description
  }

  /** Search for the hidden diary after the prerequisite dialogue. */
  override search(gameState: GameState): string {
    if (!this.diaryFound) {
      // Check if squires have been talked to first
      if (!gameState.getStoryFlag(FLAG_SQUIRES_TALKED_TO)) {
        return clue(
          'You find nothing under the benches but old leaves. A few of the ' +
            'squires watch you look, and whisper.',
        )
      }

      // Add the squire's diary when searching under stone benches (after talking to squires)
      const diary = new SquiresDiary()
      this.addItem(diary)
      this.diaryFound = true
      return (
        'Remembering what the squires told you, you look more carefully ' +
        'under one of the ancient stone benches and discover a worn ' +
        'leather diary that appears to have been left by a former squire.' +
        "\n\n[success]You found a [item_name]squire's " +
        'diary[/item_name]![/success]'
      )
    }
    return "[failure]You've already searched this area thoroughly.[/failure]"
  }
}
