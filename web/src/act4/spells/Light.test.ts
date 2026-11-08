import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED,
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_TOWER_STAIR_OPEN,
} from '../Act4StoryFlags'
import { TruthSight } from './TruthSight'

/** The answers that would contradict a room built on shadow, grime or glass. */
const STOCK_LINES = [
  'It is already light enough here.',
  'The light shows it clearly, but has no special effect.',
  'Your sight sharpens, but there is no illusion here to see through.',
  "You don't see a",
  'Nothing in them answers the spell.',
  'Nothing in it answers the spell.',
]

/** An Act IV game standing in the named room, with Truth Sight learned. */
function standingIn(room: keyof Act4['rooms']): Game {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.currentRoom = act.rooms[room]
  game.state.learnSpell(new TruthSight())
  return game
}

/** Assert that a command answers in-world, and return the answer. */
function answersInWorld(game: Game, command: string): string {
  const answer = executeCommands(game, [command])
  for (const stock of STOCK_LINES) expect(answer).not.toContain(stock)
  return answer
}

describe('Light and Truth Sight in the Tower of Shadows', () => {
  it.each([
    ['cast light', 'The shadows draw back'],
    ['cast light on shadows', 'a moment late'],
    ['cast light on the shadows', 'a moment late'],
    ['cast light on shadow', 'a moment late'],
    ['cast light on stair', 'The shadows draw back'],
    ['cast light on stairs', 'The shadows draw back'],
    ['cast light on whispers', 'there is no one on it'],
    ['cast truth sight', 'only shadows'],
    ['cast truth sight on shadows', 'only shadows'],
    ['cast truth sight on shadow', 'only shadows'],
    ['cast truth sight on stair', 'only shadows'],
    ['cast truth sight on stairs', 'only shadows'],
    ['cast truth sight on whispers', 'the eye cannot answer'],
  ])('%s answers from the stair while the whispers hold it', (cmd, words) => {
    const game = standingIn('TowerOfShadows')
    expect(answersInWorld(game, cmd)).toContain(words)
  })

  it('finds only a stair once the whispers are gone', () => {
    const game = standingIn('TowerOfShadows')
    game.state.setStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN, true)
    expect(answersInWorld(game, 'cast light')).toContain('only a stair')
    expect(answersInWorld(game, 'cast light on stair')).toContain(
      'only a stair',
    )
    expect(answersInWorld(game, 'cast light on shadows')).toContain(
      'They keep still now.',
    )
  })

  it('sees no illusion on the stair once the whispers are gone', () => {
    const game = standingIn('TowerOfShadows')
    game.state.setStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN, true)
    const nothingHidden = executeCommands(game, ['cast truth sight'])
    expect(nothingHidden).toContain('no illusion here to see through')
    expect(executeCommands(game, ['cast truth sight on shadows'])).toBe(
      nothingHidden,
    )
    expect(executeCommands(game, ['cast truth sight on stair'])).toBe(
      nothingHidden,
    )
  })

  it('leaves the shadows unknown in any other room', () => {
    const game = standingIn('HallOfEchoes')
    expect(executeCommands(game, ['cast light on shadows'])).toContain(
      "You don't see a 'shadows'",
    )
    expect(executeCommands(game, ['cast truth sight on shadows'])).toContain(
      "You don't see a 'shadows'",
    )
  })

  it('opens nothing: the whispers still hold the stair', () => {
    const game = standingIn('TowerOfShadows')
    executeCommands(game, [
      'cast light',
      'cast light on shadows',
      'cast light on whispers',
      'cast truth sight',
      'cast truth sight on shadows',
      'cast truth sight on whispers',
    ])
    expect(game.state.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)).toBe(false)
  })
})

describe('Light on the things it cannot help', () => {
  it('stops at the grime on the banners, and knows the sigil once it is seen', () => {
    const game = standingIn('HallOfEchoes')
    const before = answersInWorld(game, 'cast light on banners')
    expect(before).toContain('grime')
    game.state.setStoryFlag(FLAG_ACT4_BANNERS_SEEN, true)
    const after = answersInWorld(game, 'cast light on banners')
    expect(after).toContain('You know now')
    expect(after).not.toBe(before)
  })

  it('comes out of the cracked orbs clouded, and passes through them mended', () => {
    const game = standingIn('MemoryVault')
    const before = answersInWorld(game, 'cast light on memory orbs')
    expect(before).toContain('clouded')
    game.state.setStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED, true)
    const after = answersInWorld(game, 'cast light on orbs')
    expect(after).toContain('mended glass')
    expect(after).not.toContain('clouded')
  })

  it('comes back from every mirror, and dies in them once they are dark', () => {
    const game = standingIn('MirrorLabyrinth')
    const before = answersInWorld(game, 'cast light on mirrors')
    expect(before).toContain('Every mirror gives your light back')
    game.state.setStoryFlag(FLAG_ACT4_MAZE_OF_MIRRORS_COMPLETED, true)
    const after = answersInWorld(game, 'cast light on mirrors')
    expect(after).toContain('dark')
    expect(after).not.toContain('Every mirror gives your light back')
  })
})
