import { describe, expect, it } from 'vitest'
import { announcementsOf } from './storyAnnouncement'

describe('announcementsOf', () => {
  it('gives one announcement for each bubble, with its sentences spaced', () => {
    expect(
      announcementsOf(
        'You hand over the [item_name]bait[/item_name].\nThe eyes light up. He wraps it.',
      ),
    ).toEqual(['You hand over the bait.', 'The eyes light up. He wraps it.'])
  })

  it('puts the speaker first on a quote', () => {
    expect(
      announcementsOf(
        'You speak with [character_name]Mira[/character_name].\n[dialogue]Hello there.[/dialogue]',
      ),
    ).toContain('Mira: Hello there.')
  })

  it('keeps a space where a line break was inside one bubble', () => {
    expect(
      announcementsOf('[dialogue]First line.\nSecond line.[/dialogue]'),
    ).toEqual(['First line. Second line.'])
  })

  it('reads an event and a failure as plain words and a checklist as one bubble', () => {
    expect(
      announcementsOf(
        '[event]A bell rings.[/event]\n[failure]It will not open.[/failure]\n[success]* Done[/success]\n[pending]* Todo[/pending]',
      ),
    ).toEqual(['A bell rings.', 'It will not open.', 'Done. Todo.'])
  })

  it('says nothing for an empty answer', () => {
    expect(announcementsOf('')).toEqual([])
  })
})
