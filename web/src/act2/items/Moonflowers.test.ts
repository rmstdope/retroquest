import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'
import { Moonflowers } from './Moonflowers'

describe("Moonflowers in the Healer's House", () => {
  it('are waved away toward the forest by Lyria', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.HealersHouse

    const answer = new Moonflowers().use(game.state)

    expectMarkupWellFormed(answer)
    expectDialogueSpeaker(answer, 'Master Healer Lyria')
    expect(answer).toContain('glances at the silver blooms')
    expect(answer).toContain('Take them back to the forest.')
    expect(answer).not.toContain('perfect for')
  })
})
