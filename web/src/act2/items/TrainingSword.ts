import { Item, type GameState, characterName, speech } from '@/engine'
import { FLAG_DEMONSTRATED_COMBAT_SKILLS } from '../Act2StoryFlags'
import { SirCedric } from '../characters/SirCedric'
import { CastleCourtyard } from '../rooms/CastleCourtyard'

/** Practice sword used to demonstrate combat skill to NPCs. */
export class TrainingSword extends Item {
  constructor() {
    super({
      name: 'training sword',
      shortName: 'sword',
      description:
        'A well-balanced practice sword with a dulled blade. The grip is worn ' +
        'smooth by years of a young hand, and there is a small notch near the ' +
        "guard. Though not sharp enough for real combat, it's perfect for " +
        'demonstrating martial skills and training exercises.',
      canBeCarried: true,
    })
  }

  /**
   * Start the sparring bout with Sir Cedric in the Castle Courtyard. He
   * recognises the blade as his own first; the bout itself is answered with
   * `say` and passes the Knight's Test (see `SirCedric`).
   */
  override use(gameState: GameState): string {
    // Check if we're in the Castle Courtyard with Sir Cedric present
    const chars = gameState.currentRoom.characters
    if (
      gameState.currentRoom instanceof CastleCourtyard &&
      chars.some((char) => char instanceof SirCedric)
    ) {
      if (!gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
        // Cedric takes over: recognition, then the bout; the test passes in his answers
        const cedric = chars.find((char) => char instanceof SirCedric)
        if (cedric instanceof SirCedric) return cedric.beginBout()
      } else if (gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
        // Subsequent uses after mission explanation
        const prefix = characterName('Sir Cedric')
        return (
          `[success]${prefix} watches your combat forms with approval.\n\n` +
          speech('Your skills remain sharp,') +
          ' he observes. ' +
          speech(
            'Remember what I told you about the enchanted forest and seeking ' +
              'out ' +
              characterName('Nyx') +
              '. Gather those supplies from the Market District first - a forest ' +
              'survival kit, enhanced lantern, and quality rope. The mystical ' +
              'being Nyx holds ancient knowledge that could be crucial in our ' +
              'fight against the gathering darkness.',
          ) +
          '\n\nHe looks toward the forest beyond the city walls. ' +
          speech(
            'The enchanted forest is dangerous, but with proper preparation ' +
              'and your proven combat skills, you may succeed where others have ' +
              "failed. Nyx's wisdom could be the key to saving both Greendale " +
              'and the surrounding lands.',
          ) +
          '[/success]'
        )
      }
      // Fallback if flags are inconsistent
      return (
        '[success]' +
        characterName('Sir Cedric') +
        ' watches you run through the combat forms and nods approvingly at ' +
        'your continued martial discipline.[/success]'
      )
    }
    return (
      'You practice a few sword forms with the training sword. ' +
      'The balance feels good in your hands, and it would be perfect for ' +
      'demonstrating combat skills to someone who needs proof of your ' +
      'abilities.'
    )
  }
}
