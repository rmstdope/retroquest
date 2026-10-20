import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems, writing } from '@/engine'
import { Act1 } from '../Act1'
import { MysteriousBox } from './MysteriousBox'

const NOTE = writing('For when the light comes back to you.')

/** An Act I game with an unlocked mysterious box in the current room. */
function gameWithUnlockedBox(): { game: Game; box: MysteriousBox } {
  const game = new Game([new Act1()])
  const box = new MysteriousBox()
  box.unlock(game.state)
  game.state.currentRoom.addItem(box)
  return { game, box }
}

describe('MysteriousBox', () => {
  it("opens to the map and a note in Elior's father's hand", () => {
    const { game } = gameWithUnlockedBox()

    const answer = game.commandParser.parse('open box')

    expect(answer).toContain(NOTE)
    expect(answer).toContain('father')
    expect(findMarkupProblems(answer)).toEqual([])
    expect(game.state.hasItem('map')).toBe(true)
  })

  it('keeps the note to be read again', () => {
    const { game } = gameWithUnlockedBox()
    game.commandParser.parse('open box')

    expect(game.commandParser.parse('examine box')).toContain(NOTE)
  })

  it('opens in a save made before the note, unlocked but not opened', () => {
    const { game } = gameWithUnlockedBox()
    const loaded = new Game([new Act1()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(loaded.commandParser.parse('open box')).toContain(NOTE)
    expect(loaded.state.hasItem('map')).toBe(true)
  })
})
