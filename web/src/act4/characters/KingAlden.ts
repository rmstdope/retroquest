import { Character, type GameState, type Item, dialogue } from '@/engine'
import { FLAG_ACT4_ELIXIR_ON_KING } from '../Act4StoryFlags'
import { endingPlayed, type Ending } from '../endings'
import { AncientAmulet } from '../items/AncientAmulet'
import { LifelightElixir } from '../items/LifelightElixir'

/** What he says once the wound is closed, by ending. */
const ENDING_LINES: Record<Ending, string> = {
  redemption:
    'You saved my kingdom, and somehow him as well. I would not have known ' +
    'how.',
  justice:
    'The kingdom will remember what you did here, farmer. I will see that ' +
    'it does.',
  sacrifice:
    'You have earned your field, farmer. No one will take it from you.',
}

/**
 * How he looks in the crystal. Taken three weeks before Act II, he has been
 * held for weeks, not years. A constant, so old saves get the current words.
 */
const IN_THE_CRYSTAL =
  'The king of Eldoria, grey and thin, as if each week in here had been a ' +
  'year. His crown is dark.'

/**
 * King Alden in the Throne Chamber: asleep in his crystal prison until the
 * Lifelight Elixir breaks it, then alive and weak, with one line to say.
 */
export class KingAlden extends Character {
  constructor() {
    super({
      name: 'King Alden',
      description: IN_THE_CRYSTAL,
    })
  }

  /** Also answers to "alden" and "king". */
  override answersTo(name: string): boolean {
    return (
      super.answersTo(name) || ['alden', 'king'].includes(name.toLowerCase())
    )
  }

  /** His look, which changes once the prison is broken. */
  override examine(gameState: GameState): string {
    if (endingPlayed(gameState)) {
      return 'The king of Eldoria, alive, his crown bright again.'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return (
        'The king of Eldoria, weak and grey, but breathing. His crown is ' +
        'dark still.'
      )
    }
    return IN_THE_CRYSTAL
  }

  /** Asleep in the crystal until it is broken; then his line, by ending. */
  override talkTo(gameState: GameState): string {
    const ending = endingPlayed(gameState)
    if (ending) return dialogue('King Alden', ENDING_LINES[ending])
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return dialogue(
        'King Alden',
        'You came for me. Whoever you are, you came.',
      )
    }
    return '[dim]King Alden sleeps in the crystal and does not hear you.[/dim]'
  }

  /**
   * The elixir offered to him is the elixir used on him, as it is for Malakar;
   * the amulet stops at the crystal, and awake he will not take it.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof LifelightElixir) {
      return item.useOnCharacter(gameState, this)
    }
    if (!(item instanceof AncientAmulet)) {
      return super.giveItem(gameState, item)
    }
    if (
      !endingPlayed(gameState) &&
      !gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)
    ) {
      return (
        'The amulet clicks against the crystal. Inside, the king does not ' +
        'stir, and his crown stays dark.'
      )
    }
    return dialogue('King Alden', 'Keep it. My half of it has cost me enough.')
  }
}
