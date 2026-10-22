import {
  Character,
  type GameState,
  event,
  characterName,
  speech,
} from '@/engine'
import { Candle } from '../items/Candle'
import { Locket } from '../items/Locket'
import { BlessSpell } from '../spells/BlessSpell'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_PRIEST_BLESSED,
  FLAG_PRIEST_TALKED_TO,
} from '../Act1StoryFlags'

/**
 * The chapel's kindly priest. He keeps the story of the village founders,
 * their relic and the bell, and his words follow Elior's progress: the
 * matches, the lit candle, the founders' locket and the bless spell.
 */
export class Priest extends Character {
  constructor() {
    super({
      name: 'priest',
      description:
        `A kindly ${characterName('priest')} who tends the chapel, ` +
        'offering blessings ' +
        'and sharing the lore of Eldoria.',
    })
  }

  /** Tell the founders' story the first time, then answer to Elior's progress. */
  override talkTo(gameState: GameState): string {
    const eventMsg = event(`You speak with the ${characterName(this.name)}.`)
    if (!gameState.getStoryFlag(FLAG_PRIEST_TALKED_TO)) {
      gameState.setStoryFlag(FLAG_PRIEST_TALKED_TO, true)
      return eventMsg + '\n' + this.firstTalk()
    }
    return eventMsg + '\n' + this.progressTalk(gameState)
  }

  /** The greeting, the story of the founders, the relic and the bell, and the matches. */
  private firstTalk(): string {
    return (
      `The ${characterName(this.name)} offers a serene smile. ` +
      speech(
        'Welcome, child. The chapel is a sanctuary for all who seek peace. ' +
          'The shadows in our land grow long, but faith can be a guiding light.',
      ) +
      '\nHe glances up at the bell rope. ' +
      speech(
        'When the founders came to this valley, they brought a relic with ' +
          'them, and they hung that bell to watch over it. Their mark was a ' +
          'tree under two moons; it is cut over the door, if you look, though ' +
          'the weather has nearly had it. ' +
          'The relic passed quietly down their line, until one night, years ' +
          'ago, it was lost, and the bell rang at midnight with no hand on ' +
          'the rope.',
      ) +
      '\nHe sighs. ' +
      speech(
        'And now I cannot even light a candle against the dark. ' +
          'I am out of matches, and I usually get them for free from the ' +
          'General Store. Could you bring me some?',
      )
    )
  }

  /** One short line for where Elior stands now; the latest milestone wins. */
  private progressTalk(gameState: GameState): string {
    const priest = characterName(this.name)
    if (gameState.getStoryFlag(FLAG_PRIEST_BLESSED)) {
      return (
        `The ${priest} bows his head, his hands still warm with your ` +
        'blessing. ' +
        speech(
          'I have spoken that prayer over others a thousand times and never ' +
            'once received it. Thank you, child.',
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_JOURNEY_BLESS_COMPLETED)) {
      return (
        `The ${priest} studies you for a long moment, then smiles. ` +
        speech(
          "The blessing sits well on you. The founders' light has not gone " +
            'out of their line after all. Go gently on the road.',
        )
      )
    }
    if (gameState.inventory.some((item) => item instanceof Locket)) {
      return (
        `The ${priest} nods at the locket in your hand. ` +
        speech(
          'Thank you for the light, child. Keep that locket close, and show ' +
            `it to your ${characterName('grandmother')}. ` +
            'She will know it better than I.',
        )
      )
    }
    if (gameState.hasSpell(new BlessSpell().id)) {
      return (
        `The ${priest} smiles. ` +
        speech(
          'The chapel is brighter for your kindness, child. The founders ' +
            'would be glad of you.',
        )
      )
    }
    const candle = gameState.getItem('candle')
    if (candle instanceof Candle && candle.isLit) {
      return (
        `The ${priest} points to the corner by the altar, where the ` +
        'candlelight glints on silver. ' +
        speech('Look there, child. The light has found something.')
      )
    }
    return (
      `The ${priest} glances at the cold candle by the altar. ` +
      speech(
        'Any luck with those matches, child? The General Store has always ' +
          'been kind to this chapel.',
      )
    )
  }
}
