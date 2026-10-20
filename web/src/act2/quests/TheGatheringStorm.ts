import { Quest, type GameState } from '@/engine'
import {
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SUPPLIES_QUEST_COMPLETED,
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_NYX_TRIALS_COMPLETED,
} from '../Act2StoryFlags'

/**
 * Act II main quest tracking the narrative arc. `checkUpdate` composes layered
 * narrative segments, dimming earlier stages while appending the newest phase.
 */
export class TheGatheringStormQuest extends Quest {
  private flagState: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'The Gathering Storm',
      description:
        'Having just arrived in the bustling city of Greendale, Elior senses an ' +
        'ominous presence growing in the shadows. Strange whispers speak of dark ' +
        'forces gathering strength, threatening the peace of both the city and ' +
        'the surrounding lands. To understand the true nature of this emerging ' +
        'threat and find a way to combat it, Elior must seek out Sir Cedric, the ' +
        'respected knight commander, who may hold crucial knowledge about the ' +
        'darkness that approaches.',
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
    this.description = ''
    let newDesc =
      'Having just arrived in the bustling city of Greendale, Elior senses an ' +
      'ominous presence growing in the shadows. Strange whispers speak of dark ' +
      'forces gathering strength, threatening the peace of both the city and ' +
      'the surrounding lands. To understand the true nature of this emerging ' +
      'threat and find a way to combat it, Elior must seek out Sir Cedric, the ' +
      'respected knight commander, who may hold crucial knowledge about the ' +
      'darkness that approaches.'
    if (gameState.getStoryFlag(FLAG_SPOKEN_TO_SIR_CEDRIC)) {
      if (!this.flagState[FLAG_SPOKEN_TO_SIR_CEDRIC]) {
        this.flagState[FLAG_SPOKEN_TO_SIR_CEDRIC] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        '\n\nSir Cedric has explained that dark forces are gathering and he needs ' +
        'allies with magical knowledge. '
    }
    if (gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
      if (!this.flagState[FLAG_DEMONSTRATED_COMBAT_SKILLS]) {
        this.flagState[FLAG_DEMONSTRATED_COMBAT_SKILLS] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        '\n\nHaving proven your martial prowess with the training sword, you ' +
        "have earned Sir Cedric's trust in your combat abilities. This " +
        'demonstration of skill has strengthened your position as a valuable ' +
        'ally in the fight against the growing darkness. Sir Cedric has ' +
        'revealed the true scope of the mission: you must journey into the ' +
        'enchanted forest to seek out the mystical being known as Nyx, who ' +
        'possesses ancient knowledge that could help combat the gathering ' +
        'shadows. Before attempting this dangerous quest, you need to gather ' +
        'essential supplies from the Market District: a forest survival kit, ' +
        'enhanced lantern, and quality rope. Time is of the essence, as the ' +
        "darkness grows stronger each day, and only Nyx's ancient wisdom may " +
        'hold the key to understanding and defeating these otherworldly ' +
        'threats.'
    }
    if (gameState.getStoryFlag(FLAG_SUPPLIES_QUEST_COMPLETED)) {
      if (!this.flagState[FLAG_SUPPLIES_QUEST_COMPLETED]) {
        this.flagState[FLAG_SUPPLIES_QUEST_COMPLETED] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        '\n\nWith all the essential supplies now gathered - the forest survival ' +
        'kit, enhanced lantern, and quality rope - you are properly equipped ' +
        "for the dangerous journey into the enchanted forest. The merchant's " +
        'guidance and the quality of the equipment give you confidence that ' +
        'you can navigate the magical perils ahead. Now fully prepared, the ' +
        'path to finding Nyx and unlocking the ancient wisdom needed to ' +
        'combat the growing darkness lies before you. The forest awaits, and ' +
        'with it, the answers that could save both Greendale and the surrounding ' +
        'lands from the encroaching shadow.'
    }
    if (gameState.getStoryFlag(FLAG_ANCIENT_LIBRARY_COMPLETED)) {
      if (!this.flagState[FLAG_ANCIENT_LIBRARY_COMPLETED]) {
        this.flagState[FLAG_ANCIENT_LIBRARY_COMPLETED] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        '\n\nThe ancient hidden library has revealed its secrets! Through the ' +
        "Spectral Librarian's guidance, you have uncovered crucial knowledge " +
        'about your family heritage and learned the powerful dispel spell. ' +
        'The ancient prophecies speak of a Chosen One destined to face the ' +
        'returning darkness, and the revelation of your lineage suggests you ' +
        'may be central to this cosmic struggle. Armed with this newfound ' +
        'understanding of both your destiny and the magical arts, you now ' +
        'possess the knowledge and power needed to confront the gathering ' +
        'storm. The pieces of the puzzle are falling into place, and with ' +
        'each revelation, the path to finding Nyx and ultimately defeating ' +
        'the encroaching shadow becomes clearer.'
    }

    if (gameState.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)) {
      if (!this.flagState[FLAG_HERMITS_WARNING_COMPLETED]) {
        this.flagState[FLAG_HERMITS_WARNING_COMPLETED] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        "\n\nBy heeding the Hermit's warning and properly preparing with the " +
        'survival kit, you have successfully navigated the threshold between ' +
        'the civilized world and the wild Enchanted Forest. The ancient ' +
        "protective runes have recognized your readiness, and the forest's " +
        "guardians have granted you safe passage. With the hermit's blessing " +
        'and proper preparation, you can now venture into the mystical realm ' +
        'where Nyx awaits. The path forward is clear, and the final phase of ' +
        'your quest to understand and combat the gathering darkness can begin.'
    }

    if (gameState.getStoryFlag(FLAG_NYX_TRIALS_COMPLETED)) {
      if (!this.flagState[FLAG_NYX_TRIALS_COMPLETED]) {
        this.flagState[FLAG_NYX_TRIALS_COMPLETED] = true
        updated = true
      }
      this.description += '[dim]' + newDesc + '[/dim]'
      newDesc =
        '\n\nThe trials are complete! You have successfully met with Nyx, the ' +
        'ancient forest sprite, and proven yourself worthy of her greatest ' +
        'gifts. Through your demonstration of wisdom, compassion, and ' +
        'courage throughout your journey, Nyx has blessed you with the ' +
        'sacred prophetic vision spell - the power to see glimpses of ' +
        'possible futures and understand the threads of fate. Along with ' +
        "this ultimate magical ability, you have received Nyx's Token as a " +
        'symbol of your alliance with the forest spirits, and the Forest ' +
        "Heart Crystal containing the very essence of nature's power. With " +
        'these powerful tools and newfound magical sight, you are now ready ' +
        'to face the gathering storm and protect both Greendale and the ' +
        'surrounding lands from the darkness that threatens to consume them ' +
        'all.'
    }

    this.description += newDesc
    return updated
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)
  }
}
