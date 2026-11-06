import {
  Character,
  type GameState,
  type Item,
  type NameOptions,
  characterName,
  speech,
  attributeSpeech,
} from '@/engine'
import { Candle } from '../items/Candle'
import { Locket } from '../items/Locket'
import { Matches } from '../items/Matches'
import { RuneToken } from '../items/RuneToken'
import { BlessSpell } from '../spells/BlessSpell'
import {
  FLAG_JOURNEY_BLESS_COMPLETED,
  FLAG_PRIEST_BLESSED,
  FLAG_PRIEST_TALKED_TO,
} from '../Act1StoryFlags'

/** The byword for Malakar, said anywhere in the words. */
const MALAKAR = /malakar/i

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
        `The chapel's ${characterName('priest')}, thin and a little ` +
        'stooped, with old candle wax on both sleeves.',
    })
  }

  /** Named by what it is, so it reads "the priest" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /**
   * He gently gives any gift back; the rune token he reads as a mark cut
   * for harm, and the matches he asked for he hands back warmly, asking
   * Elior to light the candle (or thanking Elior once it is lit). Only the
   * token's and the matches' replies name what they are.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof Matches) {
      return attributeSpeech(this.name, this.matchesAnswer(gameState))
    }
    if (item instanceof RuneToken) {
      return attributeSpeech(
        this.name,
        `The ${characterName(this.name)} does not take it. He looks at the ` +
          'rune a long while. ' +
          speech(
            'Whoever cut that meant harm by it, child. That is no mark the ' +
              'founders made.',
          ) +
          ' He hands it back by its edge, as he would a hot coal. ' +
          speech(
            'Keep it close, and pray you never meet the hand that made it.',
          ),
      )
    }
    return attributeSpeech(
      this.name,
      `The ${characterName(this.name)} shakes his head and folds your ` +
        'fingers back over it. ' +
        speech('Keep it, child. The road will want it more than I do.'),
    )
  }

  /**
   * His answer to the matches: he hands them back and asks Elior to light
   * the candle, or lets Elior keep them once it is lit.
   */
  private matchesAnswer(gameState: GameState): string {
    const priest = characterName(this.name)
    const candle = gameState.getItem('candle')
    if (candle instanceof Candle && candle.isLit) {
      return (
        `The ${priest} glances at the candle burning by the altar and ` +
        'closes your hand around the box. ' +
        speech('The candle is lit, child, and that was your doing. Keep them.')
      )
    }
    return (
      `The ${priest} turns the box over once, smiling, and presses it back ` +
      'into your hand. ' +
      speech(
        'Bless you, child. Will you light it for me? My hands shake more ' +
          'than the flame likes.',
      )
    )
  }

  /** Tell the founders' story the first time, then answer to Elior's progress. */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What the priest answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_PRIEST_TALKED_TO)) {
      gameState.setStoryFlag(FLAG_PRIEST_TALKED_TO, true)
      return this.firstTalk()
    }
    return this.progressTalk(gameState)
  }

  /** The greeting, the story of the founders, the relic and the bell, and the matches. */
  private firstTalk(): string {
    return (
      `The ${characterName(this.name)} looks up from the altar. ` +
      speech(
        'Come in, child, and shut the door behind you. The draught gets at ' +
          'the candles.',
      ) +
      ' He looks at the cold wick. ' +
      speech('It would, if I had one lit.') +
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
        "And now I can't even light a candle in their chapel. I'm out of " +
          `matches. ${characterName('Hemlock')} keeps a box for me under ` +
          'his counter; he has never once let me pay. ' +
          "If you're passing the [room_name]General Store[/room_name]...",
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
        `The ${priest} looks at the locket in your hand, at the tree under ` +
        'two moons on it, and then up at the door. ' +
        speech(
          'Thank you for the light, child. Show that to your ' +
            `${characterName('grandmother')}. ` +
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

  /**
   * Touches the altar rail at the byword "Malakar", the way the village
   * knocks on wood, the same every time; any other word gets his
   * turn-taking answers.
   */
  override sayTo(gameState: GameState, words: string): string {
    if (!MALAKAR.test(words)) return super.sayTo(gameState, words)
    return attributeSpeech(
      this.name,
      `${this.nameInSentence({ atStart: true })} touches the altar rail, quick, the way the village knocks on wood. ` +
        speech(
          'Not in the chapel, child. That word has never done Willowbrook any good.',
        ),
    )
  }

  /** The two answers to a word with no particular reply, given in turn. */
  protected override unknownWordAnswers(): readonly string[] {
    return [
      `${this.nameInSentence({ atStart: true })} folds his hands. ` +
        speech(
          'I have heard a great many words in this chapel, child. ' +
            'Not all of them were meant for me.',
        ),
      `${this.nameInSentence({ atStart: true })} smiles. ` +
        speech('If it is a prayer, child, it is not one of ours.'),
    ]
  }
}
