import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act3 } from '../Act3'
import { FortressGates } from './FortressGates'

const AMULET_MOMENT =
  'The [item_name]Ancient Amulet[/item_name] is warm against your palm. ' +
  'You came on this journey believing Malakar took your parents from you. ' +
  'You know better now. [character_name]Aren[/character_name] and ' +
  '[character_name]Lysa[/character_name] were his closest friends, and the ' +
  'ward they became is still holding.\n\n' +
  'The Dragon said they were warded away, not dead. You do not yet know what that means.'

describe('FortressGates', () => {
  it('names the amulet moment and the Elixir on the first examination', () => {
    const game = new Game([new Act3()])
    const text = new FortressGates().examine(game.state)
    expect(text).toContain("the kingdom's fate will be decided.\n\n")
    expect(text).toContain(AMULET_MOMENT)
    expect(text).toContain(
      "\n\nThe Lifelight Elixir pulses with protective power, ready to shield you from the sorcerer's influence. " +
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
    expect(again).toContain('The gates stand ready to be breached.')
    expect(again).not.toContain('Amulet')
  })
})
