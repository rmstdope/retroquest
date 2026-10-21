import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'

/** The save-data shape this test edits: a graph of objects with named fields. */
interface SaveGraph {
  state: { objects: { f?: Record<string, unknown> }[] }
}

describe("Healer's House save data", () => {
  it('carries no reserved emergency-healing field', () => {
    const game = new Game([new Act2()])
    expect(game.toSaveData()).not.toContain('emergencyHealingUsed')
  })

  it('loads an older save that still holds the removed field', () => {
    const game = new Game([new Act2()])
    const payload = JSON.parse(game.toSaveData()) as SaveGraph
    const room = payload.state.objects.find(
      (entry) => entry.f?.name === "Healer's House",
    )
    expect(room?.f).toBeDefined()
    if (room?.f) room.f.emergencyHealingUsed = false
    const fresh = new Game([new Act2()])
    expect(fresh.loadSaveData(JSON.stringify(payload))).toContain('loaded')
  })
})
