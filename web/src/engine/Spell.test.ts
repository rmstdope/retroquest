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
  const light = new Spell({
    id: 'light',
    name: 'light',
    description: 'Lights things.',
  })

  it('fizzles by default', () => {
    expect(light.castSpell(gs)).toBe(
      '[failure]You cast [spell_name]light[/spell_name], but nothing happens.[/failure]',
    )
    const rock = new Item({ name: 'rock', description: 'd' })
    expect(light.castOnItem(gs, rock)).toContain(
      'on the [item_name]rock[/item_name]. Nothing in it answers the spell.',
    )
    const mira = new Character({ name: 'Mira', description: 'd' })
    expect(light.castOnCharacter(gs, mira)).toContain(
      'on [character_name]Mira[/character_name]. Nothing in them answers the spell.',
    )
  })

  it('names a multi-word spell by its spaced name in a fizzle', () => {
    const vision = new Spell({
      id: 'prophetic_vision',
      name: 'Prophetic Vision',
      description: 'Sees ahead.',
    })
    const mira = new Character({ name: 'Mira', description: 'd' })
    expect(vision.castOnCharacter(gs, mira)).toContain(
      '[spell_name]Prophetic Vision[/spell_name]',
    )
    expect(vision.castSpell(gs)).not.toContain('prophetic_vision')
  })

  it('answers to its id and its shown name, case-insensitively', () => {
    const vision = new Spell({
      id: 'prophetic_vision',
      name: 'Prophetic Vision',
      description: 'Sees ahead.',
    })
    expect(vision.answersTo('prophetic_vision')).toBe(true)
    expect(vision.answersTo('PROPHETIC vision')).toBe(true)
    expect(vision.answersTo('prophetic')).toBe(false)
  })
})

describe('Spell targets in a sentence', () => {
  it('names an item and a character through their own sentence names', () => {
    const gs = gameState()
    const spell = new Spell({ id: 'x', name: 'x', description: 'd' })
    const token = new Item({ name: "nyx's token", description: 'd' })
    const elena = new Character({ name: 'barmaid elena', description: 'd' })
    expect(spell.castOnItem(gs, token)).toContain(
      "on [item_name]Nyx's Token[/item_name]. Nothing in it",
    )
    expect(spell.castOnCharacter(gs, elena)).toContain(
      'on [character_name]Barmaid Elena[/character_name]. Nothing in them',
    )
  })
})
