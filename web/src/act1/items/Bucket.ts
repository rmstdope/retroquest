import { Item, type GameState, clue } from '@/engine'
import { FLAG_VEGETABLE_FIELD_WATERED } from '../Act1StoryFlags'
import { VegetableField } from '../rooms/VegetableField'
import { refreshRoomDescription } from '../refreshRoomDescription'
import { Well } from './Well'
import { WitheredCarrot } from './WitheredCarrot'

const EMPTY_DESCRIPTION =
  "A sturdy wooden bucket with a rope handle. It's perfect for drawing water " +
  'from a well or carrying supplies.'

/**
 * A bucket for drawing water from the well: murky, sour water before the
 * well is purified, clear water afterwards. Clear water poured on the
 * Vegetable Field makes the whole field recover.
 */
export class Bucket extends Item {
  /**
   * Whether the water in the bucket came from the purified well. Missing in
   * saves made before the bucket could water the field; see hasPurifiedWater.
   */
  holdsPurifiedWater?: boolean = false

  constructor() {
    super({
      name: 'bucket',
      description: EMPTY_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /**
   * Whether the bucket holds clear water. Saves made before the field could
   * be watered lack the field and always called the water clear, so there it
   * only counts once the Village Well's well is actually purified.
   */
  private hasPurifiedWater(gameState: GameState): boolean {
    if (this.holdsPurifiedWater !== undefined) return this.holdsPurifiedWater
    const well = gameState.getRoom('Village Well')?.getItemByName('well')
    return (
      well instanceof Well &&
      well.isPurified &&
      this.description.includes('clear water')
    )
  }

  /** Fill the bucket with the water in the well. */
  private fill(well: Well): string {
    this.name = 'bucket (full)'
    this.holdsPurifiedWater = well.isPurified
    const water = well.isPurified
      ? 'clear water'
      : 'murky water, with a sour smell'
    this.description =
      `A sturdy wooden bucket with a rope handle. It is full of ${water} ` +
      'drawn from the well.'
    return water
  }

  /**
   * Draw water from the well. A bucket of murky water is tipped out and
   * drawn again once the well is purified. With the carrot, water the field.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Well) {
      if (this.name === 'bucket') {
        const kind = other.isPurified ? 'clear' : 'murky'
        this.fill(other)
        return (
          'The [item_name]bucket[/item_name] comes up from the ' +
          `[item_name]well[/item_name] full of ${kind} water.`
        )
      }
      if (other.isPurified && !this.hasPurifiedWater(gameState)) {
        this.fill(other)
        return (
          'The old water splashes out onto the stones, and the ' +
          '[item_name]bucket[/item_name] comes up again full of clear water.'
        )
      }
      return '[failure]The [item_name]bucket[/item_name] is already full.[/failure]'
    }
    if (other instanceof WitheredCarrot) return this.use(gameState)
    return clue(
      'The [item_name]bucket[/item_name] is no use with that. Perhaps near ' +
        'something with water?',
    )
  }

  /** In the Vegetable Field, water the crops with clear water from the well. */
  override use(gameState: GameState): string {
    if (!(gameState.currentRoom instanceof VegetableField)) {
      return super.use(gameState)
    }
    if (this.name === 'bucket') {
      return clue(
        'The [item_name]bucket[/item_name] is empty. ' +
          'The parched rows will need water from somewhere.',
      )
    }
    if (!this.hasPurifiedWater(gameState)) {
      return clue(
        'You lift the [item_name]bucket[/item_name], then think ' +
          'better of it. The sour water from the well would only sicken the ' +
          'soil further.',
      )
    }
    this.name = 'bucket'
    this.holdsPurifiedWater = false
    this.description = EMPTY_DESCRIPTION
    if (gameState.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)) {
      return 'The field drinks the clear water gladly, already green and thriving.'
    }
    gameState.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    refreshRoomDescription(gameState)
    return (
      'You walk the rows, pouring the clear well water along the cracked earth.\n' +
      'The soil darkens and drinks it in. ' +
      'Before your eyes, the brittle leaves uncurl and green shoots push up ' +
      'between the rows. By the time the [item_name]bucket[/item_name] is ' +
      'empty, the whole [room_name]Vegetable Field[/room_name] is breathing again.'
    )
  }
}
