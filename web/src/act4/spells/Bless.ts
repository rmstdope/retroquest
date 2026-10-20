import {
  Spell,
  type Character,
  type GameState,
  characterName,
  event,
} from '@/engine'

/** A spell that channels divine energy to purify and free the corrupted. */
export class Bless extends Spell {
  constructor() {
    super({
      id: 'bless',
      name: 'bless',
      description:
        'Channels divine energy to purify corruption, break dark enchantments, ' +
        'and free those bound by shadow magic.',
    })
  }

  /** Cast bless spell without a specific target. */
  override castSpell(gameState: GameState): string {
    // Check if the current room has a castBless method and call it
    const room = gameState.currentRoom
    const hook = (room as { castBless?: (gs: GameState) => string }).castBless
    if (typeof hook === 'function') {
      return hook.call(room, gameState)
    }
    return event(
      'You channel divine energy, filling the area with warm, golden ' +
        'light, but there is nothing here that responds to the blessing.',
    )
  }

  /** Cast bless spell on a specific character. */
  override castOnCharacter(
    gameState: GameState,
    targetCharacter: Character,
  ): string {
    if (targetCharacter.name.toLowerCase().includes('servant')) {
      // Special handling for servants
      const room = gameState.currentRoom
      const hook = (room as { castBless?: (gs: GameState) => string }).castBless
      if (typeof hook === 'function') {
        return hook.call(room, gameState)
      }
      return event(
        'You channel blessing energy toward the servants, but ' +
          'the magic seems unable to reach them fully here.',
      )
    }
    return event(
      `You bless ${characterName(targetCharacter.name)} ` +
        'with divine energy, causing them to glow briefly with golden light.',
    )
  }
}
