import { describe, it, expect } from 'vitest'
import { parseActIntro } from './parseActIntro'

describe('parseActIntro', () => {
  it('reads the act and its title from the bold first line', () => {
    expect(
      parseActIntro(
        '[bold]ACT 1: THE CALL TO ADVENTURE[/bold]\n\nYou are Elior.\n\nMira waits.',
      ),
    ).toEqual({
      act: 'Act I',
      title: 'The Call to Adventure',
      body: 'You are Elior.\n\nMira waits.',
    })
  })

  it('reads Roman act numbers as they are', () => {
    expect(
      parseActIntro('[bold]ACT III: THE AWAKENING[/bold]\n\nText.'),
    ).toMatchObject({ act: 'Act III', title: 'The Awakening' })
  })

  it('keeps small words lower case inside a title', () => {
    expect(
      parseActIntro(
        '[bold]ACT IV: THE FINAL CONFRONTATION OF THE AGES[/bold]\n\nx',
      ).title,
    ).toBe('The Final Confrontation of the Ages')
  })

  it('keeps a text without a title line as the body', () => {
    expect(parseActIntro('Just text.')).toEqual({
      act: '',
      title: '',
      body: 'Just text.',
    })
  })
})
