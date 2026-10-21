import { Item, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_FINAL_STAND_COMPLETED,
  FLAG_ACT4_FORGIVENESS_SAID,
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_JUSTICE_SAID,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
  FLAG_ACT4_SACRIFICE_SAID,
} from '../Act4StoryFlags'
import {
  endingPlayed,
  farewell,
  justiceChoosable,
  sacrificeChoosable,
  type Ending,
} from '../endings'
import {
  THRONE_CHAMBER_JUSTICE,
  THRONE_CHAMBER_REDEMPTION,
  THRONE_CHAMBER_SACRIFICE,
} from '../rooms/throneDescriptions'
import { Grow } from '../spells/Grow'

/** What the amulet says before the elixir has been used. */
const NOT_YET =
  '[failure]Not yet. The wound is not yours to close while Malakar still ' +
  'waits for you.[/failure]'

/** What the amulet says once the elixir has healed Malakar. */
const GENTLER =
  'The wound waits for something gentler than the amulet. Malakar looks up ' +
  'at you, as if he is waiting to hear something.'

/** The start of the hint, before the endings that are open. */
const HINT_START = 'The wound will not close for nothing.'

/** The Justice sentence of the hint. */
const HINT_JUSTICE =
  "You could name Malakar's crimes and seal him away with it, in justice."

/** The Sacrifice sentence of the hint. */
const HINT_SACRIFICE = 'You could give up your magic to close it, in sacrifice.'

/**
 * The wound in time that Malakar tore, bleeding the king's light. The
 * elixir may be used on it (which heals Malakar); the ancient amulet and the
 * Forgiveness spell are how it is closed, in one of the three endings.
 */
export class Wound extends Item {
  constructor() {
    super({
      name: 'Wound',
      description:
        'A tear in the air, no wider than a door, its edges flickering ' +
        'with days that never happened. It drinks the light from the king, ' +
        'and from Malakar too.',
      canBeCarried: false,
    })
  }

  /** Also answers to "wound in time". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'wound in time'
  }

  /** The wound's look. */
  override examine(gameState: GameState): string {
    if (endingPlayed(gameState)) {
      return event('The air where the wound was is still and empty.')
    }
    return event(this.description)
  }

  /**
   * The ancient amulet used on the wound: the second step of Justice and
   * Sacrifice once the word is said, a hint before that, and a dim line
   * once the wound is closed.
   */
  closeWithAmulet(gameState: GameState): string {
    if (endingPlayed(gameState)) return '[dim]The wound is gone.[/dim]'
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)) return GENTLER
    if (!gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) return NOT_YET
    if (gameState.getStoryFlag(FLAG_ACT4_JUSTICE_SAID)) {
      return this.justiceEnding(gameState)
    }
    if (gameState.getStoryFlag(FLAG_ACT4_SACRIFICE_SAID)) {
      return this.sacrificeEnding(gameState)
    }
    const choices = [
      justiceChoosable(gameState) ? HINT_JUSTICE : '',
      sacrificeChoosable(gameState) ? HINT_SACRIFICE : '',
    ].filter(Boolean)
    const joined =
      choices.length === 2
        ? `${HINT_JUSTICE} Or ${HINT_SACRIFICE.replace('You', 'you')}`
        : choices.join(' ')
    return `${HINT_START} ${joined}`
  }

  /** Forgiveness cast on the wound: the Redemption ending. */
  forgive(gameState: GameState): string {
    if (endingPlayed(gameState)) {
      return '[dim]There is no wound left to forgive.[/dim]'
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_FORGIVENESS_SAID)) {
      return '[failure]Forgiveness has not been spoken yet.[/failure]'
    }
    this.finish(gameState, 'redemption')
    return [
      'You lay forgiveness on the wound. Its edges stop flickering. The ' +
        'days that never happened fall quiet one by one, and the tear draws ' +
        'closed like a healed cut. Above the circle the crystal clouds, ' +
        'cracks and falls away, and King Alden breathes again.',
      dialogue(
        'Malakar',
        'Thank you, Elior. I will stay here, by what I broke, and ' +
          'remember them properly this time.',
      ),
      farewell('redemption'),
    ].join('\n')
  }

  /** Justice: the king's bindings and the ward seal the wound, with Malakar. */
  private justiceEnding(gameState: GameState): string {
    this.finish(gameState, 'justice')
    return [
      'You press the open amulet to the wound. Threads of gold rise from ' +
        "King Alden's crown and weave into the ward's light. The tear " +
        'closes, and Malakar goes with it, drawn into the seal. He does not ' +
        'fight.',
      dialogue('Malakar', 'I am sorry. Tell them— no. They know.'),
      dialogue(
        'King Alden',
        'Then it falls to me to set right what he broke. Rest now. You ' +
          'have done enough.',
      ),
      farewell('justice'),
    ].join('\n')
  }

  /** Sacrifice: every spell Elior knows closes the wound; only grow remains. */
  private sacrificeEnding(gameState: GameState): string {
    this.finish(gameState, 'sacrifice')
    gameState.knownSpells = [new Grow()]
    return [
      'You press the open amulet to the wound and let go. The light, the ' +
        'blessing, the truth sight, every spell you carried runs out of ' +
        'your hands into the tear, and the tear drinks it and closes. When ' +
        'it is done, one small spell is still in you, the first and the ' +
        'smallest: grow.',
      event('Your magic is gone. Only grow remains.'),
      dialogue(
        'King Alden',
        'He will answer to me, and he will live to do it. Thank you, farmer.',
      ),
      farewell('sacrifice'),
    ].join('\n')
  }

  /** Records the ending, completes the quest and sets the room's description. */
  private finish(gameState: GameState, ending: Ending): void {
    const flag = {
      redemption: FLAG_ACT4_REDEMPTION_ENDING,
      justice: FLAG_ACT4_JUSTICE_ENDING,
      sacrifice: FLAG_ACT4_SACRIFICE_ENDING,
    }[ending]
    gameState.setStoryFlag(flag, true)
    gameState.setStoryFlag(FLAG_ACT4_FINAL_STAND_COMPLETED, true)
    gameState.currentRoom.description = {
      redemption: THRONE_CHAMBER_REDEMPTION,
      justice: THRONE_CHAMBER_JUSTICE,
      sacrifice: THRONE_CHAMBER_SACRIFICE,
    }[ending]
  }
}
