import { describe, expect, it } from 'vitest'
import { Game, type GameState } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act4 } from './Act4'
import { FLAG_ACT4_SERVANTS_FREED } from './Act4StoryFlags'
import { CrystalPrison } from './items/CrystalPrison'
import { CrystalWhispers } from './items/CrystalWhispers'
import { EchoStone } from './items/EchoStone'
import { GuardiansChain } from './items/GuardiansChain'
import { LoyaltyToken } from './items/LoyaltyToken'
import { ServantsPendant } from './items/ServantsPendant'
import { SorceressStaff } from './items/SorceressStaff'
import { SorceressTruth } from './items/SorceressTruth'
import type { MemoryVault } from './rooms/MemoryVault'
import type { MirrorLabyrinth } from './rooms/MirrorLabyrinth'
import type { TowerOfShadows } from './rooms/TowerOfShadows'
import { Bless } from './spells/Bless'
import { HeartsTruth } from './spells/HeartsTruth'

/**
 * rq-s5a: rq-xud.5 cut these Act IV openings as if they repeated the typed
 * command. Each tells how Elior does the thing, so each is read again, as the
 * first words of the answer's first story block.
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
  if (block.kind === 'failure' && block.narrated) return block.markup
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
  it('turning left in the maze', () => {
    const { game } = inMaze()
    expect(firstRead(game.move('west'))).toBe(
      'You turn left, and the glass lets you through.',
    )
    expect(firstRead(game.move('west'))).toBe(
      'You turn left again, and the glass lets you through.',
    )
  })

  it('retracing out of the glass', () => {
    const { game } = inMaze()
    expect(firstRead(game.move('south'))).toBe(
      'You retrace your steps out of the glass.',
    )
  })

  it('stepping into the empty corridor', () => {
    const { game, room } = inMaze()
    game.move('west')
    game.move('west')
    room.usePendant(game.state)
    expect(firstRead(game.move('east'))).toMatch(
      /^You step into the empty corridor\. Behind you the false mirrors go dark/,
    )
  })

  it('holding the echo stone to your ear, in the maze and elsewhere', () => {
    const { game, room } = inMaze()
    expect(firstRead(room.useStone(game.state))).toBe(
      'You hold the echo stone to your ear. One voice repeats, patient as a ' +
        'heartbeat:',
    )
    expect(
      firstRead(EchoStone.useInRoom(inRoom('FortressGates').state)),
    ).toMatch(
      /^You hold the echo stone to your ear\. The hall's voices murmur inside it, waiting/,
    )
    const enhanced = new EchoStone()
    enhanced.enhance()
    expect(firstRead(enhanced.use(inRoom('FortressGates').state))).toBe(
      'You hold the stone to your ear. The voices inside it are clearer ' +
        'now, waiting for a place where memories sleep.',
    )
  })

  it('raising the echo stone to mend the orbs', () => {
    const { game } = inRoom('MemoryVault')
    const vault = game.state.currentRoom as MemoryVault
    expect(firstRead(vault.mendOrbs(game.state))).toMatch(
      /^You raise the echo stone\. The voices inside it pour out into the vault/,
    )
  })

  it('setting a foot on the tower stair', () => {
    const { game } = inRoom('TowerOfShadows')
    const tower = game.state.currentRoom as TowerOfShadows
    expect(firstRead(tower.blockedExit(game.state, 'up'))).toMatch(
      /^You set your foot on the stair, and the whispers close in: /,
    )
  })

  it('holding the token up on the stair', () => {
    const { state } = inRoom('TowerOfShadows')
    expect(firstRead(new LoyaltyToken().use(state))).toMatch(
      /^You hold the token up, and it grows warm\. Under the whispers/,
    )
  })

  it('pouring the elixir over the crystal', () => {
    const { state } = inRoom('ThroneChamber')
    expect(firstRead(new CrystalPrison().breakWith(state))).toMatch(
      /^You pour the elixir over the crystal\. It cracks like ice in spring/,
    )
  })

  it('holding the chain up between you and the knight', () => {
    const { state } = inRoom('HallOfEchoes')
    expect(firstRead(new GuardiansChain().use(state))).toBe(
      'You hold the chain up between you and the knight. The crystals ' +
        'catch what little light there is and keep it. His sorrow is still ' +
        'there, but it no longer reaches you.',
    )
  })

  it('turning the mask over in your hands', () => {
    const { state } = inRoom('OuterCourtyard')
    expect(firstRead(new SorceressTruth().use(state))).toBe(
      'You turn the mask over in your hands. Somewhere ahead is someone who ' +
        'needs to see that a liar can choose the truth.',
    )
  })

  it('channelling divine energy where nothing answers', () => {
    const { state } = inRoom('FortressGates')
    expect(firstRead(new Bless().castSpell(state))).toBe(
      'You channel divine energy, filling the area with warm, golden ' +
        'light, but there is nothing here that responds to the blessing.',
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
