import { Item, type GameState, clue } from '@/engine'
import { FLAG_WELL_EXAMINED } from '../Act1StoryFlags'
import { Bucket } from './Bucket'
import { ExtendedMagneticFishingRod } from './ExtendedMagneticFishingRod'
import { FishingRod } from './FishingRod'
import { Magnet } from './Magnet'
import { MagneticFishingRod } from './MagneticFishingRod'
import { Rope } from './Rope'

const FIELD_HINT =
  ' Clean water at last; the parched [room_name]Vegetable Field[/room_name] ' +
  'next door could surely use some.'

/** Central multi-phase environmental puzzle object used for layered interactions. */
export class Well extends Item {
  containsRing = true
  isPurified = false

  constructor() {
    super({
      name: 'well',
      description:
        'An old stone well, its surface worn smooth, its shaft disappearing into ' +
        'the depths.',
    })
  }

  /** Examine the well, update flags, and adjust description based on state. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_WELL_EXAMINED, true)
    const baseDesc =
      'An old stone well, its surface worn smooth, its shaft disappearing into ' +
      'the depths.'
    if (this.isPurified) {
      if (this.containsRing) {
        this.description =
          baseDesc +
          (' The water within is crystal clear. You can see something shiny ' +
            "at the bottom, but it's still too deep to reach by hand.")
      } else {
        this.description =
          baseDesc +
          (' The water within is crystal clear. The bottom is visible and ' +
            'appears empty.')
      }
    } else {
      let desc =
        baseDesc +
        (' The water below is dark and still, and it smells sour, the way ' +
          'milk does when it has turned.')
      if (this.containsRing) {
        desc +=
          ' Far down, something glints, or you think it does. It is much too ' +
          'deep to reach.'
      }
      this.description = desc
    }
    return super.examine(gameState)
  }

  /** Delegate to bucket/fishing rod variants for retrieval attempts; the rope answers itself. */
  override useWith(gameState: GameState, other: Item): string {
    if (
      other instanceof Bucket ||
      other instanceof FishingRod ||
      other instanceof MagneticFishingRod ||
      other instanceof ExtendedMagneticFishingRod
    ) {
      return other.useWith(gameState, this)
    }
    if (other instanceof Rope) return this.answerUseFrom(gameState, other)
    return super.useWith(gameState, other)
  }

  /**
   * The magnet on its own: it would sink and stay sunk, which says it needs
   * something long to hang from; once the ring is up there is nothing to find.
   * A bare rope comes up wet; water wants a bucket.
   */
  override answerUseFrom(_gameState: GameState, item: Item): string {
    if (item instanceof Rope) {
      return clue(
        'A bare rope let down the well comes back up wet, and nothing more. ' +
          'Water wants a bucket to come up in.',
      )
    }
    if (!(item instanceof Magnet)) return ''
    if (!this.containsRing) {
      return '[failure]Nothing glints down there now for the magnet to find.[/failure]'
    }
    return clue(
      'Your arm does not reach the water, and a magnet dropped down there ' +
        'would not come back up. It would want something long to hang from.',
    )
  }

  /** Search the well for visible items based on purity and ring presence. */
  search(_gameState: GameState): string {
    if (this.isPurified) {
      if (this.containsRing) {
        return (
          'A [item_name]shiny ring[/item_name] glints at the bottom, ' +
          'tantalizingly out of reach by hand.'
        )
      }
      return 'The bottom is visible and empty.'
    }
    if (this.containsRing) {
      return clue(
        "It's hard to see clearly, but you think you catch a glimpse of " +
          "something shiny. It's far too deep to reach.",
      )
    }
    return clue("It's too dark and unclear to see anything of interest.")
  }

  /** Purify the well if examined, update state, and reveal ring if present. */
  purify(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_WELL_EXAMINED)) {
      return clue(
        'You hesitate. Why cast that on the [item_name]well[/item_name] ' +
          'before you have even looked at it?',
      )
    }
    if (this.isPurified) {
      const name = this.name
      return (
        '[failure]The [item_name]' +
        name +
        '[/item_name] is already pure. The water is ' +
        'crystal clear.[/failure]'
      )
    }
    this.isPurified = true
    if (this.containsRing) {
      return (
        'The murky water shimmers and clears! You can now ' +
        "see a [item_name]shiny ring[/item_name] at the bottom, but it's " +
        'still too deep to reach by hand.' +
        FIELD_HINT
      )
    }
    return (
      'The murky water shimmers and clears! The bottom is ' +
      "visible, but there's nothing of interest." +
      FIELD_HINT
    )
  }
}
