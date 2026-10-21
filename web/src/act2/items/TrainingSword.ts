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
   * Demonstrate combat skills to Sir Cedric in the Castle Courtyard. The first
   * time, Cedric recognises the blade as his own before the forms begin.
   */
  override use(gameState: GameState): string {
    // Check if we're in the Castle Courtyard with Sir Cedric present
    const chars = gameState.currentRoom.characters
    if (
      gameState.currentRoom instanceof CastleCourtyard &&
      chars.some((char) => char instanceof SirCedric)
    ) {
      if (!gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
        // First time demonstrating combat skills
        gameState.setStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS, true)

        // Remove the training sword from inventory after successful demonstration
        gameState.removeItemFromInventory('training sword')

        // Build a multi-paragraph success message using adjacent literal fragments
        return (
          '[success]You draw the [item_name]training sword[/item_name]. ' +
          'Before you can take your stance, ' +
          characterName('Sir Cedric') +
          ' catches your wrist and turns the blade to the light.\n' +
          speech(
            "'That notch by the guard. I put it there at fourteen, swinging " +
              "at a post I'd been told to leave alone. Where did you get this?'",
          ) +
          '\nYou tell him about the old man by the fire on the mountain path, ' +
          'and what he asked you to say.\n' +
          characterName('Sir Cedric') +
          ' is silent for a long moment. When he speaks, his voice is low.\n' +
          speech(
            "'The sergeant never believed in anything he couldn't hit. That " +
              "he believes in me...'",
          ) +
          ' He lets go of your wrist and steps back. ' +
          speech("'Show me what he taught you, then.'") +
          '\n\nYou draw the training sword and perform a series of ' +
          'combat forms for ' +
          characterName('Sir Cedric') +
          '. Your movements are fluid and precise, demonstrating skill with ' +
          'both offensive and defensive techniques.\n\nSir Cedric nods ' +
          'approvingly. ' +
          speech(
            "'Excellent! Your martial training is evident. I can trust someone " +
              "with such disciplined combat skills.'",
          ) +
          '\n\nHe pauses, his expression growing more serious. ' +
          speech(
            "'Since you've proven your combat prowess, I can share more about " +
              "what lies ahead. The dark forces gathering aren't ordinary " +
              "threats - they're connected to ancient magical energies that have " +
              "been dormant for centuries.'",
          ) +
          '\n\n' +
          characterName('Sir Cedric') +
          ' leans closer, lowering his voice. ' +
          speech(
            "'There are legends of a being known as " +
              characterName('Nyx') +
              ' - a mystical entity who dwells deep within the enchanted forest ' +
              'beyond our borders. Nyx is said to possess knowledge of the ' +
              'oldest magics, including secrets that could help us understand ' +
              "and combat these gathering shadows.'",
          ) +
          '\n\n' +
          speech("'But the enchanted forest is treacherous,'") +
          ' he continues. ' +
          speech(
            "'You'll need proper supplies before attempting such a journey. " +
              'Visit the Market District and gather essential equipment: a ' +
              'forest survival kit, an enhanced lantern for the dark woods, and ' +
              "quality rope for navigating difficult terrain. Only when you're " +
              'properly equipped should you venture into those mystical lands to ' +
              "seek out Nyx.'",
          ) +
          '\n\nHe straightens up, his voice returning to its commanding tone. ' +
          speech(
            "'Time is of the essence, Elior. The darkness grows stronger each " +
              "day, and we need Nyx's ancient wisdom to understand what we're " +
              "truly facing.'",
          ) +
          '[/success]'
        )
      } else if (gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
        // Subsequent uses after mission explanation
        const prefix = characterName('Sir Cedric')
        return (
          '[success]You practice a few more combat forms with the training ' +
          `sword, and ${prefix} watches with approval.\n\n` +
          speech("'Your skills remain sharp,'") +
          ' he observes. ' +
          speech(
            "'Remember what I told you about the enchanted forest and seeking " +
              'out ' +
              characterName('Nyx') +
              '. Gather those supplies from the Market District first - a forest ' +
              'survival kit, enhanced lantern, and quality rope. The mystical ' +
              'being Nyx holds ancient knowledge that could be crucial in our ' +
              "fight against the gathering darkness.'",
          ) +
          '\n\nHe looks toward the forest beyond the city walls. ' +
          speech(
            "'The enchanted forest is dangerous, but with proper preparation " +
              'and your proven combat skills, you may succeed where others have ' +
              "failed. Nyx's wisdom could be the key to saving both Greendale " +
              "and the surrounding lands.'",
          ) +
          '[/success]'
        )
      }
      // Fallback if flags are inconsistent
      return (
        '[success]You practice combat forms with the training sword. ' +
        characterName('Sir Cedric') +
        ' nods approvingly at your continued martial discipline.[/success]'
      )
    }
    return (
      'You practice a few sword forms with the training sword. The balance feels ' +
      'good in your hands, and it would be perfect for demonstrating combat skills ' +
      'to someone who needs proof of your abilities.'
    )
  }
}
