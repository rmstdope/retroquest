import { Character, dialogue } from '@/engine'

/**
 * Sir Cedric at the Fortress Gates while the violet wall stands. The room
 * removes him when the wall falls and he goes on ahead into the hall.
 */
export class SirCedricAtTheGate extends Character {
  constructor() {
    super({
      name: 'Sir Cedric',
      description: 'Sir Cedric, his sword drawn and his eyes on the guardians.',
    })
  }

  /** Also answers to "cedric". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'cedric'
  }

  /** His one line: he will follow once the wall is down. */
  override talkTo(): string {
    return dialogue(
      this.name,
      'Shadow does not tire, and neither do I. When that wall comes down, ' +
        'I will be a step behind you.',
    )
  }
}
