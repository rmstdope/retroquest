import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { Miners } from './Miners'
import { SirCedric } from './SirCedric'
import {
  expectDialogueSpeaker,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

describe('Miners dialogue markup', () => {
  it('attributes the rescue thanks and the later update to the miners', () => {
    const game = new Game([new Act3()])
    const miners = new Miners()
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries

    const answers = [miners.talkTo(game.state), miners.talkTo(game.state)]

    for (const answer of answers) {
      expectMarkupWellFormed(answer)
      expectDialogueSpeaker(answer, miners.name)
    }
  })

  it('has Sir Cedric offer to stay, once, only with the rescue', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries
    game.state.currentRoom.addCharacter(new SirCedric())
    const miners = new Miners()

    const first = miners.talkTo(game.state)
    const second = miners.talkTo(game.state)

    expect(first).toContain('Someone should stay until the braces settle')
    expect(first).toContain(
      'oldest miner[/character_name] puts a grey hand on his arm',
    )
    expect(first.endsWith('then nods.[/event]')).toBe(true)
    expectMarkupWellFormed(first)
    expect(second).not.toContain('Sir Cedric')
  })
})
