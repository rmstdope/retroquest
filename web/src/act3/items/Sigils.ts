import { Item, speech, characterName, remembered } from '@/engine'
import type { GameState } from '@/engine'
import {
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_SIGILS_MENDED,
  VIRTUE_SELFLESS,
} from '../Act3StoryFlags'

/** The sigils as they stand before the scale is taken. */
const WHOLE_TEXT =
  'Rings of old sigils spiral across the black tiles around the dragon. ' +
  'They are the walls of its prison, and every ring holds.'

/** The sigils once the scale is taken: the prison has weakened. */
const CRACKED_TEXT =
  'Where the scale lay, the sigils have dimmed, and a hairline crack runs ' +
  'through the nearest ring. The prison is weaker than it was.'

/** The sigils once blessing has mended them. */
const MENDED_TEXT =
  'The sigils around the dragon burn steady and whole again. The prison ' +
  'holds.'

/**
 * The sigils that bind the ancient dragon in its hall. Once the scale has
 * been taken they crack; blessing them mends the prison, an optional
 * selfless act that gains the player nothing.
 */
export class Sigils extends Item {
  constructor() {
    super({
      name: 'sigils',
      description: WHOLE_TEXT,
      canBeCarried: false,
    })
  }

  /**
   * Describes the prison as it stands: whole, cracked once the scale is
   * taken, or mended once blessed, so the crack can be found by looking.
   */
  override examine(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT3_SIGILS_MENDED)) {
      return MENDED_TEXT
    }
    if (gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
      return CRACKED_TEXT
    }
    return this.description
  }

  /** Handle a spell cast on the sigils: only `bless` does anything. */
  receiveSpell(
    gameState: GameState,
    spellId: string,
    spellName: string = spellId,
  ): string {
    if (spellId !== 'bless') {
      return `[failure]The ${spellName} spell has no effect on the sigils.[/failure]`
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
      return 'The sigils burn steady and whole. They need nothing from you yet.'
    }
    if (gameState.getStoryFlag(FLAG_ACT3_SIGILS_MENDED)) {
      return 'The sigils already hold. There is nothing left to mend.'
    }
    gameState.setStoryFlag(FLAG_ACT3_SIGILS_MENDED, true)
    gameState.addVirtue(VIRTUE_SELFLESS)
    return (
      'Light runs along the cracked ring like water finding its course. The ' +
      'sigils brighten, steady, and hold.\n' +
      `The ${characterName('ancient dragon')} lowers its head. ` +
      speech(
        'You said you would give back. Most forget by the time they reach ' +
          'the door. Your parents would not have forgotten.',
      ) +
      '\n' +
      remembered('Selflessness')
    )
  }
}
