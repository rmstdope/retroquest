import { describe, it, expect } from 'vitest'
import { parseQuestDetails } from './parseQuestDetails'

describe('parseQuestDetails', () => {
  it('splits a journal quest into its latest entry and the earlier ones', () => {
    // As Act I "Shadows Over Willowbrook" builds it.
    expect(
      parseQuestDetails(
        '[dim]Elior dreams.[/dim][dim]\nThe crops wilt.[/dim]\nVillagers whisper.',
      ),
    ).toEqual({
      kind: 'journal',
      latest: 'Villagers whisper.',
      earlier: ['Elior dreams.', 'The crops wilt.'],
    })
  })

  it('uses the last dimmed stage as the latest when nothing follows it', () => {
    expect(parseQuestDetails('[dim]First.[/dim][dim]Second.[/dim]')).toEqual({
      kind: 'journal',
      latest: 'Second.',
      earlier: ['First.'],
    })
  })

  it('reads a single-stage quest as just its latest entry', () => {
    expect(parseQuestDetails('Explore Willowbrook.')).toEqual({
      kind: 'journal',
      latest: 'Explore Willowbrook.',
      earlier: [],
    })
  })

  it('reads a checklist quest', () => {
    // As Act I "Preparing for the Road" builds it.
    const description = [
      'Mira has tasked you with preparing for your journey. She says you will need: \n',
      '[success] * Warm clothing[/success]',
      '[pending] * Sturdy footwear[/pending]',
    ].join('\n')

    expect(parseQuestDetails(description)).toEqual({
      kind: 'checklist',
      intro:
        'Mira has tasked you with preparing for your journey. She says you will need:',
      items: [
        { done: true, text: 'Warm clothing' },
        { done: false, text: 'Sturdy footwear' },
      ],
    })
  })

  it('reads a clue list as a checklist', () => {
    // As Act III "Echoes of the Hidden Bond" builds it.
    const description =
      '[dim]Your parents walked these paths.[/dim]\n\n' +
      '✓ Depths of the Sunken Ruins: you found traces.\n' +
      '[dim]○ On the heights, their words may echo.[/dim]'

    expect(parseQuestDetails(description)).toEqual({
      kind: 'checklist',
      intro: 'Your parents walked these paths.',
      items: [
        { done: true, text: 'Depths of the Sunken Ruins: you found traces.' },
        { done: false, text: 'On the heights, their words may echo.' },
      ],
    })
  })
})
