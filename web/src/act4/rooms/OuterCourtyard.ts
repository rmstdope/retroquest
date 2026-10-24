import { Room, type Exits, type GameState, clue } from '@/engine'
import { COURTYARD_AFTER_DESCRIPTION } from './courtyardDescriptions'
import { CaptainOfTheGuard } from '../characters/CaptainOfTheGuard'
import { TrappedServants } from '../characters/TrappedServants'
import { ServantsPendant } from '../items/ServantsPendant'
import {
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
  FLAG_ACT4_TRAPPED_SERVANTS_STARTED,
} from '../Act4StoryFlags'

/**
 * A once-beautiful courtyard now tainted by shadow magic and trapped souls.
 *
 * Introduces themes of compassion through freeing enslaved servants: the
 * Guardian's essence and blessing magic are required to break their chains.
 */
export class OuterCourtyard extends Room {
  constructor() {
    super({
      name: 'Outer Courtyard',
      description:
        'This was a garden once. The fountains still stand under a sky that ' +
        'never quite rains, but what runs down them is black and slow, and the ' +
        'statues have all turned their faces away. Grey figures walk the paths ' +
        'in circles, chains of shadow at their ankles, never looking up. ' +
        'By the dry fountain a soldier in a soot-black royal tabard stands ' +
        'rigid, staring at nothing.',
      items: [],
      characters: [new TrappedServants(), new CaptainOfTheGuard()],
      exits: { west: 'FortressGates', north: 'MirrorLabyrinth' },
    })
  }

  /** Starting to explore the courtyard starts the servants quest. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_STARTED, true)
  }

  /** The way west is always open; north opens once the servants are free. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return { west: this.exits.west }
    }
    return { west: this.exits.west, north: this.exits.north }
  }

  /** The bound servants drift across the archway north. */
  override blockedExit(
    _gameState: GameState,
    direction: string,
  ): string | null {
    if (direction !== 'north') return null
    return clue(
      'The servants drift across the archway, their chains ' +
        'trailing. They do not stop for you, and you cannot get past ' +
        'them.',
    )
  }

  /** Handle casting bless spell on servants. */
  castBless(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
      return clue(
        'The servants flinch from the light and keep walking. They ' +
          'do not know you, and they have learned what strangers bring.',
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      gameState.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
      gameState.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, true)
      // The servants offer the pendant
      this.addItem(new ServantsPendant())
      // The servants stay, now called the Freed Servants
      const servants = this.getCharacterByName('servants')
      if (servants instanceof TrappedServants) servants.free()
      this.description = COURTYARD_AFTER_DESCRIPTION
      return (
        'Your blessing settles over the courtyard like warm light through a ' +
        'window. The chains do not break so much as forget to hold, and fall ' +
        'away. One by one the servants stand still and look up. ' +
        'By the fountain, the captain blinks, as if waking from a long sleep. ' +
        'One of the servants presses a small blue ' +
        "[item_name]Servant's Pendant[/item_name] into your hands."
      )
    }
    return '[dim]The chains are gone. There is nothing left to bless away.[/dim]'
  }
}
