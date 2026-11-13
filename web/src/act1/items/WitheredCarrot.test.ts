import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { WitheredCarrot } from './WitheredCarrot'

describe('WitheredCarrot', () => {
  it('is withered until revived', () => {
    const carrot = new WitheredCarrot()

    expect(carrot.isFresh()).toBe(false)
    expect(carrot.pickedUp(new Game([new Act1()]).state)).toContain('soft')
  })

  it('is fresh once revived, whatever it is called', () => {
    const game = new Game([new Act1()])
    const carrot = new WitheredCarrot()
    carrot.revive()
    carrot.name = 'orange root'

    expect(carrot.isFresh()).toBe(true)
    expect(carrot.pickedUp(game.state)).toContain('cool and firm')
  })

  it('reads a fresh carrot from a save made before the field as fresh', () => {
    const carrot = new WitheredCarrot()
    carrot.revive()
    Reflect.deleteProperty(carrot, 'fresh')

    carrot.migrateLegacyState()

    expect(carrot.isFresh()).toBe(true)
  })

  it('reads a withered carrot from a save made before the field as withered', () => {
    const carrot = new WitheredCarrot()
    Reflect.deleteProperty(carrot, 'fresh')

    carrot.migrateLegacyState()

    expect(carrot.isFresh()).toBe(false)
  })
})
