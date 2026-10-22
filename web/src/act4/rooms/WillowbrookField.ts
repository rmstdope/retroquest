import { Room, event, type GameState } from '@/engine'
import { Grandmother } from '../characters/Grandmother'
import { Mira } from '../characters/Mira'
import { Nyx } from '../characters/Nyx'
import { SirCedric } from '../characters/SirCedric'
import {
  FLAG_ACT4_HOME_REACHED,
  FLAG_FIELD_WATERED_IN_ACT1,
} from '../Act4StoryFlags'
import { endingPlayed } from '../endings'
import { Grow } from '../spells/Grow'

/** The walk home, shown after the move line. */
const WALK_HOME =
  'You walk out of the fortress and do not look back. The road home is ' +
  'long, and somehow shorter than it was. Days later the hedges of ' +
  'Willowbrook close around you, and then you are standing at the edge of ' +
  'your own field.'

/** What the field has been since Act I, if Elior watered it then. */
const FIELD_WATERED_ONCE =
  'The field you watered once went grey again after you left. ' +
  'Grandmother tried.'

/** What the field has been since Act I, if he never did. */
const FIELD_UNTOUCHED = 'Nobody has touched it since you left.'

/** Grandmother's singing at the gate, shown in every ending. */
const GATE_SONG =
  'At the gate Grandmother is singing to herself: "Hush, little seed, the ' +
  'frost is going—" She sees you, and stops.'

/** The kneel after Redemption or Justice, when grow comes back. */
const KNEEL_REMEMBER =
  'You kneel at the edge of the field. Your hands remember the spell you ' +
  'read from a stone in the glade, the one that was always yours.'

/** The kneel after Sacrifice, when grow was kept. */
const KNEEL_KEPT =
  'You kneel at the edge of the field. The one spell you kept stirs in ' +
  'your hands, the one that was never theirs, small and certain.'

/**
 * The end of the story: the withered field behind Elior's home, where the
 * game began. There is no way out. Arriving sets the home flag (which makes
 * grow the field's spell) and, unless Sacrifice left grow in his hands,
 * teaches it. Casting grow ends the act (see `Grow`).
 */
export class WillowbrookField extends Room {
  constructor() {
    super({
      name: 'Willowbrook Field',
      description:
        'The field behind your home: rows of withered crops ' +
        'under a pale sky, the earth cracked and grey. Grandmother waits at ' +
        'the gate. Mira stands beside her, and Sir Cedric leans on the ' +
        'fence. In the hedge a small light flickers: Nyx, keeping close. ' +
        'The air is quiet.',
      characters: [new Grandmother(), new Mira(), new SirCedric(), new Nyx()],
    })
  }

  /** Marks Elior as home and gives back grow if the ending took it. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_HOME_REACHED, true)
    if (!gameState.hasSpell('grow')) gameState.learnSpell(new Grow())
  }

  /**
   * The walk home, what the field has been since Act I, Grandmother's singing
   * and the kneel; the remembering is an event, once.
   */
  override enterText(gameState: GameState): string {
    const since = gameState.getStoryFlag(FLAG_FIELD_WATERED_IN_ACT1)
      ? FIELD_WATERED_ONCE
      : FIELD_UNTOUCHED
    if (endingPlayed(gameState) === 'sacrifice') {
      return `${WALK_HOME}\n${since}\n${GATE_SONG}\n${KNEEL_KEPT}`
    }
    return (
      `${WALK_HOME}\n${since}\n${GATE_SONG}\n${KNEEL_REMEMBER}\n` +
      event('You remember the grow spell!')
    )
  }

  /** Home is the end: every direction gets the same gentle line. */
  override blockedExit(
    _gameState: GameState,
    _direction: string,
  ): string | null {
    return '[failure]You are home. There is nowhere else you need to go.[/failure]'
  }
}
