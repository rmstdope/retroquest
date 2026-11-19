import { describe, it, expect } from 'vitest'
import { Game, type Item } from '@/engine'
import { Act1 } from '../../act1/Act1'
import { CharredInscription } from './CharredInscription'
import { CharredNotebook } from './CharredNotebook'
import { KeepsakeNote } from './KeepsakeNote'
import { Locker } from './Locker'
import { OldOathScrolls } from './OldOathScrolls'
import { SeaSealedLetter } from './SeaSealedLetter'
import { SupplyCrate } from './SupplyCrate'

describe('Act 3 things the action ring offers Open on', () => {
  it.each([
    ['the locker', () => new Locker()],
    ['the supply crate', () => new SupplyCrate()],
  ])('%s opens', (_name, make: () => Item) => {
    expect(make().answersToOpen()).toBe(true)
  })

  it.each([
    ['the charred notebook', () => new CharredNotebook()],
    ['the keepsake note', () => new KeepsakeNote()],
    ['the old oath scrolls', () => new OldOathScrolls()],
    ['the sea-sealed letter', () => new SeaSealedLetter()],
  ])('%s is read by Open as by Examine', (_name, make: () => Item) => {
    const state = () => new Game([new Act1()]).state
    expect(make().answersToOpen()).toBe(true)
    expect(make().open(state())).toBe(make().examine(state()))
  })

  it('a carved inscription is not read, so gets no Open', () => {
    expect(new CharredInscription().answersToOpen()).toBe(false)
  })
})
