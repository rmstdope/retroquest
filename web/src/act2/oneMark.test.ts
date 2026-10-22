import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../act1/Act1'
import { Act2 } from './Act2'
import { Act3 } from '../act3/Act3'
import { Act4 } from '../act4/Act4'
import { AncientAmulet } from './items/AncientAmulet'
import { SirCedric } from './characters/SirCedric'
import { FLAG_SPECTRAL_LIBRARIAN_FRIENDLY } from './Act2StoryFlags'
import { FLAG_ACT3_MAIN_STARTED } from '../act3/Act3StoryFlags'
import { executeCommands } from '@/testing/gameHelpers'

/** The older form of the Warden sigil, as every act names it. */
const OLD_MARK = 'a tree under two moons'

describe('one mark runs through the four acts', () => {
  it("is cut over the chapel door in the Priest's tale", () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.VillageChapel
    const tale = executeCommands(game, ['talk to priest'])
    expect(tale).toContain(`Their mark was ${OLD_MARK}`)
    expect(tale).not.toContain('Warden')
  })

  it('is the older drawing Cedric has seen in the histories', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    if (!game.state.inventory.some((i) => i instanceof AncientAmulet)) {
      game.state.addItemToInventory(new AncientAmulet())
    }
    const cedric = game.state.currentRoom.characters.find(
      (c) => c instanceof SirCedric,
    )
    if (!(cedric instanceof SirCedric)) throw new Error('no Cedric')
    expect(cedric.talkTo(game.state)).toContain(
      `The oldest histories draw the mark another way: ${OLD_MARK}, from ` +
        'before there were three things to guard.',
    )
  })

  it("is on the chronicle's first page, with the Wardens' quiet valley and its mill", () => {
    const game = new Game([new Act2()])
    game.state.setStoryFlag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY, true)
    game.state.currentRoom = game.state.allRooms.HiddenLibrary
    const read = executeCommands(game, ['use ancient chronicle'])
    expect(read).toContain(`drawn the old way, ${OLD_MARK}`)
    expect(read).toContain('built their mill over a seat of power there')
  })

  it('is beneath the three names on the Charred Inscription', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.MirrorTerraces
    expect(executeCommands(game, ['examine inscription'])).toContain(
      `beneath it, older and nearly gone, ${OLD_MARK}`,
    )
  })

  it("is worn almost away on the vault door, and named as the locket's crest", () => {
    const game = new Game([new Act4()])
    game.state.currentRoom = game.state.allRooms.MemoryVault
    expect(executeCommands(game, ['examine door'])).toContain(
      `${OLD_MARK}: the crest on your mother's locket.`,
    )
  })
})
