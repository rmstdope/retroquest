import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACT_NUMBERS, byId } from '../../../tts/actScripts'

/** The per-act lists `tts/extract-act.ts` writes. */
const FILES = ['script.json', 'music.json', 'images.json', 'scenes.json']

/** Reads a committed list of an act as its text and its records. */
function committed(
  number: string,
  file: string,
): { text: string; records: { id: string }[] } {
  const text = readFileSync(
    new URL(`../../../tts/act${number}/${file}`, import.meta.url),
    'utf8',
  )
  return { text, records: JSON.parse(text) as { id: string }[] }
}

/**
 * The committed lists are in id order, so two branches that change different
 * records of one act touch different places of the file and git merges them.
 */
describe('committed narration lists are in id order', () => {
  it.each(ACT_NUMBERS.flatMap((n) => FILES.map((f) => [n, f] as const)))(
    'act %s %s is ascending by id',
    (number, file) => {
      const ids = committed(number, file).records.map((record) => record.id)
      expect(ids).toEqual([...ids].sort(compareIds))
    },
  )
})

/** Plain code-unit order, as `byId` sorts. */
function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

describe('byId', () => {
  it('sorts by id, keeps equal ids in their order and leaves its input alone', () => {
    const input = [
      { id: 'b', n: 1 },
      { id: 'a', n: 2 },
      { id: 'b', n: 3 },
    ]
    expect(byId(input).map((record) => record.n)).toEqual([2, 1, 3])
    expect(input.map((record) => record.n)).toEqual([1, 2, 3])
  })
})

describe('two branches that change different lines of one act', () => {
  it('merge without a conflict, a reworded line being a new id', () => {
    const base = committed('1', 'script.json').records
    const write = (list: unknown[]): string =>
      JSON.stringify(list, null, 2) + '\n'
    const reworded = (record: { id: string }): { id: string } => ({
      ...record,
      id: `${record.id}-reworded`,
    })
    const removed = base[10]
    const replaced = base[base.length - 10]
    const added = { id: 'zzz-new-line', speaker: 'narrator', text: 'New.' }
    // One branch drops a line and adds a new one; the other rewords a line.
    const mine = write(byId([...base.filter((r) => r !== removed), added]))
    const theirs = write(
      byId(base.map((r) => (r === replaced ? reworded(r) : r))),
    )
    const both = write(
      byId([
        ...base
          .filter((r) => r !== removed)
          .map((r) => (r === replaced ? reworded(r) : r)),
        added,
      ]),
    )
    const dir = mkdtempSync(join(tmpdir(), 'merge-'))
    try {
      for (const [name, text] of [
        ['mine', mine],
        ['base', write(base)],
        ['theirs', theirs],
      ])
        writeFileSync(join(dir, name), text)
      const merged = execFileSync(
        'git',
        ['merge-file', '-p', 'mine', 'base', 'theirs'],
        { cwd: dir, encoding: 'utf8' },
      )
      expect(merged).toEqual(both)
    } finally {
      rmSync(dir, { recursive: true })
    }
  })
})
