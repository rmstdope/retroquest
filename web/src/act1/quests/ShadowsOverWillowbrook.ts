import { characterName, Quest, type GameState } from '@/engine'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
} from '../Act1StoryFlags'

/**
 * Main Act I quest tracking the unfolding village corruption mystery.
 *
 * Rebuilds `description` on update, dimming prior segments and highlighting
 * the newest narrative beat. Uses an internal `flagState` record to avoid
 * repeating the same revelation more than once.
 */
export class ShadowsOverWillowbrookQuest extends Quest {
  private flagState: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'Shadows Over Willowbrook',
      description:
        'Strange events are plaguing the village: crops are withering, animals are ' +
        'restless, and villagers whisper of a shadowy figure seen at night. ' +
        'Investigate the source of these disturbances.',
      completion:
        `You have confirmed that a dark force is at work in Willowbrook. ${characterName('Mira')} ` +
        'warns you that your magical abilities may be the key to protecting ' +
        'the village.',
    })
  }

  override checkTrigger(_gameState: GameState): boolean {
    return true
  }

  /** Record a flag the first time it is seen; true when it was new. */
  private noteFlag(flag: string): boolean {
    if (this.flagState[flag]) return false
    this.flagState[flag] = true
    return true
  }

  override checkUpdate(gameState: GameState): boolean {
    let updated = false
    const earlier: string[] = []
    let newDesc =
      `${characterName('Elior')} dreams of a shadowy figure lurking in the fields, its presence felt ` +
      'even in the waking world. The dream is unsettling, leaving him with a sense ' +
      'of foreboding that something is wrong in Willowbrook.'
    if (gameState.getStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS)) {
      if (this.noteFlag(FLAG_INVESTIGATED_WITHERED_CROPS)) updated = true
      earlier.push(newDesc)
      newDesc =
        `\n${characterName('Elior')} has witnessed the devastation firsthand: once lush rows of crops now ` +
        'stand wilted and brown, their leaves curled and brittle. The earth beneath ' +
        'his feet is cracked and dry, and the air is thick with the scent of decay. ' +
        'Where there was once the promise of a bountiful harvest, there is now only ' +
        'ruin.'
    }
    if (gameState.getStoryFlag(FLAG_VILLAGER_TALKED_TO)) {
      if (this.noteFlag(FLAG_VILLAGER_TALKED_TO)) updated = true
      earlier.push(newDesc)
      newDesc =
        '\nVillagers speak in hushed tones of strange happenings: animals refusing to ' +
        `leave their shelters, and shadows moving where none should be. ${characterName('Elior')} senses ` +
        'the fear growing among his neighbors, and the mystery deepens.'
    }
    if (gameState.getStoryFlag(FLAG_WELL_EXAMINED)) {
      if (this.noteFlag(FLAG_WELL_EXAMINED)) updated = true
      earlier.push(newDesc)
      newDesc =
        '\nRumors spread of the village well: a foul stench rising from its depths, ' +
        `and water that no one dares to drink. ${characterName('Elior')} wonders if the source of the ` +
        'corruption lies beneath the surface.'
    }
    if (gameState.getStoryFlag(FLAG_CONNECT_WITH_NATURE)) {
      if (this.noteFlag(FLAG_CONNECT_WITH_NATURE)) updated = true
      earlier.push(newDesc)
      newDesc =
        `\n${characterName('Mira')} has urged ${characterName('Elior')} to connect with the living world and learn from its ` +
        'magic. The path forward is uncertain, but hope stirs in the heart of ' +
        'Willowbrook.'
    }
    if (gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      if (this.noteFlag(FLAG_MAGIC_FULLY_UNLOCKED)) updated = true
      earlier.push(newDesc)
      newDesc =
        `\n${characterName('Elior')} has proven his magical abilities are real. The villagers will look to ` +
        `him with new hope, and ${characterName('Mira')} believes he may be the key to dispelling the ` +
        `darkness. ${characterName('Mira')} tells ${characterName('Elior')} that his journey must continue to Greendale, where ` +
        "he is to seek out the old druid at the forest's edge. Only there can he learn " +
        "the deeper mysteries of nature's magic and find the knowledge needed to " +
        'save Willowbrook.'
    }
    this.setJournal(earlier, newDesc)
    return updated
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED)
  }

  override isMain(): boolean {
    return true
  }
}
