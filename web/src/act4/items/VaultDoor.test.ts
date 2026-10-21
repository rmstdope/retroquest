import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { Memories } from './Memories'
import { VaultDoor } from './VaultDoor'
import { FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED } from '../Act4StoryFlags'

describe('VaultDoor', () => {
  it('answers to "sealed door" and ignores other items', () => {
    const game = new Game([new Act4()])
    const door = new VaultDoor()
    expect(door.answersTo('sealed door')).toBe(true)
    expect(door.useWith(game.state, new Memories())).toContain("can't use the")
  })

  it('opens once, only after the Shadow is answered', () => {
    const game = new Game([new Act4()])
    const door = new VaultDoor()
    expect(door.openWith(game.state)).toContain('runes stay dark')
    game.state.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    expect(door.openWith(game.state)).toContain('rolls aside')
    expect(door.openWith(game.state)).toContain('already stands open')
  })
})
