/** The camp site hints that the entry pass was the stranger's (rq-bi7). */
import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act2 } from '../Act2'

/** An Act II game with the player at the Mountain Path. */
function newGameAtPath(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom = game.state.allRooms.MountainPath
  return game
}

describe('Camp site', () => {
  it('tells of two fire pits and the boot prints the first time', () => {
    const game = newGameAtPath()

    const text = game.commandParser.parse('examine camp')

    expect(text).toContain(
      'There are two fire pits here, not one, and the ashes of one are much ' +
        'older than the other. In the soft ground beside the trail, the same ' +
        'boot prints show twice: one line coming up from Willowbrook, and a ' +
        'fresher line going back down toward it.',
    )
    expect(text).toContain(
      'to Greendale, dropped, it seems, by whoever left in such a hurry.',
    )
    expect(text).toContain('You found an [item_name]entry pass[/item_name]!')
    expect(text).not.toContain('prior traveler')
    expect(findMarkupProblems(text)).toEqual([])
  })

  it('says only the old repeat line afterwards', () => {
    const game = newGameAtPath()
    game.commandParser.parse('examine camp')

    const again = game.commandParser.parse('examine camp')

    expect(again).toContain(
      "You've already thoroughly examined the camp site. There's nothing " +
        'more to find here.',
    )
    expect(again).not.toContain('boot prints')
  })
})
