import { Spell, type GameState, clue } from '@/engine'
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
        'A druidic spell that enhances your connection to the natural world. ' +
        'When cast, it allows you to sense the life force of plants and ' +
        'animals around you, detect hidden paths through forests, and ' +
        'understand the subtle warnings that nature provides about dangers ' +
        'ahead. This ancient magic was once commonly known among those who ' +
        'lived in harmony with the wilderness.',
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
          'Your awareness extends throughout the glade. Immediately, you ' +
          'sense magical presences by the stream - graceful forms of living ' +
          'water and moonlight. The water nymphs reveal themselves, ' +
          'shimmering into visibility as they recognize your magical ' +
          'sensitivity and respect for the natural world.'
        )
      }
      const name = this.name
      return clue(
        `Your [spell_name]${name}[/spell_name] reveals the familiar ` +
          'presence of the water nymphs by the sacred stream, their forms ' +
          'visible and welcoming.',
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
    if (roomName.includes('forest') || roomName.includes('enchanted')) {
      // In forest areas, provide enhanced sensory information
      return (
        '[success]Your awareness expands throughout the surrounding forest. The whisper of leaves ' +
        'speaks of safe passages, the rustle of small creatures warns of ' +
        'predators, and the very air reveals the health of the woodland. ' +
        'You sense several hidden paths that wind through the trees, offering ' +
        'safer routes through the wilderness.[/success]'
      )
    } else if (roomName.includes('transition')) {
      // In transition areas, help detect magical boundaries
      return (
        '[success]You feel the magical ' +
        'boundaries that separate different realms. The spell reveals the ebb ' +
        'and flow of natural energy, showing you where the civilized world ' +
        'ends and wilder magics begin. You can sense the ancient protections ' +
        'woven into the very landscape.[/success]'
      )
    }
    // In other areas, provide general nature awareness
    return (
      '[dim]You feel a subtle ' +
      "connection to the natural world around you. While there isn't much " +
      'wilderness here, you gain a better understanding of the living ' +
      'things in this area and their relationship to the environment.[/dim]'
    )
  }
}
