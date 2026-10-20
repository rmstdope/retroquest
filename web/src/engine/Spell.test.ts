import { describe, it, expect } from 'vitest'
import { Spell } from './Spell'
import { Item } from './Item'
import { Character } from './Character'
import { GameState } from './GameState'
import { Room } from './Room'

function gameState(): GameState {
  const start = new Room({ name: 'Start', description: '' })
  return new GameState(start, { Start: start }, [])
}

describe('Spell', () => {
  const gs = gameState()
  const light = new Spell({ name: 'light', description: 'Lights things.' })

  it('fizzles by default', () => {
    expect(light.castSpell(gs)).toBe(
      '[failure]You cast [spell_name]light[/spell_name], but nothing happens.[/failure]',
    )
    const rock = new Item({ name: 'rock', description: 'd' })
    expect(light.castOnItem(gs, rock)).toContain(
      'on [item_name]rock[/item_name], but the spell fizzles',
    )
    const mira = new Character({ name: 'Mira', description: 'd' })
    expect(light.castOnCharacter(gs, mira)).toContain(
      'on [character_name]Mira[/character_name], but the spell fizzles',
    )
  })

  it('names a multi-word spell by its spaced name in a fizzle', () => {
    const vision = new Spell({
      name: 'prophetic_vision',
      description: 'Sees ahead.',
    })
    const mira = new Character({ name: 'Mira', description: 'd' })
    expect(vision.castOnCharacter(gs, mira)).toContain(
      '[spell_name]prophetic vision[/spell_name]',
    )
    expect(vision.castSpell(gs)).not.toContain('prophetic_vision')
  })
})
