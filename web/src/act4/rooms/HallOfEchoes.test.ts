import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED,
} from '../Act4StoryFlags'
import { GhostlyWarriors } from '../characters/GhostlyWarriors'
import { HallOfEchoes } from './HallOfEchoes'

describe('HallOfEchoes', () => {
  it('has the correct name', () => {
    const room = new HallOfEchoes()
    expect(room.name).toBe('Hall of Echoes')
  })

  it('holds the echoes, the stone, the banners and the knight', () => {
    const room = new HallOfEchoes()
    expect(room.items.map((i) => i.name)).toEqual([
      'Echoes',
      'Echo Stone',
      'Banners',
    ])
    expect(room.characters.map((c) => c.name)).toEqual([
      'Knight of Despair',
      'Sir Cedric',
    ])
  })

  it('names the banners on first look, between the echoes and the knight', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    expect(room.describe(game.state)).toContain(
      'someone counting. Tattered banners hang high along the walls, grimed past reading. At the far end',
    )
  })

  it('offers only the way south and blocks the stair east', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    expect(Object.keys(room.getExits(game.state))).toEqual(['south'])
    expect(room.blockedExit(game.state, 'east')).toContain(
      'there is no way past him',
    )
    expect(room.blockedExit(game.state, 'north')).toBeNull()
  })

  it('starts the knight quest on entering and opens the stair once he is redeemed', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    room.onEnter(game.state)
    expect(game.state.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_STARTED)).toBe(
      true,
    )
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    expect(Object.keys(room.getExits(game.state))).toContain('east')
    expect(room.blockedExit(game.state, 'east')).toBeNull()
  })

  const BEFORE =
    'A long hall, so high the ceiling is lost. Everything that was ever said here is still being said, very quietly: orders, jokes, names, someone counting. Tattered banners hang high along the walls, grimed past reading. At the far end, before the stair, a knight in tarnished armour stands without moving, the way a man stands at a grave.'
  const AFTER =
    'A long hall, so high the ceiling is lost. The echoes have softened to a murmur. By the stair to the east the knight kneels with his helm beside him, his grey cloak folded on the stone.'

  it('reads as one room that has changed once the knight is redeemed', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    expect(room.descriptionFor(game.state)).toContain(BEFORE)
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    room.characters = room.characters.filter(
      (c) => !(c instanceof GhostlyWarriors),
    )
    expect(room.descriptionFor(game.state)).toContain(AFTER)
  })

  it('shows the new wording even when the saved room holds an older description', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    room.description = 'This vast hall stretches into shadow.'
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    expect(room.descriptionFor(game.state)).toContain(AFTER)
    expect(room.descriptionFor(game.state)).not.toContain('stretches')
  })

  it('keeps the warriors in the hall until they are put to rest', () => {
    const game = new Game([new Act4()])
    const room = new HallOfEchoes()
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    room.addCharacter(new GhostlyWarriors())
    expect(room.descriptionFor(game.state)).toContain(
      AFTER + ' Among the tattered banners, ghostly warriors still fight',
    )
  })
})
