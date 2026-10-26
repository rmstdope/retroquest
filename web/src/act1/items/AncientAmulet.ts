import { Item, type GameState, characterName, speech } from '@/engine'
import { HiddenGlade } from '../rooms/HiddenGlade'
import { OldMill } from '../rooms/OldMill'
import { Mechanism } from './Mechanism'

const RUNES = 'A mysterious amulet inscribed with runes. '
const NO_KEEPSAKE =
  RUNES + 'It is faintly warm, as if someone had only just set it down.'
const KEEPSAKE =
  RUNES + 'Its glow quickens as you lean closer, steady as a heartbeat.'
const IN_HAND = RUNES + 'It is faintly warm in your hand.'
const AT_MILL =
  RUNES +
  'It hums softly in your hand, as if answering something stirring beneath the floor.'
const AT_GLADE =
  RUNES +
  'It glows in your hand, brightest when you hold it near the mossy stone.'

/**
 * Powerful heirloom artifact intentionally withheld early to establish
 * narrative guardianship; Mira always blocks pickup. Its examine text follows
 * the state: on its stand it reacts to the locket and the mother's letter, in
 * Elior's hand it reacts to the jammed Old Mill and the Hidden Glade.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      description: IN_HAND,
      shortName: 'amulet',
    })
  }

  /** Describe the amulet as the place and the keepsakes Elior carries colour it. */
  override examine(gameState: GameState): string {
    this.description = this.reaction(gameState)
    const text = super.examine(gameState)
    // The bag panel shows `description`, so it rests on the in-hand line.
    this.description = IN_HAND
    return text
  }

  /** The examine line for the current state. */
  private reaction(gameState: GameState): string {
    if (!gameState.hasItem(this.name)) {
      return gameState.hasItem('locket') || gameState.hasItem("mother's letter")
        ? KEEPSAKE
        : NO_KEEPSAKE
    }
    const room = gameState.currentRoom
    if (room instanceof OldMill) {
      const jammed = room.items.some(
        (item) => item instanceof Mechanism && item.repaired,
      )
      return jammed ? AT_MILL : IN_HAND
    }
    return room instanceof HiddenGlade ? AT_GLADE : IN_HAND
  }

  /** Always blocks pickup with narrative justification (no readiness check yet). */
  override preventPickup(): string {
    return (
      characterName('Mira') +
      ' places a protective hand over the [item_name]amulet[/item_name]. ' +
      speech(
        'This is not yet yours to claim, ' +
          characterName('Elior') +
          '. The [item_name]ancient amulet[/item_name] ' +
          'is a powerful artifact that must be earned through preparation and wisdom. ' +
          'Complete your journey preparations first, and it shall be yours.',
      )
    )
  }
}
