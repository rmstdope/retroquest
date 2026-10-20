import { Character, type GameState } from '@/engine'

/** Orientation NPC who advises visitors on castle protocol and introductions. */
export class CastleGuardCaptain extends Character {
  constructor() {
    super({
      name: 'castle guard captain',
      description:
        'A stern-looking officer in polished armor who oversees security for ' +
        'the castle grounds. He provides guidance on proper protocol for ' +
        'meeting with nobility.',
    })
  }

  /** Explain where Sir Cedric is and how to address him. */
  override talkTo(_gameState: GameState): string {
    const name = this.name
    return (
      `[character_name]${name}[/character_name]: [dialogue]Welcome to the castle grounds. ` +
      '[character_name]Sir Cedric[/character_name] can be found in the courtyard. ' +
      "When speaking with him, address him as 'Sir' and show proper respect. " +
      "He's been seeking capable individuals for important work, so if you're " +
      'here about that, be prepared to demonstrate your abilities.[/dialogue]'
    )
  }
}
