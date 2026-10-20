import { Character, type GameState, characterName, speech } from '@/engine'

/** Ambient NPC who broadcasts civic news and points players to key hubs. */
export class TownCrier extends Character {
  constructor() {
    super({
      name: 'town crier',
      description:
        'A loud, enthusiastic man dressed in official Greendale colors who ' +
        'announces news and events throughout the city. He carries a brass ' +
        'bell and scroll with current announcements.',
    })
  }

  /** Announce Sir Cedric's call for aid and the notice board. */
  override talkTo(_gameState: GameState): string {
    const name = this.name
    return (
      characterName(name) +
      ': ' +
      speech(
        'Hear ye, hear ye! Welcome to Greendale, traveler! The great ' +
          characterName('Sir Cedric') +
          " seeks brave souls to aid in important matters. If you're looking " +
          'for adventure and the chance to serve the realm, head to the ' +
          "castle! Also, don't forget to check the notice board for other " +
          'opportunities!',
      )
    )
  }
}
