import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands } from '@/testing/gameHelpers'
import { SackOfFlour } from './SackOfFlour'

describe('SackOfFlour', () => {
  it.each(['take sack of flour', 'take flour'])(
    'answers "%s" in the narrator voice and stays in the yard',
    (command) => {
      const game = new Game([new Act1()])
      game.state.currentRoom = game.state.allRooms.OldMill
      const answer = executeCommands(game, [command])
      expect(answer).toContain(
        "It is bound for the baker's, not for you. " +
          'Somebody in the village is already short of flour this week.',
      )
      expect(answer).toContain('[clue]')
      expect(answer).not.toContain("can't take")
      expect(game.state.inventory.some((i) => i instanceof SackOfFlour)).toBe(
        false,
      )
      expect(
        game.state.currentRoom.items.some((i) => i instanceof SackOfFlour),
      ).toBe(true)
    },
  )
})
