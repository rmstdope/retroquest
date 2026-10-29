import { Spell, type GameState, characterName, clue } from '@/engine'
import { FLAG_FOUND_RAVINE, FLAG_RAVINE_STORY_PENDING } from '../Act2StoryFlags'
import { Ravine } from '../items/Ravine'
import { ForestEntrance } from '../rooms/ForestEntrance'
import { WaterNymphs } from '../characters/WaterNymphs'
import { WhisperingGlade } from '../rooms/WhisperingGlade'

/**
 * Reveals hidden natural presences and spawns water nymphs in Whispering Glade
 * on the first cast there. At the Forest Entrance it also finds the Ravine
 * (the drop only, not what lies in it). Keyword-based room classification (forest /
 * enchanted / transition) shapes the flavor output elsewhere.
 */
export class NatureSenseSpell extends Spell {
  natureSenseUsed = false

  constructor() {
    super({
      id: 'nature_sense',
      name: 'nature sense',
      description:
        'Read from the runes on the standing stones: a way of listening to ' +
        'everything that grows.',
    })
  }

  /**
   * Cast in the current room: nymphs in the Whispering Glade, the ravine at the
   * Forest Entrance (found once, then a dim recast line), flavour text elsewhere.
   */
  override castSpell(gameState: GameState): string {
    // Special handling for Whispering Glade
    if (gameState.currentRoom instanceof WhisperingGlade) {
      if (!this.natureSenseUsed) {
        this.natureSenseUsed = true
        // Add the Water Nymphs to the room when first cast
        gameState.currentRoom.characters.push(new WaterNymphs())
        return (
          'You hold still and let the glade come to you. The stream is not ' +
          'only water: there are shapes sitting in it, and they have been ' +
          `watching you all along. The ${characterName('water nymphs')} ` +
          'let you see them.'
        )
      }
      return clue(
        `The ${characterName('water nymphs')} are where they were, ` +
          'sitting in the stream.',
      )
    }
    if (gameState.currentRoom instanceof ForestEntrance) {
      if (gameState.getStoryFlag(FLAG_FOUND_RAVINE)) {
        return clue(
          'Again you feel the ravine to the north-east, the ground falling ' +
            'sharply away. Nothing has changed.',
        )
      }
      gameState.setStoryFlag(FLAG_FOUND_RAVINE, true)
      gameState.setStoryFlag(FLAG_RAVINE_STORY_PENDING, true)
      gameState.currentRoom.items.push(new Ravine())
      return (
        '[success]Your awareness spreads out through the roots and undergrowth. To the ' +
        'north-east the web of living things simply stops: the ground falls ' +
        'away there into a steep, rocky ravine hidden beyond the thickest trees. ' +
        'Down at the bottom, something heavy and still lies where nothing of ' +
        'the forest belongs.[/success]'
      )
    }
    const roomName = gameState.currentRoom.name.toLowerCase()
    if (roomName.includes('transition')) {
      // The standing stones: the edge of the forest
      return (
        '[success]At the stones the living things around you thin to a ' +
        'line. On the far side of it the forest begins, thick and ' +
        'watchful.[/success]'
      )
    } else if (roomName.includes('forest') || roomName.includes('enchanted')) {
      return (
        '[success]You let your awareness spread through the roots and the ' +
        'undergrowth. Everything here is alive and busy, and none of it is ' +
        'hiding from you.[/success]'
      )
    }
    // Elsewhere there is hardly anything growing
    return (
      '[dim]There is little growing here: weeds between the cobbles, a ' +
      'sparrow, moss on a wall.[/dim]'
    )
  }
}
