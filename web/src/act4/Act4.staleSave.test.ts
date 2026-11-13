import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { staleSaveMismatches } from '@/testing/staleSave'
import { Act4 } from './Act4'
import { Grandmother } from './characters/Grandmother'
import { KingAlden } from './characters/KingAlden'
import { KnightOfDespair } from './characters/KnightOfDespair'
import { Nyx } from './characters/Nyx'
import { AncientAmulet } from './items/AncientAmulet'
import { LifelightElixir } from './items/LifelightElixir'
import { TheParentsLegacy } from './quests/TheParentsLegacy'
import { Bless } from './spells/Bless'
import { Grow } from './spells/Grow'
import { Light } from './spells/Light'

/**
 * An Act IV game knowing its spells and carrying the elixir, with the quests
 * the cases check finished (a quest not yet offered keeps its saved wording).
 */
function prepare(game: Game): void {
  game.state.learnSpell(new Light())
  game.state.learnSpell(new Bless())
  game.state.learnSpell(new Grow())
  game.state.addItemToInventory(new LifelightElixir())
  for (const quest of game.state.nonActivatedQuests) quest.completed = true
  game.state.settleFinishedQuests()
}

describe('Act IV loading a save that holds old wording', () => {
  it('gives every object the current wording', () => {
    const mismatches = staleSaveMismatches({
      makeGame: () => new Game([new Act4()]),
      prepare,
      cases: [
        { target: Nyx, fields: [], examine: true },
        { target: Grandmother, fields: [], examine: true },
        { target: KingAlden, fields: [], examine: true },
        { target: KnightOfDespair, fields: [], examine: true },
        { target: AncientAmulet, fields: ['description'] },
        { target: LifelightElixir, fields: ['description'] },
        { target: Light, fields: ['description'] },
        { target: Bless, fields: ['description'] },
        { target: Grow, fields: ['description'] },
        {
          target: TheParentsLegacy,
          fields: ['name'],
        },
      ],
    })

    expect(mismatches).toEqual([])
  })
})
