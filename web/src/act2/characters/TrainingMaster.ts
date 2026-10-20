import { Character, type GameState, characterName, speech } from '@/engine'
import { FLAG_CEDRIKS_HONOR_ACCEPTED } from '../Act2StoryFlags'

/** Veteran instructor who seeds the Cedric honor investigation. */
export class TrainingMaster extends Character {
  constructor() {
    super({
      name: 'training master',
      description:
        "A grizzled veteran knight responsible for training the castle's squires " +
        'and maintaining combat readiness. His weathered face and battle-scarred ' +
        'armor speak of many years of military service. He observes the training ' +
        'grounds with a critical eye, ensuring every move is precise and disciplined.',
    })
  }

  /** Start the honor investigation on first talk; later remind the player. */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED)) {
      // First time talking - trigger the quest
      gameState.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)

      return (
        characterName('Training Master') +
        ': ' +
        speech(
          "Ah, a visitor to our training grounds. I've been instructing " +
            'knights and squires here for many years.',
        ) +
        '\n\n' +
        'He glances toward ' +
        characterName('Sir Cedric') +
        ' with a troubled expression.' +
        '\n\n' +
        characterName('Training Master') +
        ': ' +
        speech(
          'It pains me to see a fine ' +
            'knight like Sir Cedric carrying such a heavy burden. There are ' +
            'whispers about his past military service - accusations of ' +
            "cowardice during a critical battle. But I've known Cedric for " +
            'years, and cowardice is not in his nature. Something about that ' +
            'whole affair never sat right with me. The official reports ' +
            'seemed... incomplete.',
        ) +
        '\n\n' +
        'He leans closer, lowering his voice.' +
        '\n\n' +
        characterName('Training Master') +
        ': ' +
        speech(
          "I've heard rumors that " +
            'there were supposed to be documents - evidence that would clear ' +
            'his name. Perhaps someone with your skills could help uncover the ' +
            'truth and restore honor to a good man who has suffered long ' +
            'enough.',
        )
      )
    }
    // Subsequent conversations
    return (
      'The ' +
      characterName('Training Master') +
      ' nods respectfully.' +
      '\n\n' +
      characterName('Training Master') +
      ': ' +
      speech(
        "You're looking into Sir Cedric's " +
          'situation? Good. That man has suffered under false accusations ' +
          'for far too long. The truth needs to come to light. Perhaps the ' +
          'squires might know more about what happened - they sometimes hear ' +
          'things that we older knights miss.',
      )
    )
  }
}
