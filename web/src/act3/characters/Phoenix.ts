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

/** A majestic, telepathic phoenix who poses a riddle to the worthy. */
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
        "A vast, ember-wrought phoenix reclines amid the crater's molten glass. Its " +
        'feathers glow with shifting gold and crimson, and its eyes burn with patient, ' +
        'ancient wisdom. It radiates a presence that is both fierce and serene, as if it ' +
        'has seen the rise and fall of ages.',
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
      "'s voice does not come from its " +
      'beak, but resounds within your mind: ' +
      speech('What is wisdom when time is short?') +
      ' The question lingers, ' +
      'bright and weightless, as if the answer might shape the very air around you.' +
      ' ' +
      speech(
        'I asked this once of the Warden of Wisdom, when he came to me with ' +
          'his two friends. He knew the answer, and did not keep it.',
      )
    )
  }

  /**
   * Accepts a correct answer, matched as a whole word, and gives the Phoenix
   * Feather if appropriate.
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
        ' inclines its head, a knowing ' +
        'warmth in its eyes. ' +
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
        "'s eyes flare with approval. It " +
        'plucks a single glowing feather and offers it to you. ' +
        speech(
          'Wisdom is ' +
            'patience, even when the world burns. Take this, and remember.',
        ) +
        link +
        terraces +
        cedricAdds(gameState, CEDRIC_FEATHER_GLANCE)
      )
    }
    return (
      'The ' +
      characterName('phoenix') +
      ' studies you in silence. ' +
      speech('Is that truly wisdom, when time is short?')
    )
  }
}
