import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'
import { FLAG_VEGETABLE_FIELD_WATERED } from '../Act1StoryFlags'
import { Act1 } from '../Act1'
import { Bucket } from './Bucket'
import { Well } from './Well'

describe('Bucket', () => {
  it('draws murky, sour water from the unpurified well', () => {
    const game = new Game([new Act1()])
    const bucket = new Bucket()

    const answer = bucket.useWith(game.state, new Well())

    expect(answer).toBe(
      'The [item_name]bucket[/item_name] comes up from the ' +
        '[item_name]well[/item_name] full of murky water.',
    )
    expect(bucket.description).toContain('sour smell')
    expect(bucket.description).toContain('murky')
  })

  it('draws clear water once the well is purified', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    well.isPurified = true
    const bucket = new Bucket()

    const answer = bucket.useWith(game.state, well)

    expect(answer).toContain('clear water')
    expect(bucket.description).toContain('clear water')
  })

  it('swaps murky water for clear once the well is purified', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    const bucket = new Bucket()
    bucket.useWith(game.state, well)
    well.isPurified = true

    const answer = bucket.useWith(game.state, well)

    expect(answer).toContain('clear water')
    expect(answer).not.toContain('[failure]')
    expect(bucket.description).toContain('clear water')
    expect(bucket.useWith(game.state, well)).toContain('already full')
  })
})

describe('Watering the Vegetable Field', () => {
  /** A game in the Vegetable Field holding a bucket drawn from the well. */
  function gameInTheField(purified: boolean): { game: Game; bucket: Bucket } {
    const game = new Game([new Act1()])
    const well = new Well()
    well.isPurified = purified
    const bucket = new Bucket()
    bucket.useWith(game.state, well)
    game.state.addItemToInventory(bucket)
    game.state.currentRoom = game.state.allRooms.VegetableField
    return { game, bucket }
  }

  it('makes the whole field recover with purified water', () => {
    const { game, bucket } = gameInTheField(true)
    const before = game.state.currentRoom.describe(game.state)

    const response = executeCommands(game, ['use bucket'])

    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(true)
    expectMarkupWellFormed(response)
    expect(bucket.name).toBe('bucket')
    const after = game.state.currentRoom.describe(game.state)
    expect(after).not.toBe(before)
    expect(after).not.toContain('withered crops')
    expect(after).toContain('green')
  })

  it('also waters the field when used with the carrot', () => {
    const { game } = gameInTheField(true)

    executeCommands(game, ['use bucket with carrot'])

    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(true)
  })

  /** A bucket as restored from a save made before #231: no water flag, "clear water" text. */
  function oldSaveBucket(game: Game): Bucket {
    const bucket = new Bucket()
    bucket.name = 'bucket (full)'
    bucket.description =
      'A sturdy wooden bucket with a rope handle. It is full of clear water ' +
      'drawn from the well.'
    delete bucket.holdsPurifiedWater
    Reflect.deleteProperty(bucket, 'filled')
    bucket.migrateLegacyState()
    game.state.addItemToInventory(bucket)
    game.state.currentRoom = game.state.allRooms.VegetableField
    return bucket
  }

  /** The Well item of the act's Village Well. */
  function villageWell(game: Game): Well {
    const well = game.state.allRooms.VillageWell.getItemByName('well')
    if (!(well instanceof Well)) throw new Error('no well')
    return well
  }

  it('treats an old-save bucket as sour while the well is murky', () => {
    const game = new Game([new Act1()])
    const bucket = oldSaveBucket(game)

    const response = executeCommands(game, ['use bucket'])

    expect(response).toContain('[failure]')
    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(false)
    expect(bucket.name).toBe('bucket (full)')
  })

  it('trusts an old-save bucket of clear water once the well is purified', () => {
    const game = new Game([new Act1()])
    villageWell(game).isPurified = true
    oldSaveBucket(game)

    executeCommands(game, ['use bucket'])

    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(true)
  })

  it('refuses to pour the sour water on the field', () => {
    const { game, bucket } = gameInTheField(false)

    const response = executeCommands(game, ['use bucket'])

    expect(response).toContain('[failure]')
    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(false)
    expect(bucket.name).toBe('bucket (full)')
  })

  it.each(['crops', 'earth'])(
    'waters the field when the clear water is used with the %s',
    (target) => {
      const { game, bucket } = gameInTheField(true)

      const response = executeCommands(game, [`use bucket with ${target}`])

      expectMarkupWellFormed(response)
      expect(response).not.toContain('water?')
      expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(true)
      expect(bucket.name).toBe('bucket')
    },
  )

  it.each(['crops', 'earth'])(
    'refuses to pour the sour water on the %s',
    (target) => {
      const { game, bucket } = gameInTheField(false)

      const response = executeCommands(game, [`use bucket with ${target}`])

      expect(response).toContain('sour water')
      expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(false)
      expect(bucket.name).toBe('bucket (full)')
    },
  )

  it('says the empty bucket has no water for the crops', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new Bucket())
    game.state.currentRoom = game.state.allRooms.VegetableField

    const response = executeCommands(game, ['use bucket with crops'])

    expect(response).toContain('is empty')
    expect(game.state.getStoryFlag(FLAG_VEGETABLE_FIELD_WATERED)).toBe(false)
  })

  it.each(['use bucket', 'use bucket with crops', 'use bucket with earth'])(
    'never calls the watered rows parched when the empty bucket answers %s',
    (command) => {
      const { game } = gameInTheField(true)
      executeCommands(game, ['use bucket'])

      const response = executeCommands(game, [command])

      expectMarkupWellFormed(response)
      expect(response).toContain('is empty')
      expect(response).not.toContain('parched')
      expect(response).not.toContain('need water')
    },
  )
})

describe('A full bucket used with something else', () => {
  it('is never told it needs water', () => {
    const game = new Game([new Act1()])
    const well = new Well()
    well.isPurified = true
    const bucket = new Bucket()
    bucket.useWith(game.state, well)

    const answer = bucket.useWith(game.state, new Bucket())

    expect(answer).toContain('[failure]')
    expect(answer).not.toContain('water?')
  })

  describe('its state lives in a field, not in its name', () => {
    it('knows it is full after drawing water, whatever it is called', () => {
      const game = new Game([new Act1()])
      const bucket = new Bucket()
      bucket.useWith(game.state, new Well())
      bucket.name = 'pail'

      expect(bucket.isFilled()).toBe(true)
      expect(bucket.useWith(game.state, new Well())).toContain('already full')
    })

    it('knows it is empty again after watering the field', () => {
      const game = new Game([new Act1()])
      const well = new Well()
      well.isPurified = true
      const bucket = new Bucket()
      bucket.useWith(game.state, well)
      game.state.currentRoom = game.state.allRooms.VegetableField

      bucket.use(game.state)

      expect(bucket.isFilled()).toBe(false)
      expect(bucket.name).toBe('bucket')
    })

    it('reads a save made before the field as full when the water is in it', () => {
      const game = new Game([new Act1()])
      const bucket = new Bucket()
      bucket.useWith(game.state, new Well())
      Reflect.deleteProperty(bucket, 'filled')

      bucket.migrateLegacyState()

      expect(bucket.isFilled()).toBe(true)
    })

    it('reads a save made before the field as empty when it is empty', () => {
      const bucket = new Bucket()
      Reflect.deleteProperty(bucket, 'filled')

      bucket.migrateLegacyState()

      expect(bucket.isFilled()).toBe(false)
    })
  })
})
