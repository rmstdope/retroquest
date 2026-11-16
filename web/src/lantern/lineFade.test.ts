import { describe, expect, it } from 'vitest'
import {
  advanceColumn,
  createFadeLedger,
  finishFade,
  type ColumnLineInput,
  type FadeState,
} from './lineFade'

/** A line nothing has happened to yet. */
function fresh(over: Partial<ColumnLineInput> = {}): ColumnLineInput {
  return { reading: false, eligible: false, waiting: false, ...over }
}

describe('advanceColumn', () => {
  it('shows a new line live and asks for its time to read when it has none', () => {
    expect(advanceColumn([fresh()])).toEqual([{ state: 'live', wait: true }])
  })

  it('starts a read line fading only when every line above it has started', () => {
    const out = advanceColumn([
      fresh({ state: 'live', waiting: true }),
      fresh({ state: 'live', eligible: true }),
    ])
    expect(out.map((line) => line.state)).toEqual(['live', 'live'])
    const open = advanceColumn([
      fresh({ state: 'away' }),
      fresh({ state: 'live', eligible: true }),
    ])
    expect(open.map((line) => line.state)).toEqual(['away', 'away'])
  })

  it('keeps a line being read live, and brings one out of sight back', () => {
    const out = advanceColumn([fresh({ state: 'spent', reading: true })])
    expect(out[0]).toMatchObject({ state: 'live' })
  })

  it('takes a spent line away only once every line above it is gone', () => {
    expect(
      advanceColumn([fresh({ state: 'away' }), fresh({ state: 'spent' })]).map(
        (line) => line.state,
      ),
    ).toEqual(['away', 'spent'])
    const out = advanceColumn([
      fresh({ state: 'gone' }),
      fresh({ state: 'spent' }),
    ])
    expect(out[1]).toMatchObject({ state: 'gone' })
  })

  it('finishes a fade into spent, and leaves other states alone', () => {
    expect(finishFade('away')).toBe('spent')
    expect(finishFade('live')).toBe('live')
  })

  it('never lets a fading line move another: room leaves only from the top', () => {
    // Random reads and fade ends in three columns; after every step each
    // column's gone lines are a prefix and no line fades below a live one.
    let seed = 7
    const random = (): number =>
      (seed = (seed * 48271) % 2147483647) / 2147483647
    const columns: ColumnLineInput[][] = [4, 5, 3].map((n) =>
      Array.from({ length: n }, () => fresh()),
    )
    for (let round = 0; round < 400; round++) {
      for (const lines of columns) {
        const pick = lines[Math.floor(random() * lines.length)]
        const roll = random()
        if (roll < 0.4) pick.eligible = true
        else if (pick.state === 'away' && roll < 0.8)
          pick.state = finishFade('away')
        const out = advanceColumn(lines)
        out.forEach((line, i) => (lines[i].state = line.state))
        const states: FadeState[] = lines.map((line) => line.state ?? 'live')
        const firstShown = states.findIndex((state) => state !== 'gone')
        const edge = firstShown === -1 ? states.length : firstShown
        expect(states.slice(edge)).not.toContain('gone')
        const firstLive = states.indexOf('live')
        if (firstLive !== -1)
          expect(states.slice(firstLive + 1)).not.toContain('away')
      }
    }
  })
})

describe('createFadeLedger', () => {
  it('holds each line’s state and says which are out of sight', () => {
    const ledger = createFadeLedger()
    ledger.set('a', 'live')
    ledger.set('b', 'spent')
    ledger.set('c', 'gone')
    expect(ledger.outOfSight('a')).toBe(false)
    expect(ledger.outOfSight('b')).toBe(true)
    expect(ledger.outOfSight('c')).toBe(true)
    expect(ledger.outOfSight('nobody')).toBe(false)
  })

  it('counts a change of sight, and nothing else', () => {
    const ledger = createFadeLedger()
    ledger.set('a', 'live')
    ledger.set('a', 'away')
    expect(ledger.version.value).toBe(0)
    ledger.set('a', 'spent')
    ledger.set('a', 'gone')
    expect(ledger.version.value).toBe(2)
    ledger.set('a', 'gone')
    expect(ledger.version.value).toBe(2)
    ledger.forget('a')
    expect(ledger.version.value).toBe(3)
    expect(ledger.outOfSight('a')).toBe(false)
  })
})
