import {
  Spell,
  characterName,
  event,
  type Character,
  type GameState,
  type Item,
} from '@/engine'
import { WardingPillars } from '../items/WardingPillars'

/** Act III variant of Purify, customized for Sunken Ruins interactions. */
export class PurifySpell extends Spell {
  constructor() {
    super({
      id: 'purify',
      name: 'purify',
      description:
        'A cleansing rite tuned to salt and stone; it scours sea-grit and ' +
        'wakes dormant ward-glyphs.',
    })
  }

  /** Cast purify spell providing cleansing aura. */
  override castSpell(_gameState: GameState): string {
    // Act III version has no global gating; it always responds with a cleansing aura
    return (
      event(`You cast [spell_name]${this.name}[/spell_name].`) +
      '\n' +
      'A brine-bright clarity flows from your hands, cutting through the mire.'
    )
  }

  /** Cast purify on target item, with special handling for warding pillars. */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    // Special handling for the warding pillars in the Outer Wards
    if (targetItem instanceof WardingPillars) {
      return targetItem.purify(gameState)
    }
    return (
      event(
        `You cast [spell_name]${this.name}[/spell_name] on ` +
          `[item_name]${targetItem.name}[/item_name].`,
      ) +
      '\n' +
      'Saltlight skims its surface, though nothing more changes.'
    )
  }

  /** Cast purify on target character to provide cleansing calm. */
  override castOnCharacter(
    _gameState: GameState,
    targetCharacter: Character,
  ): string {
    return (
      event(
        `You cast [spell_name]${this.name}[/spell_name] on ` +
          `${characterName(targetCharacter.name)}.`,
      ) +
      '\n' +
      'A cleansing calm settles, washing away lingering dread.'
    )
  }
}
