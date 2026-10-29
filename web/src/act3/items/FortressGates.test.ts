import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act3 } from '../Act3'
import { FortressGates } from './FortressGates'

const AMULET_MOMENT =
  'The [item_name]ancient amulet[/item_name] is warm against your palm. ' +
  'You came on this journey believing Malakar took your parents from you. ' +
  'You know better now. [character_name]Aren[/character_name] and ' +
  '[character_name]Lysa[/character_name] were his closest friends, and the ' +
  'ward they became is still holding.\n\n' +
  'The Dragon said they were warded away, not dead. You do not yet know what that means.'

describe('FortressGates', () => {
  it('describes the gates plainly', () => {
    const description = new FortressGates().description
    expect(description).toBe(
      'Gates of blackened iron, taller than a house, carved with sigils that ' +
        'seem to move at the edge of sight. Through the lattice, corridors run ' +
        'into the dark.',
    )
  })

  it('opens on the gates, the sigils and the king', () => {
    const game = new Game([new Act3()])
    const text = new FortressGates().examine(game.state)
    expect(text).toContain(
      'The gates are taller than a house, and the sigils on them seem to move ' +
        'at the edge of sight. Beyond the lattice, corridors run into the dark. ' +
        'Somewhere in there is King Alden.',
    )
    for (const banned of ['eldritch', 'malevolent', 'weight of destiny'])
      expect(text).not.toContain(banned)
  })

  it('names the amulet moment and the Elixir on the first examination', () => {
    const game = new Game([new Act3()])
    const text = new FortressGates().examine(game.state)
    expect(text).toContain('Somewhere in there is King Alden.\n\n')
    expect(text).toContain(AMULET_MOMENT)
    expect(text).toContain(
      '\n\nIn your pack, the lifelight elixir is warm. ' +
        '[bold]Act III is complete.[/bold] The final confrontation awaits.',
    )
    expect(text).not.toContain('three relics')
    expect(findMarkupProblems(text)).toEqual([])
  })

  it('is unchanged when the gates are examined again', () => {
    const game = new Game([new Act3()])
    const gates = new FortressGates()
    gates.examine(game.state)
    const again = gates.examine(game.state)
    expect(again).not.toContain('You examine')
    expect(again).toBe(
      'The gates stand shut. Somewhere beyond them is the king.',
    )
    expect(again).not.toContain('Amulet')
  })
})
