import { describe, it, expect } from 'vitest'
import { Game, type Room } from '@/engine'
import { Act3 } from '../Act3'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
} from '../Act3StoryFlags'
import { Mira } from './Mira'
import { SirCedric } from './SirCedric'
import { CrystalOfLight } from '../items/CrystalOfLight'
import { DragonsScale } from '../items/DragonsScale'
import { LifelightElixir } from '../items/LifelightElixir'
import { PhoenixFeather } from '../items/PhoenixFeather'

/** Whether a character with the given (lowercase) name is in the room. */
function hasCharacterNamed(room: Room, name: string): boolean {
  return room.characters.some((c) => c.name.toLowerCase() === name)
}

/** Whether an item with the given name lies in the room. */
function hasItemNamed(room: Room, name: string): boolean {
  return room.items.some((item) => item.name === name)
}

/** Mark every non-main quest complete for a Warding Rite scenario. */
function completeNonMainQuests(game: Game): void {
  const pendingQuests = [
    ...game.state.nonActivatedQuests,
    ...game.state.activatedQuests,
  ]
  game.state.completedQuests.push(
    ...pendingQuests.filter((quest) => !quest.isMain()),
  )
  game.state.nonActivatedQuests = game.state.nonActivatedQuests.filter(
    (quest) => quest.isMain(),
  )
  game.state.activatedQuests = game.state.activatedQuests.filter((quest) =>
    quest.isMain(),
  )
}

describe('Mira', () => {
  it('has a name and the basic talk interface', () => {
    new Game([new Act3()])
    const m = new Mira()
    expect(m.name.toLowerCase()).toBe('mira')
  })

  it('starts the main quest on the first talk', () => {
    const game = new Game([new Act3()])
    const m = new Mira()
    expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_STARTED)).toBe(false)

    const out = m.talkTo(game.state)

    expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_STARTED)).toBe(true)
    expect(out).toContain('three relics')
    expect(out).toContain('take this note')
    const keepsakeNoteInInventory = game.state.inventory.some(
      (item) => item.name === 'Keepsake Note',
    )
    expect(keepsakeNoteInInventory).toBe(true)
  })

  it('hints or teleports at the Tidal Causeway', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    const m = new Mira()
    // ensure crystal not acquired -> hint
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, false)
    const hint = m.talkTo(game.state)
    expect(hint).toContain('Crystal of Light')

    // crystal acquired but letter not read -> should require letter to be read
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, false)
    const out = m.talkTo(game.state)
    expect(out).toContain('seek the traces your parents left behind')
    expect(out).not.toContain('You arrive at')

    // letter read -> should teleport to Lower Switchbacks
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    const origin = game.state.currentRoom
    origin.characters.push(m)
    const sc = new SirCedric()
    origin.characters.push(sc)

    const res = m.talkTo(game.state)

    expect(res).toContain('You arrive at')
    expect(game.state.currentRoom.characters).toContain(m)
    expect(hasCharacterNamed(game.state.currentRoom, 'sir cedric')).toBe(true)
  })

  it('teleports from the Tidal Causeway to the Lower Switchbacks', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.TidalCauseway
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    const m = new Mira()
    game.state.currentRoom.characters.push(m)

    const out = m.talkTo(game.state)

    expect(
      out.includes('LowerSwitchbacks') ||
        game.state.currentRoom.name.includes('Lower Switchbacks'),
    ).toBe(true)
  })

  it('only gives lore at the Lower Switchbacks', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.LowerSwitchbacks
    const m = new Mira()
    game.state.currentRoom.characters.push(m)

    const out = m.talkTo(game.state)

    expect(out.toLowerCase()).toContain('wisdom')
    expect(out.toLowerCase()).toContain('phoenix')
    expect(out).not.toContain('You arrive at')
    expect(game.state.currentRoom.characters).toContain(m)
  })

  it('teleports from the Lower Switchbacks to the Cavern Mouth', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.LowerSwitchbacks
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, false)

    const m = new Mira()
    // without inscription read - should require reading it first
    let out = m.talkTo(game.state)
    expect(out).toContain(
      'discover the words your parents left burned into stone',
    )
    expect(out).not.toContain('You arrive at')

    // inscription read - should allow teleport
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    game.state.currentRoom.characters.push(m)
    const sc = new SirCedric()
    game.state.currentRoom.characters.push(sc)

    out = m.talkTo(game.state)

    expect(out).toContain('You arrive at')
    expect(
      out.includes('Cavern Mouth') ||
        game.state.currentRoom.name.includes('CavernMouth'),
    ).toBe(true)
    expect(game.state.currentRoom.characters).toContain(m)
    expect(hasCharacterNamed(game.state.currentRoom, 'sir cedric')).toBe(true)
  })

  it('requires the elixir at the hut before the fortress teleport', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true) // Note read
    game.state.currentRoom = game.state.allRooms.MirasHut
    const m = new Mira()

    // without elixir in inventory - should urge to take it
    let out = m.talkTo(game.state)
    expect(out).toContain('take the Lifelight Elixir')
    expect(out).toContain('before we depart')
    expect(out).not.toContain('You arrive at')

    // with elixir in inventory - should allow teleport
    game.state.inventory.push(new LifelightElixir())
    game.state.currentRoom.characters.push(m)
    const sc = new SirCedric()
    game.state.currentRoom.characters.push(sc)

    out = m.talkTo(game.state)

    expect(out).toContain('final journey')
    expect(out).toContain('You arrive at')
  })

  it('discusses fatigue at the Fortress Entrance', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.FortressEntrance
    const m = new Mira()

    const out = m.talkTo(game.state)

    expect(out).toContain('journey has taken its toll')
    expect(out).toContain('drained much of my strength')
    expect(out).toContain('must rest and recover')
    expect(out).toContain('Sir Cedric press forward')
    expect(out).toContain('three virtues you have proven')
    expect(out).not.toContain('You arrive at')
  })

  it('creates the elixir and removes the relics', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true) // Note read
    game.state.currentRoom = game.state.allRooms.MirasHut
    completeNonMainQuests(game)

    // Add items to different locations to test removal from inventory and room
    game.state.inventory.push(new CrystalOfLight())
    game.state.inventory.push(new PhoenixFeather())
    game.state.currentRoom.items.push(new DragonsScale())

    expect(game.state.hasItem('Crystal of Light')).toBe(true)
    expect(game.state.hasItem('Phoenix Feather')).toBe(true)
    expect(hasItemNamed(game.state.currentRoom, "Dragon's Scale")).toBe(true)

    const m = new Mira()
    const out = m.talkTo(game.state)

    expect(out).toContain('three relics resonate')
    expect(out.includes('Warding Rite') || out.includes('elixir')).toBe(true)
    expect(out).toContain('Lifelight Elixir')

    expect(game.state.hasItem('Crystal of Light')).toBe(false)
    expect(game.state.hasItem('Phoenix Feather')).toBe(false)
    expect(hasItemNamed(game.state.currentRoom, "Dragon's Scale")).toBe(false)
    expect(hasItemNamed(game.state.currentRoom, 'Lifelight Elixir')).toBe(true)
  })

  it('does not perform the Warding Rite while any non-main quest remains', () => {
    for (const questName of [
      'Echoes of the Hidden Bond',
      'Oath of Stillness',
    ]) {
      const game = new Game([new Act3()])
      game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
      game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
      game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
      game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
      game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
      game.state.currentRoom = game.state.allRooms.MirasHut
      const incompleteQuest = game.state.nonActivatedQuests.find(
        (quest) => quest.name === questName,
      )
      if (!incompleteQuest) throw new Error(`Missing quest: ${questName}`)
      game.state.nonActivatedQuests =
        questName === 'Echoes of the Hidden Bond' ? [incompleteQuest] : []
      game.state.activatedQuests =
        questName === 'Oath of Stillness' ? [incompleteQuest] : []

      const out = new Mira().talkTo(game.state)

      expect(out).toContain('every remaining quest')
      expect(game.state.getStoryFlag(FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED)).toBe(
        false,
      )
      expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_COMPLETED)).toBe(false)
      expect(hasItemNamed(game.state.currentRoom, 'Lifelight Elixir')).toBe(
        false,
      )
    }
  })

  it('completes The Three Virtues when the Warding Rite is performed', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut
    completeNonMainQuests(game)

    const out = new Mira().talkTo(game.state)

    expect(out).toContain('three relics resonate')
    expect(game.state.getStoryFlag(FLAG_ACT3_MAIN_COMPLETED)).toBe(true)
  })

  it('requires the note to be read in the hut', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.currentRoom = game.state.allRooms.MirasHut

    const out = new Mira().talkTo(game.state)

    expect(out).toContain('read the note')
    expect(out).toContain('important guidance')
    expect(out).not.toContain('three relics')
    expect(!out.includes('teleport') || !out.includes('You arrive at')).toBe(
      true,
    )
  })

  it('requires the charred inscription read at the Lower Switchbacks', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, false)
    game.state.currentRoom = game.state.allRooms.LowerSwitchbacks

    const out = new Mira().talkTo(game.state)

    expect(out).toContain(
      'discover the words your parents left burned into stone',
    )
    expect(out).toContain('ember heights')
    expect(out).not.toContain('You arrive at')
  })

  it('requires the sea-sealed letter read at the Tidal Causeway', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, false)
    game.state.currentRoom = game.state.allRooms.TidalCauseway

    const out = new Mira().talkTo(game.state)

    expect(out).toContain('seek the traces your parents left behind')
    expect(out).toContain('sunken ruins')
    expect(out).not.toContain('You arrive at')
  })
})
