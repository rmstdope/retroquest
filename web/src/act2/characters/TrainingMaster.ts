import {
  Character,
  type GameState,
  characterName,
  dialogue,
  type NameOptions,
} from '@/engine'
import {
  FLAG_CEDRIKS_HONOR_ACCEPTED,
  FLAG_CEDRIKS_HONOR_COMPLETED,
} from '../Act2StoryFlags'

/** Veteran instructor who seeds the Cedric honor investigation. */
export class TrainingMaster extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

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

  /** Start the honor investigation on first talk; later remind the player,
   * or acknowledge the sword once Cedric's name is cleared. */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED)) {
      // First time talking - trigger the quest
      gameState.setStoryFlag(FLAG_CEDRIKS_HONOR_ACCEPTED, true)

      return (
        dialogue(
          'Training Master',
          "Ah, a visitor to our training grounds. I've been instructing " +
            'knights and squires here for many years.',
        ) +
        '\n\n' +
        'He glances toward ' +
        characterName('Sir Cedric') +
        ' with a troubled expression.' +
        '\n\n' +
        dialogue(
          'Training Master',
          'It pains me to see a fine knight like Sir Cedric carrying such a ' +
            "heavy burden. He held the watch on the king's wall the night His " +
            'Majesty vanished, and the next morning two men of the night watch ' +
            'swore he had left his post. They took his knighthood for it. But ' +
            "I've known Cedric for years, and he has never left a post in his " +
            'life. Something about that whole affair never sat right with me. ' +
            "The watch's story was… too neat.",
        ) +
        '\n\n' +
        'He leans closer, lowering his voice.' +
        '\n\n' +
        dialogue(
          'Training Master',
          "I've heard rumors that there are papers somewhere that tell a " +
            'different story. Perhaps someone with your skills could help ' +
            'uncover the truth and restore honor to a good man who has ' +
            'suffered long enough.',
        )
      )
    }
    // Subsequent conversations
    if (gameState.getStoryFlag(FLAG_CEDRIKS_HONOR_COMPLETED)) {
      return (
        'The ' +
        characterName('Training Master') +
        ' nods respectfully.' +
        '\n\n' +
        dialogue(
          'Training Master',
          "You've seen it, then? His sword at his hip again. I stood in " +
            'this yard the morning they took it from him, and I held my ' +
            "tongue. I'll not make that mistake twice. Greendale owes you, " +
            'and so do I.',
        )
      )
    }
    return (
      'The ' +
      characterName('Training Master') +
      ' nods respectfully.' +
      '\n\n' +
      dialogue(
        'Training Master',
        "You're looking into Sir Cedric's " +
          'situation? Good. That man has suffered under false accusations ' +
          'for far too long. The truth needs to come to light. Perhaps the ' +
          'squires might know more about what happened - they sometimes hear ' +
          'things that we older knights miss.',
      )
    )
  }
}
