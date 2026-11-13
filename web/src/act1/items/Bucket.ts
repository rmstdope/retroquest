import { Item, type GameState, clue } from '@/engine'
import { FLAG_VEGETABLE_FIELD_WATERED } from '../Act1StoryFlags'
import { VegetableField } from '../rooms/VegetableField'
import { Scenery } from './Scenery'
import { Well } from './Well'
import { WitheredCarrot } from './WitheredCarrot'

const EMPTY_DESCRIPTION = 'A wooden bucket with a rope handle.'

/** The scenery keys of the Vegetable Field that the bucket waters. */
const FIELD_SCENERY_KEYS: readonly string[] = [
  'VegetableField.crops',
  'VegetableField.earth',
]

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

  /**
   * Whether the bucket holds water. Missing in saves made when the state
   * lived only in the name; see migrateLegacyState.
   */
  filled?: boolean = false

  constructor() {
    super({
      name: 'bucket',
      description: EMPTY_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** Whether the bucket holds water, murky or clear. */
  isFilled(): boolean {
    return this.filled === true
  }

  /**
   * Give a save made before the `filled` field its value: a bucket with
   * water in it has a description other than the empty one.
   */
  migrateLegacyState(): void {
    this.filled ??= this.description !== EMPTY_DESCRIPTION
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

  /**
   * The bucket's look: empty, or full of the water it holds. A bucket from a
   * save made before `holdsPurifiedWater` existed says what its saved text did.
   */
  override descriptionFor(_gameState: GameState): string {
    if (!this.isFilled()) return EMPTY_DESCRIPTION
    const clear =
      this.holdsPurifiedWater ?? this.description.includes('clear water')
    const water = clear ? 'clear water' : 'murky water, with a sour smell'
    return (
      `A sturdy wooden bucket with a rope handle. It is full of ${water} ` +
      'drawn from the well.'
    )
  }

  /** Fill the bucket with the water in the well. */
  private fill(well: Well): string {
    this.filled = true
    this.name = 'bucket (full)'
    this.holdsPurifiedWater = well.isPurified
    return well.isPurified ? 'clear water' : 'murky water, with a sour smell'
  }

  /**
   * Draw water from the well. A bucket of murky water is tipped out and
   * drawn again once the well is purified. With the carrot, the crops or the
   * earth, water the field. Only the empty bucket is told to look for water.
   */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Well) {
      if (!this.isFilled()) {
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
    if (
      other instanceof WitheredCarrot ||
      (other instanceof Scenery && FIELD_SCENERY_KEYS.includes(other.key))
    ) {
      return this.use(gameState)
    }
    if (this.isFilled()) return super.useWith(gameState, other)
    return clue(
      'The [item_name]bucket[/item_name] is no use with that. Perhaps near ' +
        'something with water?',
    )
  }

  /**
   * In the Vegetable Field, water the crops with clear water from the well.
   * The empty bucket points at the parched rows only while they are parched.
   */
  override use(gameState: GameState): string {
    if (!(gameState.currentRoom instanceof VegetableField)) {
      return super.use(gameState)
    }
    if (!this.isFilled()) {
      if (gameState.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)) {
        return clue(
          'The [item_name]bucket[/item_name] is empty, and the rows have ' +
            'had their fill.',
        )
      }
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
    this.filled = false
    this.name = 'bucket'
    this.holdsPurifiedWater = false
    if (gameState.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)) {
      return 'The field drinks the clear water gladly, already green and thriving.'
    }
    gameState.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    return (
      'You walk the rows, pouring the clear well water along the cracked earth.\n' +
      'The soil darkens and drinks it in. ' +
      'Before your eyes, the brittle leaves uncurl and green shoots push up ' +
      'between the rows. By the time the [item_name]bucket[/item_name] is ' +
      'empty, the whole [room_name]Vegetable Field[/room_name] is breathing again.'
    )
  }

  /**
   * What purify does to the bucket: nothing in an empty one, nothing more in
   * clear water, and sour water clouds again, since the sourness lives in
   * the well it came from (or, once the well runs clear, since the well has
   * better water now).
   */
  purify(gameState: GameState): string {
    if (!this.isFilled()) {
      return (
        '[failure]The [item_name]bucket[/item_name] is empty; there is ' +
        'nothing in it to cleanse.[/failure]'
      )
    }
    if (this.hasPurifiedWater(gameState)) {
      return (
        '[failure]The water in the [item_name]bucket[/item_name] is ' +
        'already clear.[/failure]'
      )
    }
    const well = gameState.getRoom('Village Well')?.getItemByName('well')
    if (well instanceof Well && well.isPurified) {
      return clue(
        'The water in the bucket clears for a breath, then clouds again. ' +
          'It was drawn before the well ran clean, and the well has better ' +
          'water now.',
      )
    }
    return clue(
      'The water in the bucket clears for a breath, then clouds again from ' +
        'the bottom up. The sourness came up with it from the well, and that ' +
        'is where it lives.',
    )
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'The handle creaks, but it holds. ' +
      'Most things in Willowbrook are like that.'
    )
  }
}
