import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from './Act1'
import { Bucket } from './items/Bucket'
import { Lantern } from './items/Lantern'
import { WitheredCarrot } from './items/WitheredCarrot'
import { Well } from './items/Well'

describe('Act I loading a save made before the item state fields', () => {
  /** Save `game`, load it into a fresh Act I game and return that. */
  function reload(game: Game): Game {
    const fresh = new Game([new Act1()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    return fresh
  }

  it('reads the full bucket, the fresh carrot and the lit lantern from their old shape', () => {
    const game = new Game([new Act1()])
    const bucket = new Bucket()
    bucket.useWith(game.state, new Well())
    const carrot = new WitheredCarrot()
    carrot.revive()
    const lantern = new Lantern()
    lantern.use(game.state)
    for (const [item, field] of [
      [bucket, 'filled'],
      [carrot, 'fresh'],
      [lantern, 'lit'],
    ] as const) {
      Reflect.deleteProperty(item, field)
      game.state.addItemToInventory(item)
    }

    const loaded = reload(game).state.inventory

    expect(loaded.find((i) => i instanceof Bucket)).toMatchObject({
      filled: true,
    })
    expect(loaded.find((i) => i instanceof WitheredCarrot)).toMatchObject({
      fresh: true,
    })
    expect(loaded.find((i) => i instanceof Lantern)).toMatchObject({
      lit: true,
    })
  })

  it('reads the empty bucket, the withered carrot and the dark lantern from their old shape', () => {
    const game = new Game([new Act1()])
    for (const [item, field] of [
      [new Bucket(), 'filled'],
      [new WitheredCarrot(), 'fresh'],
      [new Lantern(), 'lit'],
    ] as const) {
      Reflect.deleteProperty(item, field)
      game.state.addItemToInventory(item)
    }

    const loaded = reload(game).state.inventory

    expect(loaded.find((i) => i instanceof Bucket)).toMatchObject({
      filled: false,
    })
    expect(loaded.find((i) => i instanceof WitheredCarrot)).toMatchObject({
      fresh: false,
    })
    expect(loaded.find((i) => i instanceof Lantern)).toMatchObject({
      lit: false,
    })
  })
})
