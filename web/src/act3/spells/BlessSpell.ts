import {
  Spell,
  characterName,
  type Character,
  type GameState,
  type Item,
} from '@/engine'

/** Divine incantation granting protection and sanctifying power. */
export class BlessSpell extends Spell {
  constructor() {
    super({
      id: 'bless',
      name: 'bless',
      description:
        'A divine incantation that offers protection and strength, and can ' +
        'sanctify sacred items for ritual purposes.',
    })
  }

  /** Cast bless on self. */
  override castSpell(gameState: GameState): string {
    gameState.setStoryFlag('journey_bless_completed', true)
    return (
      'Your resolve is strengthened, and you feel more prepared for the ' +
      'challenges that lie ahead on your journey.'
    )
  }

  /** Cast bless on a character. */
  override castOnCharacter(
    _gameState: GameState,
    targetCharacter: Character,
  ): string {
    const name = targetCharacter.name
    return (
      'A divine light surrounds ' +
      `${characterName(name)}, and they seem ` +
      'strengthened and more resolute.'
    )
  }

  /** Cast bless on an item (new functionality for Act 3). */
  override castOnItem(gameState: GameState, targetItem: Item): string {
    // Check if the item has a receiveSpell method
    const hook = (
      targetItem as {
        receiveSpell?: (
          gs: GameState,
          spellId: string,
          spellName: string,
        ) => string
      }
    ).receiveSpell
    if (typeof hook === 'function') {
      return hook.call(targetItem, gameState, this.id, this.name)
    }
    const name = targetItem.name
    return (
      '[failure]The [spell_name]bless[/spell_name] spell has no effect on ' +
      `[item_name]${name}[/item_name].[/failure]`
    )
  }
}
