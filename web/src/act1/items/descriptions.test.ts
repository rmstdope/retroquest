import { describe, expect, it } from 'vitest'
import type { Item } from '@/engine'
import { Apple } from './Apple'
import { Bread } from './Bread'
import { BrokenShovel } from './BrokenShovel'
import { Bucket } from './Bucket'
import { Egg } from './Egg'
import { Feather } from './Feather'
import { HealingHerb } from './HealingHerb'
import { Horseshoe } from './Horseshoe'
import { Magnet } from './Magnet'
import { Matches } from './Matches'
import { MillstoneFragment } from './MillstoneFragment'
import { Rope } from './Rope'
import { RustyHoe } from './RustyHoe'
import { RustySaw } from './RustySaw'
import { SackOfFlour } from './SackOfFlour'
import { Stick } from './Stick'

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

const ITEMS: Item[] = [
  new Apple(),
  new Bread(),
  new BrokenShovel(),
  new Bucket(),
  new Egg(),
  new Feather(),
  new HealingHerb(),
  new Horseshoe(),
  new Magnet(),
  new Matches(),
  new MillstoneFragment(),
  new Rope(),
  new RustyHoe(),
  new RustySaw(),
  new SackOfFlour(),
  new Stick(),
]

describe('Act 1 item descriptions', () => {
  it.each(ITEMS.map((item) => [item.name, item] as const))(
    '%s says what it is and promises no use',
    (_name, item) => {
      expect(item.description.length).toBeGreaterThan(0)
      for (const promise of PROMISES) {
        expect(item.description).not.toMatch(promise)
      }
    },
  )
})
