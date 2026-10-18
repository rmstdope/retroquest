import { describe, it, expect } from 'vitest'
import { parseQuest } from './parseQuest'

describe('parseQuest', () => {
  it('reads the plain name and that it is the main quest', () => {
    expect(
      parseQuest({
        name: '[quest_name]Shadows Over Willowbrook (main)[/quest_name]',
        description: 'Elior dreams of a shadowy figure.',
      }),
    ).toEqual({
      name: 'Shadows Over Willowbrook',
      main: true,
      description: 'Elior dreams of a shadowy figure.',
    })
  })

  it('reads a side quest', () => {
    expect(
      parseQuest({
        name: '[quest_name]Magic for real (side)[/quest_name]',
        description: 'You discover magic.',
      }),
    ).toMatchObject({ name: 'Magic for real', main: false })
  })

  it('keeps a name without a type suffix as a side quest', () => {
    expect(parseQuest({ name: 'Odd Quest', description: '' })).toMatchObject({
      name: 'Odd Quest',
      main: false,
    })
  })
})
