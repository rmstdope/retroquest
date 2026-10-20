import { Spell, type GameState } from '@/engine'
import { WaterNymphs } from '../characters/WaterNymphs'
import { WhisperingGlade } from '../rooms/WhisperingGlade'

/**
 * Reveals hidden natural presences and spawns water nymphs in Whispering Glade
 * on the first cast there. Keyword-based room classification (forest /
 * enchanted / transition) shapes the flavor output elsewhere.
 */
export class NatureSenseSpell extends Spell {
  natureSenseUsed = false

  constructor() {
    super({
      name: 'nature_sense',
      description:
        'A druidic spell that enhances your connection to the natural world. ' +
        'When cast, it allows you to sense the life force of plants and ' +
        'animals around you, detect hidden paths through forests, and ' +
        'understand the subtle warnings that nature provides about dangers ' +
        'ahead. This ancient magic was once commonly known among those who ' +
        'lived in harmony with the wilderness.',
    })
  }

  override castSpell(gameState: GameState): string {
    // Special handling for Whispering Glade
    if (gameState.currentRoom instanceof WhisperingGlade) {
      if (!this.natureSenseUsed) {
        this.natureSenseUsed = true
        // Add the Water Nymphs to the room when first cast
        gameState.currentRoom.characters.push(new WaterNymphs())
        const name = this.name
        return (
          `[event]You cast [spell_name]${name}[/spell_name] and extend ` +
          'your awareness throughout the glade. Immediately, you ' +
          'sense magical presences by the stream - graceful forms of ' +
          'living water and moonlight. The water nymphs reveal ' +
          'themselves, shimmering into visibility as they recognize ' +
          'your magical sensitivity and respect for the natural ' +
          'world.[/event]'
        )
      }
      const name = this.name
      return (
        `[dim]Your [spell_name]${name}[/spell_name] reveals the familiar ` +
        'presence of the water nymphs by the sacred stream, their forms ' +
        'visible and welcoming.[/dim]'
      )
    }
    const roomName = gameState.currentRoom.name.toLowerCase()
    if (roomName.includes('forest') || roomName.includes('enchanted')) {
      // In forest areas, provide enhanced sensory information
      const name = this.name
      return (
        `[success]You cast [spell_name]${name}[/spell_name] and feel your awareness ` +
        'expand throughout the surrounding forest. The whisper of leaves ' +
        'speaks of safe passages, the rustle of small creatures warns of ' +
        'predators, and the very air reveals the health of the woodland. ' +
        'You sense several hidden paths that wind through the trees, offering ' +
        'safer routes through the wilderness.[/success]'
      )
    } else if (roomName.includes('transition')) {
      // In transition areas, help detect magical boundaries
      const name = this.name
      return (
        `[success]You cast [spell_name]${name}[/spell_name] and feel the magical ` +
        'boundaries that separate different realms. The spell reveals the ebb ' +
        'and flow of natural energy, showing you where the civilized world ' +
        'ends and wilder magics begin. You can sense the ancient protections ' +
        'woven into the very landscape.[/success]'
      )
    }
    // In other areas, provide general nature awareness
    const name = this.name
    return (
      `[dim]You cast [spell_name]${name}[/spell_name] and feel a subtle ` +
      "connection to the natural world around you. While there isn't much " +
      'wilderness here, you gain a better understanding of the living ' +
      'things in this area and their relationship to the environment.[/dim]'
    )
  }
}
