import { Item, type GameState } from '@/engine'
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
        'A well-balanced practice sword with a dulled blade. Though not sharp ' +
        "enough for real combat, it's perfect for demonstrating martial skills " +
        'and training exercises.',
      canBeCarried: true,
    })
  }

  /** Demonstrate combat skills to Sir Cedric in the Castle Courtyard. */
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
          '[success]You draw the training sword and perform a series of combat forms ' +
          'for [character_name]Sir Cedric[/character_name]. Your movements are fluid ' +
          'and precise, demonstrating skill with both offensive and defensive ' +
          'techniques.\n\n' +
          "Sir Cedric nods approvingly. [dialogue]'Excellent! Your martial training " +
          "is evident. I can trust someone with such disciplined combat skills.'" +
          '[/dialogue]\n\n' +
          "He pauses, his expression growing more serious. [dialogue]'Since you've " +
          'proven your combat prowess, I can share more about what lies ahead. The ' +
          "dark forces gathering aren't ordinary threats - they're connected to " +
          "ancient magical energies that have been dormant for centuries.'" +
          '[/dialogue]\n\n' +
          '[character_name]Sir Cedric[/character_name] leans closer, lowering his ' +
          "voice. [dialogue]'There are legends of a being known as [character_name]Nyx" +
          '[/character_name] - ' +
          'a mystical entity who dwells deep within the enchanted forest beyond our ' +
          'borders. Nyx is said to possess knowledge of the oldest magics, including ' +
          'secrets that could help us understand and combat these gathering ' +
          "shadows.'[/dialogue]\n\n" +
          "[dialogue]'But the enchanted forest is treacherous,'[/dialogue] he " +
          "continues. [dialogue]'You'll need proper " +
          'supplies before attempting such a journey. Visit the Market District and ' +
          'gather essential equipment: a forest survival kit, an enhanced lantern for ' +
          'the dark woods, and quality rope for navigating difficult terrain. Only ' +
          "when you're properly equipped should you venture into those mystical " +
          "lands to seek out Nyx.'[/dialogue]\n\nHe straightens up, his voice " +
          "returning to its commanding tone. [dialogue]'Time is of the essence, " +
          "Elior. The darkness grows stronger each day, and we need Nyx's ancient " +
          "wisdom to understand what we're truly facing.'[/dialogue][/success]"
        )
      } else if (gameState.getStoryFlag(FLAG_DEMONSTRATED_COMBAT_SKILLS)) {
        // Subsequent uses after mission explanation
        const prefix = '[character_name]Sir Cedric[/character_name]'
        return (
          '[success]You practice a few more combat forms with the training sword, ' +
          'and ' +
          `${prefix}` +
          " watches with approval.\n\n[dialogue]'Your skills remain sharp,'" +
          "[/dialogue] he observes. [dialogue]'Remember what I told you about the " +
          'enchanted forest and seeking out [character_name]Nyx[/character_name]. ' +
          'Gather those supplies from the Market District first - a forest survival ' +
          'kit, enhanced lantern, and quality rope. The mystical being Nyx holds ' +
          'ancient knowledge that could be crucial in our fight against the ' +
          "gathering darkness.'[/dialogue]\n\nHe looks toward the forest beyond the " +
          "city walls. [dialogue]'The enchanted forest is dangerous, but with proper " +
          'preparation and your proven combat skills, you may succeed where others ' +
          "have failed. Nyx's wisdom could be the key to saving both Greendale and " +
          "the surrounding lands.'[/dialogue][/success]"
        )
      }
      // Fallback if flags are inconsistent
      return (
        '[success]You practice combat forms with the training sword. ' +
        '[character_name]Sir Cedric[/character_name] nods approvingly at your ' +
        'continued martial discipline.[/success]'
      )
    }
    return (
      'You practice a few sword forms with the training sword. The balance feels ' +
      'good in your hands, and it would be perfect for demonstrating combat skills ' +
      'to someone who needs proof of your abilities.'
    )
  }
}
