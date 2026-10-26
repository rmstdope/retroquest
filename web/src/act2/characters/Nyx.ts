import { Character, characterName, type GameState } from '@/engine'
import { NyxToken } from '../items/NyxToken'
import { ForestHeartCrystal } from '../items/ForestHeartCrystal'
import { PropheticVision } from '../spells/PropheticVision'
import {
  FLAG_BRENN_FORGIVEN,
  FLAG_MARCUS_TOLD_TRUTH,
  FLAG_NYX_TRIALS_PASSED,
  FLAG_WREN_FLOWER_GIVEN,
} from '../Act2StoryFlags'

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
   * The words Nyx adds to her witness speech about the optional kindnesses
   * Elior took, always in the order Wren, Marcus, Brenn, each in a sentence of
   * its own. One kindness gets the singular lead-in, two or three the plural;
   * none gets one neutral sentence. Includes the trailing space.
   */
  private kindnessesSpoken(gameState: GameState): string {
    const sentences: string[] = []
    if (gameState.getStoryFlag(FLAG_WREN_FLOWER_GIVEN))
      sentences.push(
        `You gave ${characterName('Wren')} your flower from the mountain, ` +
          'and she held it up to the window.',
      )
    if (gameState.getStoryFlag(FLAG_MARCUS_TOLD_TRUTH))
      sentences.push(
        `You told ${characterName('Marcus')} the truth about his daughter ` +
          'when a kinder lie was easier.',
      )
    if (gameState.getStoryFlag(FLAG_BRENN_FORGIVEN))
      sentences.push(
        `You spoke for ${characterName('Brenn')} when ` +
          `${characterName('Thorne')} would not.`,
      )
    if (sentences.length === 0)
      return 'The forest saw the road you took. It will keep watching. '
    const leadIn =
      sentences.length === 1
        ? 'No one asked this of you. '
        : 'No one asked these of you. '
    return leadIn + sentences.join(' ') + ' '
  }

  /**
   * Return dialogue for Nyx and grant rewards on first meeting. Her witness
   * speech opens with the deer that sat with Elior in the Act I glade (it was
   * hers) and names the optional kindnesses taken so far. The first
   * talk ends with the refrain and Elior's recognition of the glade stone;
   * a save that already met Nyx hears only the farewell.
   */
  override talkTo(gameState: GameState): string {
    // Check if this is the first time talking to Nyx
    if (!gameState.getStoryFlag(FLAG_NYX_TRIALS_PASSED)) {
      // The kindnesses are read now, before anything changes, and only once
      const kindnesses = this.kindnessesSpoken(gameState)
      // First meeting - grant all rewards immediately
      gameState.setStoryFlag(FLAG_NYX_TRIALS_PASSED, true)
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
        '"Elior. My deer sat with you in the glade at Willowbrook, before ' +
        'any of this. It said you were still. Few are. ' +
        'You gave the tree your acorn instead of keeping it. You ' +
        'answered the nymphs without bargaining. You brought me the three ' +
        'charms. ' +
        kindnesses +
        'That is enough."\n\n' +
        'She touches your forehead. Something settles behind your eyes, like ' +
        'a word you had forgotten coming back. She puts two things in your ' +
        'hands.\n\n' +
        'You have learned the spell: [spell_name]Prophetic Vision[/spell_name]\n' +
        "You have received: [item_name]Nyx's Token[/item_name]\n" +
        'You have received: [item_name]forest heart crystal[/item_name]\n\n' +
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
