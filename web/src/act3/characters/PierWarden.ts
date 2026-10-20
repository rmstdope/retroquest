import { Character, type GameState, characterName, speech } from '@/engine'
import {
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
} from '../Act3StoryFlags'

/**
 * A watchful warden of the pier who comments on local happenings.
 *
 * The Pier Warden does not provide items or change quests; their dialogue
 * varies depending on whether the Tideward Sigils and Lanterns quests are
 * completed/activated.
 */
export class PierWarden extends Character {
  constructor() {
    super({
      name: 'Pier Warden',
      description:
        'A salt-crusted figure who tends the ruined jetty and watches ' +
        'for those who come and go.',
    })
  }

  /** Return context-sensitive dialogue about the pier and nearby ruins. */
  override talkTo(gameState: GameState): string {
    const sigils = gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)
    const lanterns = gameState.getStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)

    const name = this.name
    if (!sigils) {
      return (
        'The ' +
        characterName(name) +
        ' squints toward the shore. ' +
        speech(
          "'I'd mind the high stones if I were you. The markers " +
            'along the shore keep strange fragments—take heed and look for ' +
            "moon-signs before the tide turns.'",
        )
      )
    }

    if (sigils && !lanterns) {
      return (
        'The ' +
        characterName(name) +
        ' nods slowly. ' +
        speech(
          "'You've done right by the pillars. There's a fused locker " +
            'down in the vaults; I tried a key once but it stuck. Magic will ' +
            "loosen it, or so the old songs say.'",
        )
      )
    }

    return (
      'The ' +
      characterName(name) +
      ' looks out over the calmer water. ' +
      speech(
        "'With the sigils attuned and the lanterns lit, the way grows " +
          'steadier. Those who brave the sanctum find the tide less quick to ' +
          "swallow their steps.'",
      )
    )
  }
}
