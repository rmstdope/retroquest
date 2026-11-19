import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../../act1/Act1'
import { CityMap } from './CityMap'
import { SquiresDiary } from './SquiresDiary'
import { TravelersJournal } from './TravelersJournal'

describe('Act 2 things you read answer Open', () => {
  it.each([
    ['the squire diary', () => new SquiresDiary()],
    ["the traveller's journal", () => new TravelersJournal()],
    ['the city map', () => new CityMap()],
  ])('%s is read by Open as by Use', (_name, make) => {
    const state = () => new Game([new Act1()]).state
    expect(make().answersToOpen()).toBe(true)
    expect(make().open(state())).toBe(make().use(state()))
  })
})
