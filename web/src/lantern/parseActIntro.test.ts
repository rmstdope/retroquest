import { describe, it, expect } from 'vitest'
import { actCompleteText, parseActIntro } from './parseActIntro'

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

describe('actCompleteText', () => {
  it('leaves out the last answer, which the story already shows', () => {
    expect(
      actCompleteText(
        'The map aligns.\n\nCongratulations — you have completed Act 1!\n\nRest now.',
      ),
    ).toBe('Congratulations — you have completed Act 1!\n\nRest now.')
  })

  it('keeps a text without the congratulation whole', () => {
    expect(actCompleteText('The end.')).toBe('The end.')
  })
})
