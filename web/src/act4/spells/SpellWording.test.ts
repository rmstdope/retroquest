import { describe, it, expect } from 'vitest'
import { LifelightElixir } from '../items/LifelightElixir'
import { Light } from './Light'
import { Bless } from './Bless'
import { Grow } from './Grow'

describe('Act IV spells remember who taught them', () => {
  it('names the teacher of light, bless and grow', () => {
    expect(new Light().description).toBe(
      'The third thing [character_name]Mira[/character_name] showed you: how to make a light.',
    )
    expect(new Bless().description).toBe(
      "The blessing the [character_name]priest[/character_name] said over you when you found the founders' " +
        'locket.',
    )
    expect(new Grow().description).toBe(
      'Read word by word off the mossy stone in the glade. ' +
        'It feels like your own.',
    )
  })
})

describe('Act IV elixir', () => {
  it('reads as the vial Mira made from the three relics', () => {
    expect(new LifelightElixir().description).toBe(
      'A small glass vial the colour of first light. Something moves in it: ' +
        'a white glint, a thread of flame, a dark shimmer like a scale ' +
        'turning. Mira made it from the three relics.',
    )
  })
})
