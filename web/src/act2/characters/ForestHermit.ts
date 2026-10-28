import {
  Character,
  type GameState,
  characterName,
  speech,
  type NameOptions,
} from '@/engine'
import { ProtectiveCharm } from '../items/ProtectiveCharm'
import {
  FLAG_HERMITS_WARNING_ACCEPTED,
  FLAG_HERMITS_WARNING_COMPLETED,
} from '../Act2StoryFlags'

/**
 * Wilderness mentor who grants a protective charm and warns of deeper trials.
 *
 * The first interaction grants a ProtectiveCharm and sets the acceptance flag;
 * later talks repeat the camp clue until the player has camped here, then
 * tell the player the forest is ready for them.
 */
export class ForestHermit extends Character {
  hasWarned = false
  charmGiven = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'forest hermit',
      description:
        'A thin figure in moss-green robes, weathered by years outdoors. ' +
        'Charms of bark, bone and braided grass hang from their belt. Every ' +
        'so often they glance at the treeline, the way you would at someone ' +
        'who might be listening.',
    })
  }

  /** Warn the player and give the charm once, then send the player to camp, then on. */
  override talkTo(gameState: GameState): string {
    if (!this.hasWarned) {
      this.hasWarned = true
      this.charmGiven = true

      // Give protective charm and complete "The Hermit's Warning" quest
      const protectiveCharm = new ProtectiveCharm()
      gameState.addItemToInventory(protectiveCharm)
      // Quest will be activated by the Forest Transition room when appropriate
      // Set quest completion flag
      gameState.setStoryFlag(FLAG_HERMITS_WARNING_ACCEPTED, true)
      return (
        'The ' +
        characterName(this.name) +
        ' looks at the treeline first, and only then at you. ' +
        speech(
          "You're going in. She's in a sour mood this season, so mind yourself.",
        ) +
        '\n\n' +
        speech(
          "She moves her paths when she's bored, and she keeps old things " +
            "in her that don't care for strangers. Everything that lives in " +
            'there is hers. Ask before you take, and never take more than you ' +
            'give.',
        ) +
        '\n\n' +
        speech(
          'But you... there is old magic on you, and not of your own making. ' +
            "She'll notice it. Take this charm—it's my mark; it tells her " +
            "you're under my protection. And don't walk in tonight. Make " +
            'camp out here first, where she can get a look at you.',
        ) +
        '\n\n' +
        'You receive a [item_name]protective charm[/item_name].'
      )
    } else if (!gameState.getStoryFlag(FLAG_HERMITS_WARNING_COMPLETED)) {
      return (
        'The ' +
        characterName(this.name) +
        ' looks at the treeline, then at your pack. ' +
        speech('Not tonight. Make camp first; let her get a look at you.')
      )
    } else {
      return (
        'The ' +
        characterName(this.name) +
        ' tilts their head toward the trees. ' +
        speech(
          "She knows you're coming now. Go on, before she changes her mind.",
        )
      )
    }
  }
}
