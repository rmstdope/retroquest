import {
  Spell,
  type Character,
  type GameState,
  type Item,
  dialogue,
  event,
} from '@/engine'
import {
  FLAG_ACT4_FIELD_GREEN,
  FLAG_ACT4_HOME_REACHED,
} from '../Act4StoryFlags'

/**
 * The smallest spell, and the one Elior did not inherit: read from a stone
 * in the glade, not carried in the ward, so it is the one he keeps after the
 * Sacrifice ending. Act IV carries its own copy so the acts stay self-contained. In
 * Willowbrook Field, at the very end, it is the spell that greens the field
 * and closes the story; the companions there refuse it.
 */
export class Grow extends Spell {
  constructor() {
    super({
      id: 'grow',
      name: 'grow',
      description: 'A nature spell that encourages plants to flourish.',
    })
  }

  /** Greens the field when cast at home; otherwise the plants answer. */
  override castSpell(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_HOME_REACHED)) {
      return this.greenTheField(gameState)
    }
    return (
      event('You cast [spell_name]grow[/spell_name].') +
      '\n' +
      'The nearby plants seem to respond with vibrant energy, ' +
      'but nothing else happens.'
    )
  }

  /** Cast on an item, the item decides what growing does to it. */
  override castOnItem(gameState: GameState, item: Item): string {
    return item.grow(gameState)
  }

  /** At home, "field" and "crops" are the field; elsewhere nothing answers. */
  override castOnName(gameState: GameState, target: string): string | null {
    if (
      gameState.getStoryFlag(FLAG_ACT4_HOME_REACHED) &&
      ['field', 'crops'].includes(target)
    ) {
      return this.greenTheField(gameState)
    }
    return null
  }

  /** At home the companions refuse it; elsewhere the plain refusal. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (gameState.getStoryFlag(FLAG_ACT4_HOME_REACHED)) {
      return `[failure]Grow is for the field, not for ${target.name}.[/failure]`
    }
    return super.castOnCharacter(gameState, target)
  }

  /**
   * The last cast of the game: the field turns green, the chapel bell rings
   * a third time, Nyx says the refrain once, and the act ends on
   * Grandmother's welcome.
   */
  private greenTheField(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT4_FIELD_GREEN, true)
    return [
      event('You cast [spell_name]grow[/spell_name].'),
      'You press your hands into the dry earth and say the smallest spell ' +
        'you know. Green runs out from your fingers along the rows. Leaves ' +
        'unfurl, the earth darkens, and the whole field breathes out at once.',
      'Across the village, the chapel bell rings once, with no hand on the ' +
        'rope.',
      dialogue(
        'Grandmother',
        'That is the third time. The first was for her, the night she went. ' +
          'The second was for you, the morning you left. I do not know who ' +
          'this one is for.',
      ),
      'You do.',
      'In the hedge the little light brightens. For the last time you hear ' +
        'Nyx, very small:',
      dialogue('Nyx', 'Power follows purpose; purpose follows truth.'),
      'Grandmother opens the gate.',
      dialogue('Grandmother', 'Welcome home, Elior.'),
    ].join('\n')
  }
}
