import { Character, type GameState } from '@/engine'

/** Guardian of the threshold to the dragon's hall. */
export class SilenceKeeper extends Character {
  constructor() {
    super({
      name: 'silence keeper',
      description:
        'A tall figure robed in shadow-dark fabric that seems to absorb ' +
        'sound itself. Their face is hidden beneath a deep hood, and they ' +
        'move without disturbing the stillness around them.',
    })
  }

  /** Provide guidance on the Oath of Stillness. */
  override talkTo(_gameState: GameState): string {
    return (
      'The [character_name]Silence Keeper[/character_name] whispers, their voice ' +
      "barely disturbing the air: [dialogue]'The echo stones await sanctification. " +
      'Only when blessed ' +
      'can they amplify the ancient words that will quiet the restless ' +
      'spirits. Speak the resonant chant to the stones, and the path to ' +
      "the ancient one will open.'[/dialogue]"
    )
  }
}
