import {
  Character,
  type GameState,
  event,
  characterName,
  speech,
} from '@/engine'

/** A kindly priest character who offers blessings and lore about Eldoria. */
export class Priest extends Character {
  constructor() {
    super({
      name: 'priest',
      description:
        `A kindly ${characterName('priest')} who tends the chapel, ` +
        'offering blessings ' +
        'and sharing the lore of Eldoria.',
    })
  }

  /** Greet the player and record that the priest has been talked to. */
  override talkTo(gameState: GameState): string {
    gameState.setStoryFlag('priest_talked_to', true) // Set the story flag
    const eventMsg = event(`You speak with the ${characterName(this.name)}.`)
    return (
      eventMsg +
      '\n' +
      `The ${characterName(this.name)} ` +
      'offers a serene smile. ' +
      speech(
        'Welcome, child. The chapel is a sanctuary for ' +
          'all who seek peace. The shadows in our land grow long, but faith can be a ' +
          'guiding light. I am out of matches, and I usually get them for free from the ' +
          'General Store. Could you bring me some?',
      )
    )
  }
}
