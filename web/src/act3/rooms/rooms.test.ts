import { describe, it, expect, beforeEach } from 'vitest'
import { Game, type Exits } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
} from '../Act3StoryFlags'

describe('Act 3 rooms', () => {
  let act3: Act3

  beforeEach(() => {
    act3 = new Act3()
  })

  it('has rooms defined', () => {
    expect(typeof act3.rooms).toBe('object')
    expect(Object.keys(act3.rooms).length).toBeGreaterThan(0)
  })

  it('has a matching reverse exit for every cardinal exit', () => {
    const game = new Game([act3])
    const reverse: Exits = {
      north: 'south',
      south: 'north',
      east: 'west',
      west: 'east',
    }

    // Enable Act 3 gating flags so conditional exits (like the sanctum)
    // are visible for the purpose of validating bidirectionality.
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)
    // Breath of the Mountain must be considered completed so the south exit
    // from Fumarole Passages is visible during the bidirectionality check.
    game.state.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, true)
    // Miners rescue must be completed so the east exit from CollapsedGalleries
    // to EchoChambers is visible during the bidirectionality check.
    game.state.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)
    // Oath of Stillness must be completed so the east exit from StillnessVestibule
    // to DragonsHall is visible during the bidirectionality check.
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)

    // Iterate through rooms by key so we can validate target links precisely
    for (const [roomKey, room] of Object.entries(act3.rooms)) {
      const exits = room.getExits(game.state)
      for (const [direction, targetKey] of Object.entries(exits)) {
        // Only enforce bi-directionality for standard cardinal directions
        if (!(direction in reverse)) continue
        expect(
          targetKey in act3.rooms,
          `Exit from ${roomKey} via '${direction}' points to unknown room '${targetKey}'.`,
        ).toBe(true)
        const targetRoom = act3.rooms[targetKey]
        const targetExits = targetRoom.getExits(game.state)
        const reverseDir = reverse[direction]
        expect(
          reverseDir in targetExits,
          `Room '${targetKey}' must have a '${reverseDir}' exit back to '${roomKey}'.`,
        ).toBe(true)
        expect(
          targetExits[reverseDir],
          `Reverse exit mismatch: from '${targetKey}' via '${reverseDir}'` +
            ` should go back to '${roomKey}', ` +
            `but goes to '${targetExits[reverseDir]}'.`,
        ).toBe(roomKey)
      }
    }
  })
})
