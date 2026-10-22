import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from './Act4'
import { Banners } from './items/Banners'
import { CrystalWhispers } from './items/CrystalWhispers'
import { LoyaltyToken } from './items/LoyaltyToken'
import { Nyx } from './characters/Nyx'
import {
  FLAG_ACT4_TOWER_STAIR_OPEN,
  LEGACY_FLAG_ACT4_LOYALTY_TOKEN_RAISED,
} from './Act4StoryFlags'

describe('Act4', () => {
  it('can be instantiated correctly', () => {
    const act4 = new Act4()
    // The TS act name is the short id used in saves (see the porting guide),
    // not the Python display title "Act IV".
    expect(act4.name).toBe('Act4')
    expect(Object.keys(act4.rooms)).toHaveLength(10)
    expect(act4.quests.map((quest) => quest.name)).toEqual([
      'The Final Stand',
      'Shattered Ward Guardians',
      'The Trapped Servants',
      'The Maze of Mirrors',
      'The Knight of Despair',
      'The Sorceress of Lies',
      'The Shadow of the Past',
      "The Parent's Legacy",
    ])
  })

  it('has all expected rooms', () => {
    const act4 = new Act4()
    const expectedRooms = [
      'FortressGates',
      'OuterCourtyard',
      'MirrorLabyrinth',
      'HallOfEchoes',
      'TowerOfShadows',
      'ChamberOfWhispers',
      'MemoryVault',
      'ParentsVault',
      'ThroneChamber',
    ]
    for (const roomName of expectedRooms) {
      expect(roomName in act4.rooms, `${roomName} in rooms`).toBe(true)
    }
  })

  it('no longer has the cut stub rooms', () => {
    const act4 = new Act4()
    expect('ThroneChamberApproach' in act4.rooms).toBe(false)
    expect('RoyalGardens' in act4.rooms).toBe(false)
  })

  it('has proper intro text', () => {
    const act4 = new Act4()
    const intro = act4.getActIntro()
    expect(intro).toContain('ACT IV: THE FINAL CONFRONTATION')
    expect(intro).toContain('Lifelight Elixir')
  })

  it('opens with the companions’ goodbye and the token, without the old cliché', () => {
    const intro = new Act4().getActIntro()
    expect(intro).toContain('someone must hold the way out. ')
    expect(intro).toContain(
      'A small light settles on the gatepost: Nyx, keeping close.',
    )
    const order = [
      "Someone has to keep the way out open, and that's me. So come back through it.",
      'I held a gate once and lost a king behind it. I will not lose this one, or you.',
      "I'll be the light at the edge of your eye. Don't look for me. Just know.",
      'Mira presses something into your hand: a small silver medallion, two hands clasped on its face. Sir Cedric lays his hand over hers; the light on the gatepost leans in.',
      "If it goes quiet in there, say our names. We'll hear.",
      'The halls beyond are yours to walk, but you will not be far from them.',
      "Let's begin. (Type 'help' for a list of commands.)",
    ].map((line) => intro.indexOf(line))
    expect(order.every((i) => i >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(intro).not.toContain('you go on alone')
    expect(intro).not.toContain('culmination')
    expect(intro).not.toContain('echo through eternity')
  })

  describe('loading a save from before the friends were named', () => {
    /** A game made to look like an old save: no whispers, token not in the pack. */
    function oldSave(): Game {
      const game = new Game([new Act4()])
      const tower = game.state.allRooms.TowerOfShadows
      tower.characters = []
      game.state.removeItemFromInventory('Loyalty Token')
      game.state.allRooms.OuterCourtyard.addItem(new LoyaltyToken())
      return game
    }

    function reload(game: Game): Game {
      const loaded = new Game([new Act4()])
      expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
      return loaded
    }

    it('gives a barred tower its whispers and moves the courtyard token to the pack', () => {
      const loaded = reload(oldSave())
      const tower = loaded.state.allRooms.TowerOfShadows
      expect(tower.getCharacterByName('whispers')).not.toBeNull()
      expect(loaded.state.hasItem('Loyalty Token')).toBe(true)
      expect(
        loaded.state.allRooms.OuterCourtyard.getItemByName('Loyalty Token'),
      ).toBeNull()
    })

    it("hands out Nyx's gifts to a save made before they were carried, but not once returned", () => {
      const game = oldSave()
      game.state.removeItemFromInventory("Nyx's Token")
      game.state.removeItemFromInventory('Forest Heart Crystal')
      const loaded = reload(game)
      expect(loaded.state.hasItem("Nyx's Token")).toBe(true)
      expect(loaded.state.hasItem('Forest Heart Crystal')).toBe(true)

      const nyx =
        loaded.state.allRooms.WillowbrookField.getCharacterByName('nyx')
      if (!(nyx instanceof Nyx)) throw new Error('no Nyx in the field')
      nyx.tokenReturned = true
      loaded.state.removeItemFromInventory("Nyx's Token")
      const again = reload(loaded)
      expect(again.state.hasItem("Nyx's Token")).toBe(false)
      expect(again.state.hasItem('Forest Heart Crystal')).toBe(true)
    })

    it('hands out a token to a save that never had one anywhere', () => {
      const game = oldSave()
      game.state.allRooms.OuterCourtyard.removeItem('Loyalty Token')
      expect(reload(game).state.hasItem('Loyalty Token')).toBe(true)
    })

    it('counts the old raised-token flag as an open stair, without whispers', () => {
      const game = oldSave()
      game.state.setStoryFlag(LEGACY_FLAG_ACT4_LOYALTY_TOKEN_RAISED, true)
      const loaded = reload(game)
      const tower = loaded.state.allRooms.TowerOfShadows
      expect(loaded.state.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)).toBe(true)
      expect(tower.getCharacterByName('whispers')).toBeNull()
      expect(tower.getExits(loaded.state)).toHaveProperty('up')
    })
  })

  it('gives an older save the hall banners and the chamber crystals on load', () => {
    const game = new Game([new Act4()])
    const hall = game.state.allRooms.HallOfEchoes
    const chamber = game.state.allRooms.ChamberOfWhispers
    hall.removeItem('banners')
    chamber.removeItem('whispers')
    expect(game.loadSaveData(game.toSaveData())).toContain(
      'Game loaded successfully.',
    )
    const loaded = game.state.allRooms
    expect(
      loaded.HallOfEchoes.items.filter((i) => i instanceof Banners),
    ).toHaveLength(1)
    expect(
      loaded.ChamberOfWhispers.items.filter(
        (i) => i instanceof CrystalWhispers,
      ),
    ).toHaveLength(1)
  })
})
