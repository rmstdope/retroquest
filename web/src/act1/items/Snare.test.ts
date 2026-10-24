import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { SharpKnife } from './SharpKnife'
import { Snare } from './Snare'
import { FLAG_FOX_KIT_FREED, VIRTUE_MERCY } from '../Act1StoryFlags'
import { executeCommands } from '@/testing/gameHelpers'

/** An Act I game on the Forest Path with the sharp knife in the pack. */
function gameOnForestPath(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.ForestPath
  game.state.addItemToInventory(new SharpKnife())
  return game
}

/** The same game with the vines already cut. */
function gameWithVinesCut(): Game {
  const game = gameOnForestPath()
  executeCommands(game, ['use sharp knife with vines'])
  return game
}

const KIT_CAUGHT =
  "In the alcove a fox kit is caught in a poacher's " +
  '[item_name]snare[/item_name], too tired now to struggle.'
const SNARE_CUT =
  "In the alcove lies a poacher's [item_name]snare[/item_name], cut and empty."
const KIT_LOOK =
  'A fox kit, no bigger than a cat, one hind leg caught fast in the wire. ' +
  'It watches you and does not struggle.'
const NEED_BLADE =
  "The wire is pulled tight around the kit's leg, too tight for fingers."

describe('cutting the vines', () => {
  it('keeps the sharp knife and says so', () => {
    const game = gameOnForestPath()

    const answer = executeCommands(game, ['use sharp knife with vines'])

    expect(game.state.hasItem('sharp knife')).toBe(true)
    expect(answer).not.toContain('shatters')
    expect(answer).toContain(
      'You wipe the blade on the moss and keep it; it may yet be useful.',
    )
    expect(game.state.currentRoom.items.map((item) => item.name)).toContain(
      'stick',
    )
  })

  it('shows nothing about the kit before the vines are cut', () => {
    const game = gameOnForestPath()

    const description = game.state.currentRoom.describe(game.state)

    expect(description).not.toContain('fox kit')
    expect(description).not.toContain('snare')
    expect(executeCommands(game, ['look at snare'])).toContain("don't see")
  })

  it('adds the trapped kit to the room description once the vines are cut', () => {
    const game = gameWithVinesCut()

    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      KIT_CAUGHT,
    )
    expect(game.state.currentRoom.describe(game.state)).toContain(KIT_CAUGHT)
  })
})

describe('the snare', () => {
  it.each(['snare', 'fox', 'kit'])('shows the kit on look at %s', (word) => {
    const answer = executeCommands(gameWithVinesCut(), [`look at ${word}`])

    expect(answer).toContain(KIT_LOOK)
  })

  it.each(['take snare', 'use snare', 'open snare'])(
    'needs a blade on %s',
    (command) => {
      const game = gameWithVinesCut()
      game.state.removeItemFromInventory('sharp knife')

      const answer = executeCommands(game, [command])

      expect(answer).toContain(NEED_BLADE)
      expect(game.state.getStoryFlag(FLAG_FOX_KIT_FREED)).toBe(false)
      expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(false)
    },
  )

  it('frees the kit with the sharp knife: reaction, then the remembered line', () => {
    const game = gameWithVinesCut()

    const answer = executeCommands(game, ['use sharp knife with snare'])

    expect(answer).not.toContain('You use the')
    expect(answer).toContain(
      'You kneel and saw through the wire, slow and careful. The moment it ' +
        'gives, the fox kit twists free, stares at you for one heartbeat, and ' +
        'bolts into the undergrowth.',
    )
    expect(
      answer.endsWith('[event]✦ Mercy — this will be remembered[/event]'),
    ).toBe(true)
    expect(game.state.hasVirtue(VIRTUE_MERCY)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_FOX_KIT_FREED)).toBe(true)
    expect(game.state.hasItem('sharp knife')).toBe(true)
  })

  it('leaves the cut, empty snare in the alcove and in the description', () => {
    const game = gameWithVinesCut()
    executeCommands(game, ['use sharp knife with snare'])

    const room = game.state.currentRoom.describe(game.state)

    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      SNARE_CUT,
    )
    expect(room).toContain(SNARE_CUT)
    expect(room).not.toContain(KIT_CAUGHT)
    expect(game.state.currentRoom.items.some((i) => i instanceof Snare)).toBe(
      true,
    )
  })

  it('says it is already cut when the knife is used again, and records nothing twice', () => {
    const game = gameWithVinesCut()
    executeCommands(game, ['use sharp knife with snare'])

    const answer = executeCommands(game, ['use sharp knife with snare'])

    expect(answer).toContain(
      'The snare is already cut. There is nothing left in it to free.',
    )
    expect(answer).not.toContain('remembered')
    expect(game.state.virtues.filter((v) => v === VIRTUE_MERCY)).toHaveLength(1)
  })

  it('works with the knife named first or the snare named first', () => {
    const game = gameWithVinesCut()

    const answer = executeCommands(game, ['use snare with sharp knife'])

    expect(answer).toContain('remembered')
  })

  it('stays freed after a save and reload, and shows nothing again', () => {
    const game = gameWithVinesCut()
    executeCommands(game, ['use sharp knife with snare'])
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())

    const room = fresh.state.currentRoom.describe(fresh.state)

    expect(room).toContain(SNARE_CUT)
    expect(fresh.state.hasVirtue(VIRTUE_MERCY)).toBe(true)
    expect(
      executeCommands(fresh, ['use sharp knife with snare']),
    ).not.toContain('remembered')
  })

  it('treats a snare from a save made before the field existed as still caught', () => {
    const game = gameWithVinesCut()
    const snare = game.state.currentRoom.items.find(
      (item) => item instanceof Snare,
    ) as Snare
    Reflect.deleteProperty(snare, 'freed')

    expect(executeCommands(game, ['look at snare'])).toContain(KIT_LOOK)
  })
})
