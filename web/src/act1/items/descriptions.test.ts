import { describe, expect, it } from 'vitest'
import type { Item } from '@/engine'
import { Apple } from './Apple'
import { Armor } from './Armor'
import { Bread } from './Bread'
import { BrokenShovel } from './BrokenShovel'
import { Bucket } from './Bucket'
import { Chicken } from './Chicken'
import { Coin } from './Coin'
import { Egg } from './Egg'
import { EliorsJournal } from './EliorsJournal'
import { Feather } from './Feather'
import { GameMap } from './GameMap'
import { HealingHerb } from './HealingHerb'
import { Horseshoe } from './Horseshoe'
import { Magnet } from './Magnet'
import { Matches } from './Matches'
import { MillstoneFragment } from './MillstoneFragment'
import { Rope } from './Rope'
import { RustyHoe } from './RustyHoe'
import { RustySaw } from './RustySaw'
import { SackOfFlour } from './SackOfFlour'
import { SharpKnife } from './SharpKnife'
import { Stick } from './Stick'
import { Sword } from './Sword'

/** Words that promise a use or an effect the game does not have. */
const PROMISES = [
  /useful/i,
  /perfect for/i,
  /essential/i,
  /\bcould\b/i,
  /\bmight\b/i,
  /restor/i,
  /energy/i,
  /delicious/i,
]

/**
 * The tells of generic game text (design/Voice.md rules 1, 2 and 5): a
 * guess at what a thing is for, a hinted secret, a sales line, or a grip
 * Elior does not have.
 */
const GENERIC = [
  /likely/i,
  /almost anything/i,
  /various/i,
  /not immediately obvious/i,
  /secrets/i,
  /provides/i,
  /reliable/i,
  /your grip/i,
  /if you're not careful/i,
]

const ITEMS: Item[] = [
  new Apple(),
  new Armor(),
  new Bread(),
  new BrokenShovel(),
  new Bucket(),
  new Chicken(),
  new Coin(),
  new Egg(),
  new EliorsJournal(),
  new Feather(),
  new GameMap(),
  new HealingHerb(),
  new Horseshoe(),
  new Magnet(),
  new Matches(),
  new MillstoneFragment(),
  new Rope(),
  new RustyHoe(),
  new RustySaw(),
  new SackOfFlour(),
  new SharpKnife(),
  new Stick(),
  new Sword(),
]

describe('Act 1 item descriptions', () => {
  it('every item says what it is and promises no use', () => {
    const failures: string[] = []
    for (const item of ITEMS) {
      if (item.description.length === 0) {
        failures.push(`${item.name}: empty description`)
      }
      for (const tell of [...PROMISES, ...GENERIC]) {
        if (tell.test(item.description)) {
          failures.push(`${item.name}: matches ${tell}`)
        }
      }
    }
    expect(failures).toEqual([])
  })
})
