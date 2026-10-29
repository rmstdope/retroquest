import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { AncientAmulet } from '../items/AncientAmulet'
import { LifelightElixir } from '../items/LifelightElixir'
import { Light } from './Light'
import { Bless } from './Bless'
import { Grow } from './Grow'

const OLD_ELIXIR = 'A shimmering elixir that seems to contain liquid starlight.'

describe('Act IV spells remember who taught them', () => {
  it('names the teacher of light, bless and grow', () => {
    expect(new Light().description).toBe(
      'The third thing Mira showed you: how to make a light.',
    )
    expect(new Bless().description).toBe(
      "The blessing the priest said over you when you found the founders' " +
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

describe('older saves show the new wording', () => {
  it('re-applies the descriptions when a save is loaded', () => {
    const game = new Game([new Act4()])
    game.state.learnSpell(new Light())
    game.state.learnSpell(new Bless())
    game.state.learnSpell(new Grow())
    for (const spell of game.state.knownSpells) spell.description = 'old'
    const carried = new LifelightElixir()
    carried.description = OLD_ELIXIR
    game.state.addItemToInventory(carried)
    const dropped = new LifelightElixir()
    dropped.description = OLD_ELIXIR
    game.state.allRooms.MemoryVault.addItem(dropped)
    const amulet = game.state.inventory.find(
      (item) => item instanceof AncientAmulet,
    )
    if (amulet) amulet.description = 'A family heirloom.'

    game.loadSaveData(game.toSaveData())

    const known = (id: string): string | undefined =>
      game.state.knownSpells.find((s) => s.id === id)?.description
    expect(known('light')).toBe(new Light().description)
    expect(known('bless')).toBe(new Bless().description)
    expect(known('grow')).toBe(new Grow().description)
    const wording = new LifelightElixir().description
    const carriedNow = game.state.inventory.find(
      (item) => item instanceof LifelightElixir,
    )
    expect(carriedNow?.description).toBe(wording)
    expect(
      game.state.allRooms.MemoryVault.items.find(
        (item) => item instanceof LifelightElixir,
      )?.description,
    ).toBe(wording)
    expect(
      game.state.inventory.find((item) => item instanceof AncientAmulet)
        ?.description,
    ).toBe(new AncientAmulet().description)
  })
})
