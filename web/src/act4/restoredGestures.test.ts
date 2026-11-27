import { describe, expect, it } from 'vitest'
import { Game, type GameState } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act4 } from './Act4'
import { FLAG_ACT4_SERVANTS_FREED } from './Act4StoryFlags'
import { CrystalWhispers } from './items/CrystalWhispers'
import { EchoStone } from './items/EchoStone'
import { ServantsPendant } from './items/ServantsPendant'
import { SorceressStaff } from './items/SorceressStaff'
import type { MirrorLabyrinth } from './rooms/MirrorLabyrinth'
import type { TowerOfShadows } from './rooms/TowerOfShadows'
import { HeartsTruth } from './spells/HeartsTruth'

/**
 * rq-s5a: rq-xud.5 cut these Act IV openings as if they repeated the typed
 * command. Each tells how Elior does the thing, so each is read again, as the
 * first words of the answer's first story block. Here are the openings no other
 * test reads; the rest are proved in the room, item and spell narration tests.
 */

/** A fresh Act IV game standing in the named room. */
function inRoom(room: string): { game: Game; state: GameState } {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = game.state.allRooms[room]
  return { game, state: game.state }
}

/** The markup of the first block of an answer, which must be read. */
function firstRead(answer: string | null): string {
  const block = parseTurn(answer ?? '')[0]
  if (block.kind === 'text') return block.markup
  throw new Error(`first block is not read: ${JSON.stringify(block)}`)
}

/** A game standing in the maze with the stone and the pendant. */
function inMaze(): { game: Game; room: MirrorLabyrinth } {
  const { game } = inRoom('MirrorLabyrinth')
  const room = game.state.currentRoom as MirrorLabyrinth
  game.state.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
  room.onEnter(game.state)
  game.state.inventory.push(new EchoStone(), new ServantsPendant())
  return { game, room }
}

describe('Act IV reads how Elior does it again (rq-s5a)', () => {
  it('holding the echo stone to your ear in the maze', () => {
    const { game, room } = inMaze()
    expect(firstRead(room.useStone(game.state))).toBe(
      'You hold the echo stone to your ear. One voice repeats, patient as a ' +
        'heartbeat:',
    )
  })

  it('setting a foot on the tower stair', () => {
    const { game } = inRoom('TowerOfShadows')
    const tower = game.state.currentRoom as TowerOfShadows
    expect(firstRead(tower.blockedExit(game.state, 'up'))).toMatch(
      /^You set your foot on the stair, and the whispers close in: /,
    )
  })

  it("listening with Heart's Truth to the staff and the crystals", () => {
    const { state } = inRoom('ChamberOfWhispers')
    const spell = new HeartsTruth()
    expect(firstRead(spell.castOnItem(state, new SorceressStaff()))).toMatch(
      /^You listen, and beneath the mask's smile there is something small/,
    )
    expect(firstRead(spell.castOnItem(state, new CrystalWhispers()))).toMatch(
      /^You listen to the crystals, and the whispers are not many voices\./,
    )
  })
})
