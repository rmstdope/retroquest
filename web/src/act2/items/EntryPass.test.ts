/** The entry pass carries a scraped-away name and a good seal (rq-bi7). */
import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { Act2 } from '../Act2'
import { EntryPass } from './EntryPass'

const DESCRIPTION =
  'An official-looking document with the seal of Greendale. The line where ' +
  "the bearer's name should be has been scraped away with a blade, but the " +
  'seal is whole. It appears to grant passage through the city gates to ' +
  'those who present it to the guards.'

describe('Entry pass', () => {
  it('describes the scraped name and the whole seal', () => {
    expect(new EntryPass().description).toBe(DESCRIPTION)
  })

  it('reads the new description even from an older save', () => {
    const game = new Game([new Act2()])
    const pass = new EntryPass()
    pass.description =
      'An official-looking document with the seal of Greendale.'

    expect(pass.examine(game.state)).toContain(DESCRIPTION)
  })

  it('mentions the scraped name every time it is used', () => {
    const game = new Game([new Act2()])
    const pass = new EntryPass()
    const first = pass.use(game.state)

    expect(first).toBe(
      'You examine the entry pass. Someone has scraped their name off it, ' +
        'carefully. The seal looks authentic, and it should allow you passage ' +
        'into Greendale without question.',
    )
    expect(pass.use(game.state)).toBe(first)
  })

  it('has well-formed markup in every text', () => {
    const game = new Game([new Act2()])
    const pass = new EntryPass()

    expect(findMarkupProblems(pass.examine(game.state))).toEqual([])
    expect(findMarkupProblems(pass.use(game.state))).toEqual([])
  })

  it('survives a save round-trip with the new text', () => {
    const game = new Game([new Act2()])
    const pass = new EntryPass()
    pass.description =
      'An official-looking document with the seal of Greendale.'
    game.state.addItemToInventory(pass)

    const fresh = new Game([new Act2()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(fresh.commandParser.parse('examine entry pass')).toContain(
      DESCRIPTION,
    )
  })
})
