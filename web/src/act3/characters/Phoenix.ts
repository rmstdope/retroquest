import {
  Character,
  type GameState,
  characterName,
  speech,
  saysAnyOf,
  type NameOptions,
} from '@/engine'
import { CEDRIC_FEATHER_GLANCE, cedricAdds } from '../CedricLines'
import { PhoenixFeather } from '../items/PhoenixFeather'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_INSCRIPTION_MENDED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_PHOENIX_STORY_TOLD,
} from '../Act3StoryFlags'

/**
 * Words the Phoenix accepts as the answer to its riddle, matched only as whole
 * words so that "impatience" or "please" do not earn the feather.
 */
const RIDDLE_ANSWERS = [
  'patience',
  'patient',
  'patiently',
  'calm',
  'calmly',
  'calmness',
  'ease',
]

/**
 * The Phoenix's replies to answers close to the riddle's, each with the words
 * that earn it (whole words, checked after the right answers). Each says
 * something true about the Warden of Wisdom, who is never named.
 */
const NEAR_MISSES: readonly { words: readonly string[]; reply: string }[] = [
  {
    words: ['wait', 'waiting'],
    reply:
      'Anyone can wait while time is long. What is it called when time is ' +
      'short, and you wait anyway?',
  },
  {
    words: ['haste', 'speed', 'hurry'],
    reply: 'That was his answer, in the end. It was not wisdom.',
  },
  {
    words: ['knowledge', 'learning'],
    reply: 'He had knowledge enough. It did not stop him.',
  },
  {
    words: ['courage'],
    reply:
      "Courage was his friend's to carry. This feather was made for " +
      'something else.',
  },
]

/** A telepathic phoenix who poses a riddle about patience. */
export class Phoenix extends Character {
  private riddlePosed = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'Phoenix',
      description:
        "A phoenix the size of a cottage roof lies in the crater's glass. " +
        'Its feathers go from gold to red as it breathes, and it watches you ' +
        'without any hurry.',
    })
  }

  /**
   * Poses the telepathic riddle with a hint at the Warden of Wisdom; once the
   * feather is earned the riddle is no longer asked and the Phoenix bids farewell;
   * on the first such talk after the Charred Inscription has been read, it first
   * tells, once, who struck Malakar's name deeper; once the name is mended it
   * adds that Elior gave him back his place.
   */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
      const story =
        gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ) &&
        !gameState.getStoryFlag(FLAG_ACT3_PHOENIX_STORY_TOLD)
      if (story) {
        gameState.setStoryFlag(FLAG_ACT3_PHOENIX_STORY_TOLD, true)
      }
      return (
        'The ' +
        characterName('phoenix') +
        ' inclines its head. ' +
        (story
          ? speech(
              'You saw his name on the terraces, burned deeper than the ' +
                'others. No fire did that. He came back, years after, and ' +
                'struck it again himself, to cut himself out of the promise. ' +
                'The stone would not let him.',
            ) + ' '
          : '') +
        (gameState.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)
          ? speech(
              'You gave him back his place. He could not do that for himself.',
            ) + ' '
          : '') +
        speech('Remember him when time is short for you.')
      )
    }
    this.riddlePosed = true
    return (
      'The ' +
      characterName('phoenix') +
      ' does not open its beak, but its voice is in your head all the ' +
      'same: ' +
      speech('What is wisdom when time is short?') +
      ' It lets the question stand. ' +
      speech(
        'I asked this once of the Warden of Wisdom, when he came to me with ' +
          'his two friends. He knew the answer, and did not keep it.',
      )
    )
  }

  /**
   * Accepts a correct answer, matched as a whole word, and gives the Phoenix
   * Feather if appropriate. A near miss gets its own nudge, anything else the
   * riddle again.
   */
  override sayTo(gameState: GameState, words: string): string {
    // Only accept answer if riddle was posed and feather not yet given
    if (!this.riddlePosed) {
      return super.sayTo(gameState, words)
    }
    if (gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
      return (
        'The ' +
        characterName('phoenix') +
        ' looks at the feather you carry. ' +
        speech('You already hold what you have earned.')
      )
    }
    if (saysAnyOf(words, RIDDLE_ANSWERS)) {
      gameState.addItemToInventory(new PhoenixFeather())
      gameState.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
      const link =
        ' ' +
        speech(
          'He gave your answer too. Then time grew short for his friends, and ' +
            'patience was the one thing he had none of. Do not become what he ' +
            'became.',
        )
      const terraces = gameState.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)
        ? ' You think of the third name on the terraces, level with the others again.'
        : gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)
          ? ' You think of the third name burned deeper than the others on the terraces.'
          : ''
      return (
        'The ' +
        characterName('phoenix') +
        ' bends its neck, draws a single feather from its breast and lays ' +
        'it in your hands. ' +
        speech(
          'Wisdom is ' +
            'patience, even when the world burns. Take this, and remember.',
        ) +
        link +
        terraces +
        '\nYou receive a [item_name]phoenix feather[/item_name].' +
        cedricAdds(gameState, CEDRIC_FEATHER_GLANCE)
      )
    }
    const nearMiss = NEAR_MISSES.find((miss) => saysAnyOf(words, miss.words))
    if (nearMiss) {
      return (
        'The ' + characterName('phoenix') + ' waits. ' + speech(nearMiss.reply)
      )
    }
    return (
      'The ' +
      characterName('phoenix') +
      ' waits. ' +
      speech('Is that truly wisdom, when time is short?')
    )
  }
}
