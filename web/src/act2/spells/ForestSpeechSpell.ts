import { Spell, type Character, type GameState, clue } from '@/engine'
import { FLAG_FOUND_RAVINE, FLAG_RAVINE_STORY_PENDING } from '../Act2StoryFlags'
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
      // Add the Ravine item to the Forest Entrance room
      const ravine = new Ravine()
      currentRoom.items.push(ravine)
      return (
        '[success]The woodland creatures ' +
        'gather around you excitedly. A family of squirrels chatters frantically about ' +
        'strange noises from the deep ravine to the northeast. An old owl hoots solemnly ' +
        "about 'metal beasts trapped in the earth-scar where the stone walls weep.' " +
        'The animals describe a steep ravine hidden beyond the thickest part of the ' +
        'forest, where something seems to be moving. The owl looks at you, ' +
        'and then at the ravine.[/success]'
      )
    }
    // Nature sense found the ravine first: the creatures tell their story once
    if (
      currentRoom instanceof ForestEntrance &&
      gameState.getStoryFlag(FLAG_RAVINE_STORY_PENDING)
    ) {
      gameState.setStoryFlag(FLAG_RAVINE_STORY_PENDING, false)
      return (
        '[success]The woodland ' +
        'creatures gather around you excitedly. A family of squirrels chatters ' +
        'frantically about strange noises from the ravine you sensed. An old owl ' +
        "hoots solemnly about 'metal beasts trapped in the earth-scar where the " +
        "stone walls weep.' Something down there is still moving.[/success]"
      )
    }
    // Check if caravan has already been found in Forest Entrance
    if (
      currentRoom instanceof ForestEntrance &&
      gameState.getStoryFlag(FLAG_FOUND_RAVINE)
    ) {
      return (
        `[failure]You cast [spell_name]${name}[/spell_name], but the woodland creatures ` +
        "have no new information about the ravine - you've already located it." +
        '[/failure]'
      )
    }
    // Normal forest speech behavior for other locations
    const roomName = currentRoom.name.toLowerCase()
    if (roomName.includes('forest') || roomName.includes('grove')) {
      return (
        '[success]The forest comes alive with conversation. The trees whisper their ancient ' +
        'wisdom, sharing memories of seasons past and warnings of dangers ahead. ' +
        'Small woodland creatures emerge to share news of hidden paths and secret ' +
        'places. You feel deeply connected to the living tapestry of the forest.' +
        '[/success]'
      )
    } else if (roomName.includes('enchanted')) {
      return (
        '[success]In this magical ' +
        'realm the response is overwhelming. Every plant, from the mightiest ' +
        'tree to the smallest moss, has something to say. The magical nature of ' +
        'this place amplifies your connection, allowing you to understand even ' +
        'the most subtle communications from the natural world.' +
        '[/success]'
      )
    }
    return clue(
      'There are few natural beings here to communicate with. You sense the ' +
        'faint whispers of any plants nearby, but the spell would be much ' +
        'more powerful in a forest or natural environment.',
    )
  }

  /** Allow communication with forest creatures. */
  override castOnCharacter(
    _gameState: GameState,
    targetCharacter: Character,
  ): string {
    if (
      targetCharacter instanceof AncientTreeSpirit ||
      targetCharacter instanceof ForestSprites ||
      targetCharacter instanceof WaterNymphs
    ) {
      return (
        '[success]A channel of deep, mystical communication opens between ' +
        "you. Through the spell's magic, you can understand their ancient " +
        'wisdom and forest secrets.[/success]'
      )
    }
    return clue(
      'This spell is for forest beings and natural spirits. It has no ' +
        'effect here.',
    )
  }
}
