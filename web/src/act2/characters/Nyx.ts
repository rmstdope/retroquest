import { Character, type GameState } from '@/engine'
import { NyxToken } from '../items/NyxToken'
import { ForestHeartCrystal } from '../items/ForestHeartCrystal'
import { PropheticVision } from '../spells/PropheticVision'
import { FLAG_NYX_TRIALS_COMPLETED } from '../Act2StoryFlags'

/** The forest sprite at the end of the south path, a plain witness to what Elior did. */
export class Nyx extends Character {
  constructor() {
    super({
      name: 'nyx',
      description:
        'A woman no taller than you, barefoot, with leaves caught in her ' +
        'hair. The moss is greener where she has stood.',
    })
  }

  /**
   * Return dialogue for Nyx and grant rewards on first meeting. The first
   * talk ends with the refrain and Elior's recognition of the glade stone;
   * a save that already met Nyx hears only the farewell.
   */
  override talkTo(gameState: GameState): string {
    // Check if this is the first time talking to Nyx
    if (!gameState.getStoryFlag(FLAG_NYX_TRIALS_COMPLETED)) {
      // First meeting - grant all rewards immediately
      gameState.setStoryFlag(FLAG_NYX_TRIALS_COMPLETED, true)
      // Add Prophetic Vision spell
      const propheticVision = new PropheticVision()
      gameState.knownSpells.push(propheticVision)
      // Add Nyx's Token and Forest Heart Crystal
      const nyxToken = new NyxToken()
      const forestCrystal = new ForestHeartCrystal()
      gameState.inventory.push(nyxToken, forestCrystal)
      const msg =
        '[success]The light over the altar folds into a woman no taller than ' +
        'you, barefoot, leaves caught in her hair. She looks at you the way ' +
        'you look at a road you have walked before.\n\n' +
        '"Elior. You gave the tree your acorn instead of keeping it. You ' +
        'answered the nymphs without bargaining. You brought me the three ' +
        'charms. That is enough."\n\n' +
        'She touches your forehead. Something settles behind your eyes, like ' +
        'a word you had forgotten coming back. She puts two things in your ' +
        'hands.\n\n' +
        'You have learned the spell: [spell_name]Prophetic Vision[/spell_name]\n' +
        "You have received: [item_name]Nyx's Token[/item_name]\n" +
        'You have received: [item_name]Forest Heart Crystal[/item_name]\n\n' +
        '"The storm is heading for your village. This lets you see it ' +
        'coming."\n\n' +
        'Then her voice softens, as if she is repeating something she was ' +
        'told long ago. "Remember the old words, Elior: Power follows ' +
        'purpose; purpose follows truth."\n\n' +
        'The words from the stone in the glade. You read them aloud there ' +
        'and did not know what they meant. You still do not, quite.'
      return msg + '[/success]'
    }
    // Subsequent meetings - one plain line
    return (
      'Nyx is already half leaves again. "Go home the long way, Elior. Look ' +
      'before you step."'
    )
  }
}
