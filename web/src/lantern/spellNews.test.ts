import { describe, expect, it } from 'vitest'
import {
  SPELL_HEADING,
  spellTitle,
  toSpellNews,
  withoutLearnedLines,
  type SpellNews,
} from './spellNews'

const revive: SpellNews = { name: 'Revive', text: 'Calls a thing back.' }
const heal: SpellNews = { name: 'Heal', text: 'Mends.' }
const unlock: SpellNews = { name: 'Unlock', text: 'Opens.' }
const light: SpellNews = { name: 'Light', text: 'Shines.' }

describe('spellTitle', () => {
  it('capitalises every word and leaves the rest as written', () => {
    expect(spellTitle('revive')).toBe('Revive')
    expect(spellTitle('greater heal')).toBe('Greater Heal')
    expect(spellTitle("Redemption's Light")).toBe("Redemption's Light")
  })
})

describe('toSpellNews', () => {
  it('takes the plain name out of the markup and capitalises it', () => {
    expect(
      toSpellNews('[spell_name]nature sense[/spell_name]', 'Feels.'),
    ).toEqual({ name: 'Nature Sense', text: 'Feels.' })
  })
})

describe('SPELL_HEADING', () => {
  it('is the words the agreed experience gives', () => {
    expect(SPELL_HEADING).toBe('New spell')
  })
})

describe('withoutLearnedLines', () => {
  it('drops a line that is only the learned sentence', () => {
    expect(
      withoutLearnedLines(
        'She speaks.\nYou have learned [spell_name]revive[/spell_name].',
        [revive],
      ),
    ).toBe('She speaks.')
  })

  it('drops the "the … spell!" form', () => {
    expect(
      withoutLearnedLines(
        'Hi.\nYou have learned the [spell_name]revive[/spell_name] spell!',
        [revive],
      ),
    ).toBe('Hi.')
  })

  it('drops a line wrapped in a tag and the tag with it', () => {
    expect(
      withoutLearnedLines(
        '[success]You have learned [spell_name]revive[/spell_name].[/success]\nNext.',
        [revive],
      ),
    ).toBe('Next.')
  })

  it('keeps the rest of a paragraph the sentence was in', () => {
    expect(
      withoutLearnedLines(
        'You feel a new understanding... You have learned the ' +
          '[spell_name]revive[/spell_name] spell! It hums.',
        [revive],
      ),
    ).toBe('You feel a new understanding... It hums.')
  })

  it('drops a sentence naming several spells, all learned', () => {
    expect(
      withoutLearnedLines(
        'You have learned [spell_name]heal[/spell_name], ' +
          '[spell_name]unlock[/spell_name] and [spell_name]light[/spell_name].\nShe nods.',
        [heal, unlock, light],
      ),
    ).toBe('She nods.')
  })

  it('keeps a sentence that names a spell not learned this turn', () => {
    const text = 'You have learned [spell_name]heal[/spell_name].'
    expect(withoutLearnedLines(text, [revive])).toBe(text)
  })

  it('changes nothing when no spell was learned', () => {
    const text = 'Plain.\nYou have learned [spell_name]heal[/spell_name].'
    expect(withoutLearnedLines(text, [])).toBe(text)
  })

  it('matches the name whatever its case', () => {
    expect(
      withoutLearnedLines('You have learned [spell_name]Revive[/spell_name].', [
        revive,
      ]),
    ).toBe('')
  })
})
