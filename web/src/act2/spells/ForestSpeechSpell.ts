import { Spell, type Character, type GameState, characterName } from '@/engine'
import {
  FLAG_FOUND_RAVINE,
  FLAG_RAVINE_CREATURES_TOLD,
} from '../Act2StoryFlags'
import { Ravine } from '../items/Ravine'
import { ForestEntrance } from '../rooms/ForestEntrance'
import { AncientTreeSpirit } from '../characters/AncientTreeSpirit'
import { ForestSprites } from '../characters/ForestSprites'
import { WaterNymphs } from '../characters/WaterNymphs'

/**
 * Druidic communication spell enabling dialogue with forest life and discovery
 * hooks. Enables discovery of the Ravine (caravan hook) on first contextual use
 * in the Forest Entrance; if nature sense found it first, the creatures tell
 * their story once instead.
 */
export class ForestSpeechSpell extends Spell {
  constructor() {
    super({
      id: 'forest_speech',
      name: 'forest speech',
      description:
        'An ancient druidic spell that grants the ability to communicate with ' +
        'trees, plants, and forest creatures. This magic opens your mind to the ' +
        'slow, deep thoughts of ancient trees and the quick, bright chatter of ' +
        'woodland animals. Through this spell, you can seek guidance, learn ' +
        'forest secrets, and understand the hidden wisdom of the natural world.',
    })
  }

  /** Cast the spell in the current room; handle ravine discovery and flavor text. */
  override castSpell(gameState: GameState): string {
    const currentRoom = gameState.currentRoom
    // Special caravan search logic for Forest Entrance
    const name = this.name
    if (
      currentRoom instanceof ForestEntrance &&
      !gameState.getStoryFlag(FLAG_FOUND_RAVINE)
    ) {
      gameState.setStoryFlag(FLAG_FOUND_RAVINE, true)
      gameState.setStoryFlag(FLAG_RAVINE_CREATURES_TOLD, true)
      // Add the Ravine item to the Forest Entrance room
      const ravine = new Ravine()
      currentRoom.items.push(ravine)
      return (
        `[success]You cast [spell_name]${name}[/spell_name] and the woodland creatures ` +
        'gather around you excitedly. A family of squirrels chatters frantically about ' +
        'strange noises from the deep ravine to the northeast. An old owl hoots solemnly ' +
        "about 'metal beasts trapped in the earth-scar where the stone walls weep.' " +
        'The animals describe a steep ravine hidden beyond the thickest part of the ' +
        'forest, where something seems to be moving. You should try to get down there.' +
        '[/success]'
      )
    }
    // Nature sense found the ravine first: the creatures tell their story once
    if (
      currentRoom instanceof ForestEntrance &&
      !gameState.getStoryFlag(FLAG_RAVINE_CREATURES_TOLD)
    ) {
      gameState.setStoryFlag(FLAG_RAVINE_CREATURES_TOLD, true)
      return (
        `[success]You cast [spell_name]${name}[/spell_name] and the woodland ` +
        'creatures gather around you excitedly. A family of squirrels chatters ' +
        'frantically about strange noises from the ravine you sensed. An old owl ' +
        "hoots solemnly about 'metal beasts trapped in the earth-scar where the " +
        "stone walls weep.' Something down there is still moving. You should try " +
        'to get down there.[/success]'
      )
    }
    // Check if caravan has already been found in Forest Entrance
    if (
      currentRoom instanceof ForestEntrance &&
      gameState.getStoryFlag(FLAG_FOUND_RAVINE)
    ) {
      return (
        `[dim]You cast [spell_name]${name}[/spell_name], but the woodland creatures ` +
        "have no new information about the ravine - you've already located it." +
        '[/dim]'
      )
    }
    // Normal forest speech behavior for other locations
    const roomName = currentRoom.name.toLowerCase()
    if (roomName.includes('forest') || roomName.includes('grove')) {
      return (
        `[success]You cast [spell_name]${name}[/spell_name] and suddenly ` +
        'the forest comes alive with conversation. The trees whisper their ancient ' +
        'wisdom, sharing memories of seasons past and warnings of dangers ahead. ' +
        'Small woodland creatures emerge to share news of hidden paths and secret ' +
        'places. You feel deeply connected to the living tapestry of the forest.' +
        '[/success]'
      )
    } else if (roomName.includes('enchanted')) {
      return (
        `[success]You cast [spell_name]${name}[/spell_name] in this magical ` +
        'realm and the response is overwhelming. Every plant, from the mightiest ' +
        'tree to the smallest moss, has something to say. The magical nature of ' +
        'this place amplifies your connection, allowing you to understand even ' +
        'the most subtle communications from the natural world.' +
        '[/success]'
      )
    }
    return (
      `[dim]You cast [spell_name]${name}[/spell_name], but there are ` +
      'few natural beings here to communicate with. You sense the faint whispers ' +
      'of any plants nearby, but the spell would be much more powerful in a ' +
      'forest or natural environment.' +
      '[/dim]'
    )
  }

  /** Allow communication with forest creatures. */
  override castOnCharacter(
    _gameState: GameState,
    targetCharacter: Character,
  ): string {
    const tname = targetCharacter.name
    if (
      targetCharacter instanceof AncientTreeSpirit ||
      targetCharacter instanceof ForestSprites ||
      targetCharacter instanceof WaterNymphs
    ) {
      return (
        `[success]You cast [spell_name]${this.name}[/spell_name] on ` +
        characterName(tname) +
        ', opening a channel of deep, mystical communication. Through the ' +
        "spell's magic, you can understand their ancient wisdom and forest " +
        'secrets.[/success]'
      )
    }
    return (
      `[dim]You cast [spell_name]${this.name}[/spell_name] on ` +
      characterName(tname) +
      ', but this spell is designed for communication with forest beings ' +
      'and natural spirits. It has no effect on this character.[/dim]'
    )
  }
}
