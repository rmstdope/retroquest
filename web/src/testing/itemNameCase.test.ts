/**
 * Items read in lower case mid-sentence, in what the acts' authors wrote as
 * well as in the engine's default replies ("the echo stone grows warm", not
 * "the Echo Stone"). Only an item named after a person keeps its capitals
 * (Nyx's Token, Elior's Journal): content marks those `bare`.
 *
 * This test crosses all four acts, which share no code, so it lives here. It
 * reads each act's committed narration script, every line the golden path
 * and its branches say (`narrationScriptFresh.test.ts` keeps it current), and
 * each act's sources for names written inside `[item_name]` markup.
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { Item, Quest, Room } from '@/engine'
import { ACT1_CLASSES } from '@/act1/classes'
import { ACT2_CLASSES } from '@/act2/classes'
import { ACT3_CLASSES } from '@/act3/classes'
import { ACT4_CLASSES } from '@/act4/classes'

/** The content classes of each act, by act number. */
const ACTS: Record<string, Record<string, unknown>> = {
  '1': ACT1_CLASSES,
  '2': ACT2_CLASSES,
  '3': ACT3_CLASSES,
  '4': ACT4_CLASSES,
}

/** The source files of every act (tests excluded), as text. */
const SOURCES = import.meta.glob<string>(
  ['../act*/**/*.ts', '!../**/*.test.ts'],
  { eager: true, query: '?raw', import: 'default' },
)

/** One line of a committed narration script. */
interface ScriptLine {
  key: string
  speaker: string
  text: string
}

/** Capitalise every word but "of" and "the" after the first. */
function titleCase(name: string): string {
  return name
    .split(' ')
    .map((word, i) =>
      i > 0 && ['of', 'the'].includes(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ')
}

/** An instance of `value` if it is a class that can be made without arguments. */
function make(value: unknown): unknown {
  if (typeof value !== 'function') return undefined
  try {
    return Reflect.construct(value, [])
  } catch {
    return undefined
  }
}

/** Every item of every act, made fresh. */
function allItems(): Item[] {
  return Object.values(ACTS)
    .flatMap((classes) => Object.values(classes).map(make))
    .filter((made): made is Item => made instanceof Item)
}

/** Whether `item` is named after a person: it takes no "the". */
function isPersonal(item: Item): boolean {
  return !item.nameInSentence().startsWith('the ')
}

/** The names, in title case, of every item of every act that takes "the". */
function titleCasedNames(): string[] {
  const names = new Set<string>()
  for (const item of allItems().filter((i) => !isPersonal(i))) {
    const name = item.name.trim()
    if (name.includes(' ')) names.add(titleCase(name.toLowerCase()))
    if (name !== name.toLowerCase()) names.add(name)
  }
  return [...names]
}

/**
 * The names of every room and quest of every act, longest first. They are
 * proper names ("Hall of Echoes", "The Maze of Mirrors"), even where they
 * share words with an item, so they are taken out of a line before it is read.
 */
function properNames(): string[] {
  return Object.values(ACTS)
    .flatMap((classes) => Object.values(classes).map(make))
    .filter((made) => made instanceof Room || made instanceof Quest)
    .map((made) => (made as Room | Quest).name)
    .sort((a, b) => b.length - a.length)
}

/** A pattern for `name` written mid-sentence, after a lower-case word or a comma. */
function midSentence(name: string): RegExp {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<=[a-z,;:'’] )${escaped}(?![a-z])`)
}

describe('item names read in lower case mid-sentence', () => {
  const names = titleCasedNames()
  const proper = properNames()

  for (const number of Object.keys(ACTS)) {
    it(`in every line of the Act ${number} script`, () => {
      const script = JSON.parse(
        readFileSync(
          new URL(`../../../tts/act${number}/script.json`, import.meta.url),
          'utf8',
        ),
      ) as ScriptLine[]
      const found: string[] = []
      for (const line of script) {
        const text = proper.reduce(
          (left, name) => left.split(name).join('…'),
          line.text,
        )
        for (const name of names) {
          if (midSentence(name).test(text)) {
            found.push(`${name}: ${line.text}`)
          }
        }
      }
      expect(found).toEqual([])
    })
  }

  it('inside [item_name] markup in every act source', () => {
    const personal = allItems()
      .filter(isPersonal)
      .map((item) => item.name.toLowerCase())
    const found: string[] = []
    for (const [path, source] of Object.entries(SOURCES)) {
      for (const match of source.matchAll(
        /\[item_name\]([^[$"`+\n]*)\[\/item_name\]/g,
      )) {
        const name = match[1]
        if (name === name.toLowerCase()) continue
        if (personal.includes(name.toLowerCase())) continue
        found.push(`${path}: ${name}`)
      }
    }
    expect(found).toEqual([])
  })
})
