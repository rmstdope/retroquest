import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import { ACT3_CLASSES } from './classes'

/** Every content module of the act (tests excluded), eagerly loaded. */
const modules = import.meta.glob<Record<string, unknown>>(
  ['./{items,characters,rooms,quests,spells}/*.ts', '!./**/*.test.ts'],
  { eager: true },
)

describe('ACT3_CLASSES', () => {
  it('names every class exported by the act content files', () => {
    const registered = new Set<unknown>(Object.values(ACT3_CLASSES))
    const missing: string[] = []
    for (const [path, module] of Object.entries(modules)) {
      for (const [name, exported] of Object.entries(module)) {
        if (typeof exported === 'function' && !registered.has(exported)) {
          missing.push(`${path}:${name}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('is accepted by the game registry', () => {
    const game = new Game([new Act3()])
    expect(game.registry.names()).toContain('Act3.Locker')
    expect(game.registry.names().length).toBeGreaterThan(90)
  })
})
