import { Quest, characterName, type GameState } from '@/engine'
import {
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SUPPLIES_QUEST_COMPLETED,
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_NYX_TRIALS_COMPLETED,
} from '../Act2StoryFlags'

const SIR_CEDRIC = characterName('Sir Cedric')
const NYX = characterName('Nyx')
const SPECTRAL_LIBRARIAN = characterName('Spectral Librarian')
const PROPHETIC_VISION = '[spell_name]Prophetic Vision[/spell_name]'

/** The opening journal entry, which is also the quest description. */
const OPENING_ENTRY =
  'Greendale is bigger than any place you have seen, but the talk in its ' +
  'streets is low and uneasy. People speak of a darkness gathering beyond ' +
  'the walls, and say that if anyone at the castle understands it, it is ' +
  SIR_CEDRIC +
  '.'

/**
 * Act II main quest tracking the narrative arc. `checkUpdate` composes layered
 * narrative segments, dimming earlier stages while appending the newest phase.
 */
export class TheGatheringStormQuest extends Quest {
  private flagState: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'The Gathering Storm',
      description: OPENING_ENTRY,
    })
  }

  /** This is the main quest for Act II. */
  override isMain(): boolean {
    return true
  }

  override checkTrigger(_gameState: GameState): boolean {
    return true // This quest is always active once Act II begins
  }

  override checkUpdate(gameState: GameState): boolean {
    let updated = false
    const earlier: string[] = []
    let newDesc = OPENING_ENTRY
    if (gameState.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)) {
      if (!this.flagState[FLAG_SPOKEN_TO_SIR_CEDRIC]) {
        this.flagState[FLAG_SPOKEN_TO_SIR_CEDRIC] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\n' +
        SIR_CEDRIC +
        ' calls it the Gathering ' +
        'Storm. He needs allies who know magic, but he will not trust you on ' +
        'your word alone. He wants to see you fight first, with the training ' +
        'sword.'
    }
    if (gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
      if (!this.flagState[FLAG_DEMONSTRATED_COMBAT_SKILLS]) {
        this.flagState[FLAG_DEMONSTRATED_COMBAT_SKILLS] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\n' +
        SIR_CEDRIC +
        ' watched you with the ' +
        'training sword and now trusts you. He wants you to find ' +
        NYX +
        ', deep in the Enchanted Forest, ' +
        'because her old wisdom may show what you are truly facing. He gave ' +
        'you a hundred and fifty coins for a survival kit, an enhanced ' +
        'lantern and rope from the Market District.'
    }
    if (gameState.getStoryFlag(FLAG_SUPPLIES_QUEST_COMPLETED)) {
      if (!this.flagState[FLAG_SUPPLIES_QUEST_COMPLETED]) {
        this.flagState[FLAG_SUPPLIES_QUEST_COMPLETED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\nThe survival kit, the lantern and the rope are packed. The ' +
        'merchants of Greendale have done what they can for you. The rest of ' +
        'the road leads to the edge of the Enchanted Forest.'
    }
    if (gameState.getStoryFlag(FLAG_ANCIENT_LIBRARY_COMPLETED)) {
      if (!this.flagState[FLAG_ANCIENT_LIBRARY_COMPLETED]) {
        this.flagState[FLAG_ANCIENT_LIBRARY_COMPLETED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\nBeneath Greendale, the ' +
        SPECTRAL_LIBRARIAN +
        ' taught you the dispel spell. The chronicle ' +
        'there was written by the Wardens of the Dawn, and their magic was ' +
        'the unbinding kind. Its last page warns that Malakar seeks the blood ' +
        'of Willowbrook.'
    }

    if (gameState.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)) {
      if (!this.flagState[FLAG_HERMITS_WARNING_COMPLETED]) {
        this.flagState[FLAG_HERMITS_WARNING_COMPLETED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\nAt the standing stones you opened the survival kit and studied ' +
        'its map, as the hermit urged. You know now which paths to take and ' +
        'which to avoid. Somewhere inside the forest, ' +
        NYX +
        ' is waiting.'
    }

    if (gameState.getStoryFlag(FLAG_NYX_TRIALS_COMPLETED)) {
      if (!this.flagState[FLAG_NYX_TRIALS_COMPLETED]) {
        this.flagState[FLAG_NYX_TRIALS_COMPLETED] = true
        updated = true
      }
      earlier.push(newDesc)
      newDesc =
        '\n\n' +
        NYX +
        ' judged you worthy and gave ' +
        'you the ' +
        PROPHETIC_VISION +
        ' spell, her token ' +
        'and the Forest Heart Crystal. She left you with the words from the ' +
        'glade stone: power follows purpose; purpose follows truth. When ' +
        'every other task in Greendale is done, cast the vision with ' +
        SIR_CEDRIC +
        ' beside you, so you can ' +
        'both see what is coming.'
    }

    this.setJournal(earlier, newDesc)
    return updated
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
  }
}
