import { Room, type Exits, type GameState, event } from '@/engine'
import { CaptainOfTheGuard } from '../characters/CaptainOfTheGuard'
import { TrappedServants } from '../characters/TrappedServants'
import { LoyaltyToken } from '../items/LoyaltyToken'
import { ServantsPendant } from '../items/ServantsPendant'
import {
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
  FLAG_ACT4_TRAPPED_SERVANTS_STARTED,
} from '../Act4StoryFlags'

/** The courtyard once the servants are free and the captain has woken. */
const COURTYARD_AFTER_DESCRIPTION =
  'The fountains have stopped running black, and the sky has thinned to ' +
  'grey. The Freed Servants rest by the fountains, their chains gone, and ' +
  'the captain of the guard sits among them with his head in his hands.'

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
    return (
      '[failure]The servants drift across the archway, their chains ' +
      'trailing. They do not stop for you, and you cannot get past ' +
      'them.[/failure]'
    )
  }

  /** Handle casting bless spell on servants. */
  castBless(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
      return (
        '[failure]The servants flinch from the light and keep walking. They ' +
        'do not know you, and they have learned what strangers bring.[/failure]'
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      gameState.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
      gameState.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, true)
      // Add the loyalty token and pendant to the room
      this.addItem(new LoyaltyToken())
      this.addItem(new ServantsPendant())
      // The servants stay, now called the Freed Servants
      const servants = this.getCharacterByName('servants')
      if (servants instanceof TrappedServants) servants.free()
      this.description = COURTYARD_AFTER_DESCRIPTION
      return event(
        'Your blessing settles over the courtyard like warm light through a ' +
          'window. The chains do not break so much as forget to hold, and fall ' +
          'away. One by one the servants stand still and look up. ' +
          'By the fountain, the captain blinks, as if waking from a long sleep. ' +
          'One of the servants presses two things into your hands: a silver ' +
          '[item_name]Loyalty Token[/item_name] and a small blue ' +
          "[item_name]Servant's Pendant[/item_name].",
      )
    }
    return '[dim]The chains are gone. There is nothing left to bless away.[/dim]'
  }
}
