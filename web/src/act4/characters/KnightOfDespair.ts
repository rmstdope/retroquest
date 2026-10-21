import { Character, type GameState, dialogue, event } from '@/engine'

/**
 * The knight who blocks the stair to the Tower of Shadows. Here he can only be
 * examined and talked to; he turns Elior away until he is redeemed.
 */
export class KnightOfDespair extends Character {
  constructor() {
    super({
      name: 'Knight of Despair',
      description:
        'A knight in tarnished armour, a shredded grey cloak hanging from his ' +
        'shoulders. His visor is down, and he does not move. When he speaks, ' +
        "his voice is hollow: 'Return when you have the truth.'",
    })
  }

  /** Also answers to "knight". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'knight'
  }

  /** The knight's look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }

  /** The knight turns Elior away. */
  override talkTo(_gameState: GameState): string {
    return dialogue(
      this.name,
      'There is nothing you can say to me that I have not already told ' +
        'myself. Go. Return when you have the truth.',
    )
  }
}
