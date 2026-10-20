import { describe, it, expect } from 'vitest'
import { GameState, Room } from '@/engine'
import { FumarolePassages } from './FumarolePassages'
import { VentStone } from '../items/VentStone'
import { HeatWardMix } from '../items/HeatWardMix'
import { PhoenixGuardian } from '../characters/PhoenixGuardian'
import {
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
} from '../Act3StoryFlags'

/** A bare game state (the Python DummyGameState). */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

describe('Fumarole Passages', () => {
  it('initializes with vent stones, the guardian and exits', () => {
    const room = new FumarolePassages()
    expect(room.name).toBe('Fumarole Passages')
    expect(
      room.description.includes('tunnels') || room.description.includes('vent'),
    ).toBe(true)
    expect(room.items.some((i) => i instanceof VentStone)).toBe(true)
    expect(room.characters.some((c) => c instanceof PhoenixGuardian)).toBe(true)
    expect(room.exits).toHaveProperty('south')
    expect(room.exits).toHaveProperty('west')
  })

  it('progresses the calibration with each vent stone', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    const [stone1, stone2, stone3] = room.items.slice(0, 3) as VentStone[]
    gs.inventory = [stone1, stone2, stone3]
    // First calibration
    const out1 = room.calibrateWithStone(gs, stone1)
    expect(gs.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED)).toBe(true)
    expect(
      out1.includes('timing seems closer') || out1.includes('steadier'),
    ).toBe(true)
    // Second calibration
    const out2 = room.calibrateWithStone(gs, stone2)
    expect(
      out2.includes('timing seems closer') || out2.includes('steadier'),
    ).toBe(true)
    // Third calibration
    const out3 = room.calibrateWithStone(gs, stone3)
    expect(
      out3.includes("vents' rhythms align") ||
        out3.includes('now accept a heat ward'),
    ).toBe(true)
    // No more stones in inventory
    expect(gs.inventory).not.toContain(stone1)
    expect(gs.inventory).not.toContain(stone2)
    expect(gs.inventory).not.toContain(stone3)
  })

  it('requires calibration before the heat ward can be applied', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    const mix = new HeatWardMix()
    gs.inventory = [mix]
    // Not calibrated yet
    const result = room.applyHeatWard(gs, mix)
    expect(
      result.includes('not yet synchronized') ||
        result.includes('calibrate more'),
    ).toBe(true)
    // Calibrate three times
    for (const stone of room.items.slice(0, 3) as VentStone[]) {
      gs.inventory.push(stone)
      room.calibrateWithStone(gs, stone)
    }
    // Now apply heat ward
    const result2 = room.applyHeatWard(gs, mix)
    expect(gs.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED)).toBe(
      true,
    )
    expect(
      result2.includes('ward seals into place') ||
        result2.includes('passage through the fumaroles is now safe'),
    ).toBe(true)
    expect(gs.inventory).not.toContain(mix)
  })

  it('blocks the south exit until the quest is completed', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    // By default, south is hidden
    const exits = room.getExits(gs)
    expect(exits).not.toHaveProperty('south')
    // Set completion flag
    gs.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, true)
    const exits2 = room.getExits(gs)
    expect(exits2).toHaveProperty('south')
  })

  it('sets the started flag on enter', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    room.onEnter(gs)
    expect(gs.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED)).toBe(true)
  })
})
