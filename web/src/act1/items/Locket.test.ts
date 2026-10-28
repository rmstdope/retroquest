import { describe, it, expect, beforeEach } from 'vitest'
import { Game, writing } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../Act1'
import { Locket } from './Locket'

describe('Locket', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageChapel
  })

  it('has the priest recognise the founders’ crest of the mother’s line when picked up', () => {
    game.state.currentRoom.addItem(new Locket())

    const response = executeCommands(game, ['take locket'])

    expect(response).toContain("only the founders' line wore it")
    expect(response).toContain("Your mother's line")
    expect(response).toContain('says the old blessing slowly')
    expect(response).not.toContain('He teaches you')
    expect(response).not.toContain('May this blessing')
    expect(response).not.toContain('As you do this')
    expect(game.state.hasSpell('bless')).toBe(true)
  })

  it('shows the founders’ crest and hints at family when examined', () => {
    game.state.addItemToInventory(new Locket())

    const response = executeCommands(game, ['examine locket'])

    expect(response).toContain('a silver tree beneath twin moons')
    expect(response).not.toContain('Ravencrest')
    expect(response).toContain('family')
  })

  it('opens to an engraving for the next of the founders’ line when used', () => {
    game.state.addItemToInventory(new Locket())

    const response = executeCommands(game, ['use locket'])

    expect(response).toContain(writing("From the founders' line, to the next."))
  })
})
