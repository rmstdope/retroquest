import {
  dialogue,
  Character,
  type GameState,
  type Item,
  characterName,
  remembered,
  speech,
} from '@/engine'
import {
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_RUINS_LEFT,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_WARDEN_ASKED,
  FLAG_ACT3_WARDEN_COIN_PRESSED_BACK,
  FLAG_ACT3_WARDEN_BAD_SEASON_SAID,
  FLAG_ACT3_WARDEN_TRUTH_TOLD,
  VIRTUE_TRUTH,
} from '../Act3StoryFlags'
import { WeatheredCoin } from '../items/WeatheredCoin'

/** His question, asked once the curse has shown at the ruins. */
const QUESTION =
  "You'll have seen the causeway. Birds by the hundred, and the surf gone " +
  "grey. I've known bad seasons on this coast, forty years of them. It's " +
  "only a bad season, isn't it? Tell me the sea will mend on its own."

/** What he says, once, when Elior talks to him again without the truth. */
const BAD_SEASON =
  "Nothing to say? Then it's a bad season, and it'll pass. It always has."

/**
 * A watchful warden of the pier who comments on local happenings.
 *
 * The Pier Warden does not provide items or change quests; their dialogue
 * varies depending on whether the Tideward Sigils and Lanterns quests are
 * completed/activated. While the party is in the ruins and the curse has
 * shown, he also asks Elior for a comforting lie; telling him the truth is
 * an optional virtue moment.
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

  /**
   * Return context-sensitive dialogue about the pier and nearby ruins. The
   * first talk after the curse has shown ends with his question, the next
   * with his "bad season" line (once); the moment is gone when the ruins are
   * left.
   */
  override talkTo(gameState: GameState): string {
    return this.usualLine(gameState) + this.momentLine(gameState)
  }

  /** The question or the "bad season" line that follows the usual line, or ''. */
  private momentLine(gameState: GameState): string {
    if (
      !gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ) ||
      gameState.getStoryFlag(FLAG_ACT3_RUINS_LEFT) ||
      gameState.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)
    ) {
      return ''
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_WARDEN_ASKED)) {
      gameState.setStoryFlag(FLAG_ACT3_WARDEN_ASKED, true)
      return '\n' + speech(QUESTION)
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_WARDEN_BAD_SEASON_SAID)) {
      gameState.setStoryFlag(FLAG_ACT3_WARDEN_BAD_SEASON_SAID, true)
      return '\n' + speech(BAD_SEASON)
    }
    return ''
  }

  /**
   * Take the truth. Saying "truth" after he has asked tells him the curse is
   * no season: his reply and the remembered line, recorded once. Before he
   * has asked he is lost; afterwards he keeps it. Other words, and anything
   * once the ruins are left, get the usual reply.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (
      words.trim().toLowerCase() !== 'truth' ||
      gameState.getStoryFlag(FLAG_ACT3_RUINS_LEFT)
    ) {
      return super.sayTo(gameState, words)
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_WARDEN_ASKED)) {
      return dialogue(this.name, 'The truth about what, lad? Speak plain.')
    }
    if (gameState.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)) {
      return dialogue(
        this.name,
        "You've told me, lad, and I'll not forget it. The boats are " +
          'staying in.',
      )
    }
    gameState.setStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD, true)
    gameState.addVirtue(VIRTUE_TRUTH)
    return (
      `You tell the ${characterName(this.name)} what you know: this is ` +
      'no season. Something is draining the king, and the sea with him, ' +
      'and it is getting worse.' +
      '\n' +
      speech(
        '… Aye. I think I knew it, and only wanted someone to say ' +
          "otherwise. Better a hard truth than a soft lie. I'll send word up " +
          'the coast to keep the boats in.',
      ) +
      '\n' +
      remembered('Truth')
    )
  }

  /**
   * Refuse the Weathered Coin once Elior has told him the truth: he presses
   * it back (the first time, which also rewrites the coin's description) or
   * waves it away (every time after). The coin stays with Elior. Anything
   * else, or the coin before the truth, gets the usual reply.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (
      !(item instanceof WeatheredCoin) ||
      !gameState.getStoryFlag(FLAG_ACT3_WARDEN_TRUTH_TOLD)
    ) {
      return super.giveItem(gameState, item)
    }
    if (gameState.getStoryFlag(FLAG_ACT3_WARDEN_COIN_PRESSED_BACK)) {
      return (
        `The ${characterName(this.name)} pushes your hand away.` +
        '\n' +
        speech('I said keep it, lad.')
      )
    }
    gameState.setStoryFlag(FLAG_ACT3_WARDEN_COIN_PRESSED_BACK, true)
    item.pressedBack()
    return (
      `The ${characterName(this.name)} turns the coin over once, then ` +
      'folds your fingers back around it.' +
      '\n' +
      speech('Keep it. Toll for the crossing, my da said.')
    )
  }

  /** The usual line for the quest stage. */
  private usualLine(gameState: GameState): string {
    const sigils = gameState.getStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED)
    const lanterns = gameState.getStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)

    const name = this.name
    if (!sigils) {
      return (
        'The ' +
        characterName(name) +
        ' squints toward the shore. ' +
        speech(
          "I'd mind the high stones if I were you. The markers " +
            'along the shore keep strange fragments—take heed and look for ' +
            'moon-signs before the tide turns.',
        )
      )
    }

    if (sigils && !lanterns) {
      return (
        'The ' +
        characterName(name) +
        ' nods slowly. ' +
        speech(
          "You've done right by the pillars. There's a fused locker " +
            "down in the vaults; I tried a key once but it stuck. Key's no " +
            "good alone, and magic's no good alone. It wants both.",
        )
      )
    }

    return (
      'The ' +
      characterName(name) +
      ' looks out over the calmer water. ' +
      speech(
        'With the sigils attuned and the lanterns lit, the way grows ' +
          'steadier. Those who brave the sanctum find the tide less quick to ' +
          'swallow their steps.',
      ) +
      '\n' +
      speech(
        'My da walked that water once, when the old wardens still asked it ' +
          'of folk. Said the trick was not to leave yourself behind in the ' +
          'dark. I never did understand him.',
      )
    )
  }
}
