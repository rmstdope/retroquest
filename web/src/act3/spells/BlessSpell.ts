import {
  Spell,
  characterName,
  type Character,
  type GameState,
  type Item,
} from '@/engine'

/** The priest's blessing: warms Elior, and sanctifies sacred items for ritual. */
export class BlessSpell extends Spell {
  constructor() {
    super({
      id: 'bless',
      name: 'bless',
      description:
        'The blessing the priest said over you when you found the ' +
        "founders' locket.",
    })
  }

  /** Cast bless on self. */
  override castSpell(gameState: GameState): string {
    gameState.setStoryFlag('journey_bless_completed', true)
    return (
      'A quiet warmth settles on your shoulders and stays, the way the ' +
      "priest's hand did."
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
    return (
      '[failure]The [spell_name]bless[/spell_name] spell has no effect on ' +
      `${targetItem.nameInSentence()}.[/failure]`
    )
  }
}
