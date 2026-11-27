import { describe, expect, it } from 'vitest'
import { Character } from './Character'
import {
  characterNamed,
  isArticle,
  resolveName,
  withoutArticle,
} from './typedNames'

/** A character of the name. */
function person(name: string): Character {
  return new Character({ name, description: name })
}

/** A lookup that finds exactly the names given. */
function among(...names: string[]): (name: string) => string | null {
  return (name) => (names.includes(name) ? name : null)
}

describe('withoutArticle', () => {
  it('drops one leading "a", "an" or "the", in any case', () => {
    expect(withoutArticle('a candle')).toBe('candle')
    expect(withoutArticle('An apple')).toBe('apple')
    expect(withoutArticle('THE fishing rod')).toBe('fishing rod')
    expect(withoutArticle('  the   dragon ')).toBe('dragon')
    expect(withoutArticle('the a candle')).toBe('a candle')
  })

  it('leaves a name without an article as it is', () => {
    expect(withoutArticle('anvil')).toBe('anvil')
    expect(withoutArticle('theodore')).toBe('theodore')
    expect(withoutArticle(' wizard')).toBe(' wizard')
  })

  it('keeps an article typed on its own as a name', () => {
    for (const article of ['a', 'an', 'the']) {
      expect(withoutArticle(article)).toBe(article)
      expect(isArticle(article)).toBe(true)
    }
    expect(isArticle('ant')).toBe(false)
  })
})

describe('resolveName', () => {
  it('asks about the words as typed first', () => {
    expect(resolveName('the tome', among('the tome', 'tome'))).toBe('the tome')
  })

  it('then about the name without its article', () => {
    expect(resolveName('an apple', among('apple'))).toBe('apple')
    expect(resolveName('an apple', among('pear'))).toBeNull()
  })
})

describe('characterNamed', () => {
  const guardian = person('Tide-Born Guardian')
  const captain = person('Captain of the Guard')
  const here = [guardian, captain]

  it('finds a character by name, with or without an article', () => {
    expect(characterNamed('captain of the guard', here)).toBe(captain)
    expect(characterNamed('the tide-born guardian', here)).toBe(guardian)
  })

  it('finds the one character holding a single word of a name', () => {
    expect(characterNamed('guardian', here)).toBe(guardian)
    expect(characterNamed('a guardian', here)).toBe(guardian)
    expect(characterNamed('guardian', [guardian, guardian])).toBeNull()
  })

  it('lets no joining word or article name anyone', () => {
    for (const word of ['of', 'the', 'and', 'a', 'an', '']) {
      expect(characterNamed(word, [captain])).toBeNull()
    }
  })
})
