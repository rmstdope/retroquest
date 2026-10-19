import { describe, it, expect } from 'vitest'
import { parseQuestNews } from './parseQuestNews'

describe('parseQuestNews', () => {
  it('reads a new quest from the engine payload', () => {
    expect(
      parseQuestNews(
        'new',
        '[quest_name]Hint of Magic (side quest)[/quest_name]\n\nA force stirs within.',
      ),
    ).toEqual({
      kind: 'new',
      name: 'Hint of Magic',
      main: false,
      text: 'A force stirs within.',
    })
  })

  it('knows the main quest', () => {
    expect(
      parseQuestNews(
        'new',
        '[quest_name]Shadows Over Willowbrook (main quest)[/quest_name]\n\nDreams.',
      ),
    ).toMatchObject({ name: 'Shadows Over Willowbrook', main: true })
  })

  it('keeps only the newest stage of an update', () => {
    expect(
      parseQuestNews(
        'updated',
        '[quest_name]Shadows (main quest)[/quest_name]\n\n' +
          '[dim]Elior dreams.[/dim][dim]\nThe crops wilt.[/dim]\nVillagers whisper.',
      ).text,
    ).toBe('Villagers whisper.')
  })

  it('keeps a checklist update whole', () => {
    const checklist =
      '[success]* Talk to Mira[/success]\n[pending]* Find the herbs[/pending]'

    expect(
      parseQuestNews(
        'updated',
        `[quest_name]Herbs (side quest)[/quest_name]\n\n${checklist}`,
      ).text,
    ).toBe(checklist)
  })

  it('keeps everything when an update has only earlier stages', () => {
    expect(
      parseQuestNews(
        'updated',
        '[quest_name]Q (side quest)[/quest_name]\n\n[dim]Only old.[/dim]',
      ).text,
    ).toBe('[dim]Only old.[/dim]')
  })

  it('keeps a clue list with open (○) clues whole', () => {
    const description =
      '[dim]Your parents walked these paths.[/dim]\n\n' +
      '✓ Depths: you found traces.\n' +
      '[dim]○ On the heights, their words may echo.[/dim]'

    expect(
      parseQuestNews(
        'updated',
        `[quest_name]Echoes (side quest)[/quest_name]\n\n${description}`,
      ).text,
    ).toBe(description)
  })
})
