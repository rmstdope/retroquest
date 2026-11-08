import {
  Character,
  type GameState,
  type NameOptions,
  nameInSentence as nameReading,
} from '@/engine'
import { FLAG_ACT4_PARENTS_LEGACY_COMPLETED } from '../Act4StoryFlags'

/** Looking at the figures while the memories are still unseen. */
const LOOK_BEFORE =
  'Two small figures in every lantern, your father and your mother. ' +
  'They do not know you are here.'

/** Looking at the figures once the memories have played. */
const LOOK_AFTER =
  'The lanterns are dim and the figures in them are gone. You can still ' +
  'see them: your father over a workbench, your mother making a friend laugh.'

/** Speaking to them while the memories are still unseen. */
const TALK_BEFORE =
  'They do not turn. A memory cannot hear you. It only waits to be looked at.'

/** Speaking to them once the memories have played. */
const TALK_AFTER = 'The lanterns stay dim. They said what they stayed to say.'

/** What the player may call them besides a word of their name. */
const OTHER_NAMES = ['parents', 'father', 'mother']

/**
 * Aren and Lysa as the Parents' Vault holds them: memories, seen and never
 * met. They do not answer, before the memories play or after, and looking at
 * them is not looking at the memories, so nothing here moves the story.
 */
export class MemoryEchoes extends Character {
  constructor() {
    super({
      name: 'Memory Echoes of Aren and Lysa',
      description: LOOK_BEFORE,
    })
  }

  /** Also answers to what Elior calls them. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || OTHER_NAMES.includes(name.toLowerCase())
  }

  /** Reads "the memory echoes of Aren and Lysa", the two names kept capitalised. */
  override nameInSentence(options?: NameOptions): string {
    return nameReading('character', 'memory echoes of Aren and Lysa', {
      ...options,
      common: true,
    })
  }

  /** A pair of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

  /** The figures in the lanterns, then what stays of them once the lanterns dim. */
  override examine(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)
      ? LOOK_AFTER
      : LOOK_BEFORE
  }

  /** A memory does not answer back, and after the lanterns dim it has no more to say. */
  override talkTo(gameState: GameState): string {
    return gameState.getStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED)
      ? TALK_AFTER
      : TALK_BEFORE
  }
}
