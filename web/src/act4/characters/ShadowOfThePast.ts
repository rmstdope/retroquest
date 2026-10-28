import {
  Character,
  type GameState,
  affirms,
  characterName,
  clue,
  dialogue,
  saysAnyOf,
  speech,
  type NameOptions,
} from '@/engine'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_SHADOW_MASK_SHOWN,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
} from '../Act4StoryFlags'

/** What it is called once the orbs are mended and it has a face. */
const FULL_NAME = 'Shadow of the Past'

/** The Shadow once it has its answer. */
const ANSWERED =
  '[dim]The Shadow has its answer. It nods towards the door to the ' +
  'east.[/dim]'

/** The words that answer the Shadow, after the Phoenix's riddle. */
const ANSWER_WORDS = ['patience', 'patient']

/**
 * Near misses, each with its own answer: the virtue he had, the two that were
 * not his, and the time he tore. "wait" is a near miss, never the answer, so
 * that "I can't wait" cannot count.
 */
const NEAR_MISSES: readonly { words: readonly string[]; reply: string }[] = [
  {
    words: ['wisdom', 'wise'],
    reply: 'I was the Warden of Wisdom, Elior. It was not enough.',
  },
  {
    words: ['courage', 'brave', 'selflessness', 'selfless'],
    reply: 'That was theirs. The one I failed was mine.',
  },
  {
    words: ['time', 'wait', 'waiting'],
    reply: 'Time is what I tore. Say the other thing. The thing I never had.',
  },
]

/**
 * The Shadow of the Past in the Memory Vault: the voice from Elior's dreams,
 * what remains of Malakar's better self. Mute until the orbs are mended, it
 * takes the Sorceress's mask, is answered with "patience", and stays.
 */
export class ShadowOfThePast extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'Shadow',
      description:
        'It is the shape of a man, thin as smoke. It reaches for the orbs, ' +
        'and they slip through its fingers.',
    })
  }

  /** Also answers to "shadow" and "shadow of the past", whatever its name is now. */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) ||
      ['shadow', 'shadow of the past'].includes(name.toLowerCase())
    )
  }

  /** The orbs are mended: it gains a face and its full name. */
  gainFace(): void {
    this.name = FULL_NAME
  }

  /** Its look, which changes once the orbs are mended. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return (
        'A man made of shadow, almost solid now. His face is kind and very ' +
        'tired. You have never seen it before, and you know it all the same.'
      )
    }
    return this.description
  }

  /** What it says follows the orbs, the mask and the answer. */
  override talkTo(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)) {
      return dialogue(
        FULL_NAME,
        'Now you have seen them too. He is past the north door of their ' +
          'vault. Go to him.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)) {
      return dialogue(
        FULL_NAME,
        'Go east, Elior. I have seen those memories every day for years. ' +
          'You never have.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_MASK_SHOWN)) {
      return dialogue(
        FULL_NAME,
        'The Phoenix asked me once what wisdom is when time is short. I ' +
          'gave it the right answer. Then the fever came, and I did not ' +
          'keep it.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return (
        dialogue(
          FULL_NAME,
          'I was Malakar, once. Not the one in the throne room. The part of ' +
            'him that remembered why he began. When he tore the wound, he left ' +
            'me behind. I have called to you since you were small.',
        ) +
        '\n' +
        dialogue(
          FULL_NAME,
          'The same words, every time. You caught pieces. Hear them whole. ' +
            'Be patient where I was not. Close what I opened, and let them ' +
            'rest.',
        )
      )
    }
    return "[dim]The shadow's lips move, but the vault swallows the sound.[/dim]"
  }

  /**
   * Only patience answers it ("patience", or "be patient" in a sentence that
   * does not deny it), and only after the orbs are mended and the mask shown.
   * Once the orbs are mended a near miss gets its own answer.
   */
  override sayTo(gameState: GameState, words: string): string {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)) {
      return ANSWERED
    }
    if (!affirms(words, ANSWER_WORDS)) {
      const nearMiss = gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)
        ? NEAR_MISSES.find((miss) => saysAnyOf(words, miss.words))
        : undefined
      return nearMiss
        ? dialogue(FULL_NAME, nearMiss.reply)
        : '[dim]The Shadow waits, as it has waited for years.[/dim]'
    }
    return this.answerWithPatience(
      gameState,
      dialogue(
        'Elior',
        'Patience. You could not wait for them. You can wait a little ' +
          'longer, for me.',
      ),
    )
  }

  /**
   * Waiting in the vault is patience too: resting with the orbs mended and
   * the mask shown answers the Shadow as the word does. Before that, the
   * same refusals as the word; afterwards, the same nod.
   */
  waitWith(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)) {
      return ANSWERED
    }
    return this.answerWithPatience(
      gameState,
      'You sit down among the orbs and wait, and say nothing at all. The ' +
        'Shadow watches you do it for a long time.',
    )
  }

  /** The shared gates and the answer, led in by what Elior did (ready-made lines): the word, or the waiting. */
  private answerWithPatience(gameState: GameState, lead: string): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return clue(
        'The Shadow does not see you. The memories around it are ' +
          'too broken.',
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SHADOW_MASK_SHOWN)) {
      return clue(
        `The ${characterName(FULL_NAME)} shakes its head. ` +
          speech(
            'Patience is for those who still have hope. I have none left.',
          ),
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    return [
      lead,
      dialogue(
        FULL_NAME,
        'Patience. The one thing I never had. Then I will wait, a little ' +
          'longer. Take the amulet east, Elior. It will open for you.',
      ),
    ].join('\n')
  }
}
