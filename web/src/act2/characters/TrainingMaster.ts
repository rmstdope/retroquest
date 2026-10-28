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
        'A grey-haired knight with a voice worn rough from shouting across ' +
        'the yard. His armour is old and dented and polished anyway. He ' +
        "watches the squires' feet, not their swords.",
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
          "A visitor. Keep off the sand while they're drilling.",
        ) +
        '\n\n' +
        'He glances toward ' +
        characterName('Sir Cedric') +
        ' and away again.' +
        '\n\n' +
        dialogue(
          'Training Master',
          "Sir Cedric held the watch on the king's wall the night His " +
            'Majesty vanished, and the next morning two men of the night watch ' +
            'swore he had left his post. They took his knighthood for it. I ' +
            'have known Cedric twenty years. He has never left a post in his ' +
            "life. The watch's story was too neat.",
        ) +
        '\n\n' +
        'He leans closer, lowering his voice.' +
        '\n\n' +
        dialogue(
          'Training Master',
          "There's talk of papers somewhere that tell a different story. " +
            "I'm too old and too watched to go looking. You're neither.",
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
      ' nods.' +
      '\n\n' +
      dialogue(
        'Training Master',
        'Still at it? Good. Ask the squires. Boys and girls in a barracks ' +
          'hear things an old knight never does.',
      )
    )
  }
}
