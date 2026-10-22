import { Character, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_SHADOW_MASK_SHOWN,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED,
} from '../Act4StoryFlags'
import { normaliseSpokenWord } from '../spokenWord'

/** What it is called once the orbs are mended and it has a face. */
const FULL_NAME = 'Shadow of the Past'

/** The Shadow once it has its answer. */
const ANSWERED =
  '[dim]The Shadow has its answer. It nods towards the door to the ' +
  'east.[/dim]'

/** The word that answers the Shadow, after the Phoenix's riddle. */
const ANSWER_WORD = 'patience'

/**
 * The Shadow of the Past in the Memory Vault: the voice from Elior's dreams,
 * what remains of Malakar's better self. Mute until the orbs are mended, it
 * takes the Sorceress's mask, is answered with "patience", and stays.
 */
export class ShadowOfThePast extends Character {
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
      return event(
        'A man made of shadow, almost solid now. His face is kind and very ' +
          'tired. You have never seen it before, and you know it all the same.',
      )
    }
    return event(this.description)
  }

  /** What it says follows the orbs, the mask and the answer. */
  override talkTo(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
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
        'The Phoenix asked us once what wisdom is when time is short. Aren ' +
          'and Lysa knew. I did not.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return (
        dialogue(
          FULL_NAME,
          'I was Malakar, once. Not the one who waits in the throne room: the ' +
            'part of him that remembered why he began. When he tore the wound, ' +
            'he tore himself in two, and I am the half he left behind. I held ' +
            'you once, when you were small enough to fit in my two hands. I ' +
            'have called to you ever since.',
        ) +
        '\n' +
        dialogue(
          FULL_NAME,
          'Every time, with the same words, and you caught only pieces of ' +
            'them. Hear them whole: be patient where I was not. Close what I ' +
            'opened, and let them rest.',
        )
      )
    }
    return "[dim]The shadow's lips move, but the vault swallows the sound.[/dim]"
  }

  /** Only "patience" answers it, and only after the orbs are mended and the mask shown. */
  override sayTo(gameState: GameState, words: string): string {
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED)) {
      return ANSWERED
    }
    const word = normaliseSpokenWord(words)
    if (word !== ANSWER_WORD) {
      return '[dim]The Shadow waits, as it has waited for years.[/dim]'
    }
    return this.answerWithPatience(
      gameState,
      '“Patience,” you say. “You could not wait for them. You can wait a ' +
        'little longer, for me.”',
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

  /** The shared gates and the answer, led in by what Elior did: the word, or the waiting. */
  private answerWithPatience(gameState: GameState, lead: string): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)) {
      return (
        '[failure]The Shadow cannot hear you. The memories around it are ' +
        'too broken.[/failure]'
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SHADOW_MASK_SHOWN)) {
      return (
        '[failure]The Shadow shakes its head. “Patience is for those who ' +
        'still have hope. I have none left.”[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    return [
      event(lead),
      dialogue(
        FULL_NAME,
        'Patience. The one thing I never had. Then I will wait, a little ' +
          'longer. Take the amulet east, Elior. It will open for you.',
      ),
    ].join('\n')
  }
}
