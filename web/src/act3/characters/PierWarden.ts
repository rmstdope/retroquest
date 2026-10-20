import { Character, type GameState } from '@/engine'
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
        `The [character_name]${name}[/character_name] squints toward the shore. ` +
        "[dialogue]'I'd mind the high stones if I were you. The markers " +
        'along the shore keep strange fragments—take heed and look for ' +
        "moon-signs before the tide turns.'[/dialogue]"
      )
    }

    if (sigils && !lanterns) {
      return (
        `The [character_name]${name}[/character_name] nods slowly. ` +
        "[dialogue]'You've done right by the pillars. There's a fused locker " +
        'down in the vaults; I tried a key once but it stuck. Magic will ' +
        "loosen it, or so the old songs say.'[/dialogue]"
      )
    }

    return (
      `The [character_name]${name}[/character_name] looks out over the calmer water. ` +
      "[dialogue]'With the sigils attuned and the lanterns lit, the way grows " +
      'steadier. Those who brave the sanctum find the tide less quick to ' +
      "swallow their steps.'[/dialogue]"
    )
  }
}
