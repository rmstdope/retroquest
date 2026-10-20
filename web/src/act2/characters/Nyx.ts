import { Character, type GameState } from '@/engine'
import { NyxToken } from '../items/NyxToken'
import { ForestHeartCrystal } from '../items/ForestHeartCrystal'
import { PropheticVision } from '../spells/PropheticVision'
import { FLAG_NYX_TRIALS_COMPLETED } from '../Act2StoryFlags'

/** The ancient forest sprite who guards the deepest secrets of nature. */
export class Nyx extends Character {
  constructor() {
    super({
      name: 'nyx',
      description:
        'An ethereal being of impossible beauty, with skin like moonlight and hair ' +
        'that shimmers with the colors of autumn leaves. Her eyes hold the wisdom ' +
        'of millennia, and when she moves, flowers bloom in her footsteps. She ' +
        'radiates an aura of ancient magic and natural power.',
    })
  }

  /** Return dialogue for Nyx and grant rewards on first meeting. */
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
        '[success]Nyx regards you with ancient eyes that hold the wisdom of millennia.\n\n' +
        '"Brave Elior, your journey through the forest and your respect for all ' +
        'living things has proven your worth. I have watched as you helped the ' +
        'healers, protected the innocent, and showed wisdom in your choices. For ' +
        'this, I grant you my greatest gifts."\n\n' +
        'She raises her hands, and magical energy flows into you like gentle ' +
        'starlight. You feel new knowledge settling into your mind - the gift ' +
        'of prophetic vision, allowing you to glimpse the threads of fate. ' +
        'Nyx then places two precious items in your hands.\n\n' +
        'You have learned the spell: [spell_name]Prophetic Vision[/spell_name]\n' +
        "You have received: [item_name]Nyx's Token[/item_name]\n" +
        'You have received: [item_name]Forest Heart Crystal[/item_name]\n\n' +
        '"Use these gifts wisely, young one. The prophetic vision will help you ' +
        "prepare for the gathering storm that approaches. May the forest's blessing " +
        'guide you on your path."'
      return msg + '[/success]'
    }
    // Subsequent meetings - just wish good luck
    const followup =
      'Nyx smiles with ethereal grace, her form shimmering like moonlight ' +
      'through leaves.\n\n' +
      '"Go well, Elior. The forest\'s blessing travels with you, and the gifts ' +
      'I have given will serve you in the trials ahead. Trust in your wisdom, ' +
      'courage, and compassion - they will light your way through the darkness ' +
      'that gathers. May fortune favor your quest."'
    return followup
  }
}
