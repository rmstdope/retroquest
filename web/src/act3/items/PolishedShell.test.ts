import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_SHELL_HEARD } from '../Act3StoryFlags'
import { PolishedShell } from './PolishedShell'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

const FULL = 'a woman is humming: a slow tune that climbs three notes'
const SHORT = 'The woman in the shell is still humming the same slow tune.'

/** A game with the shell in the current room. */
function setup(): { game: Game; shell: PolishedShell } {
  const game = new Game([new Act3()])
  const shell = new PolishedShell()
  game.state.currentRoom.addItem(shell)
  return { game, shell }
}

describe('PolishedShell', () => {
  it('hints that it hums when examined, every time', () => {
    const { game, shell } = setup()
    for (let i = 0; i < 2; i++) {
      const out = shell.examine(game.state)
      expect(out).toContain(
        'shines in the moonlight. Held close, it seems to hum.',
      )
      expectMarkupWellFormed(out)
    }
  })

  it('still shows the hint when the saved description predates it', () => {
    const { game, shell } = setup()
    shell.description =
      "A small, iridescent shell smoothed by long tides. It's pretty and " +
      'shines in the moonlight.'
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())
    const loaded = fresh.state.currentRoom.items.find(
      (i) => i instanceof PolishedShell,
    )
    expect(loaded?.examine(fresh.state)).toContain(
      'shines in the moonlight. Held close, it seems to hum.',
    )
  })

  it('plays the full tune on the first listen, then one short line', () => {
    const { game, shell } = setup()
    expect(game.state.getStoryFlag(FLAG_ACT3_SHELL_HEARD)).toBeFalsy()
    const first = shell.listen(game.state)
    expect(first).toContain(FULL)
    expect(first).toContain('You hold the shell to your ear.')
    expect(game.state.getStoryFlag(FLAG_ACT3_SHELL_HEARD)).toBe(true)
    const later = shell.listen(game.state)
    expect(later).toContain(SHORT)
    expect(later).not.toContain(FULL)
    expectMarkupWellFormed(first)
    expectMarkupWellFormed(later)
  })

  it('treats use like listen, sharing the first-time state', () => {
    const { game, shell } = setup()
    expect(shell.use(game.state)).toContain(FULL)
    expect(shell.listen(game.state)).toContain(SHORT)
    expect(shell.use(game.state)).toContain(SHORT)
  })

  it('works through the game commands, in the room and carried', () => {
    const { game } = setup()
    expect(game.listen('shell')).toContain(FULL)
    game.take('shell')
    expect(game.use('shell')).toContain(SHORT)
    expect(game.listen('shell')).toContain(SHORT)
  })
})
