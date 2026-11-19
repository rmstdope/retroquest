import { describe, it, expect } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act1 } from './Act1'
import { Lantern } from './items/Lantern'
import { Key } from './items/Key'
import { Rope } from './items/Rope'
import { Mechanism } from './items/Mechanism'
import { FLAG_PATCHES_RETURNED } from './Act1StoryFlags'

/** The room look in a fresh game standing in room `key`. */
function look(key: string, configure?: (game: Game) => void): string {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[key]
  configure?.(game)
  return new GameController(game).getRoomDescription()
}

describe('Act I words agree with their pictures (rq-v29l.20)', () => {
  it('shows the Village Square busy but uneasy', () => {
    expect(look('VillageSquare')).toBe(
      'The heart of Willowbrook: cobblestones around an old stone fountain, ' +
        'and a weathered notice board covered in faded announcements. ' +
        'The market is busy, but the talk at the stalls is low, and it stops ' +
        'when you pass.',
    )
  })

  it('opens the Old Mill in its yard, the mechanism under the lean-to', () => {
    const text = look('OldMill')
    expect(text).toContain(
      'A creaky windmill towers above, its sails turning slowly in the ' +
        'breeze. In the yard below, sacks of grain slump against a stone ' +
        'wall beside a heavy millstone, and the scent of flour hangs in the air.',
    )
    expect(text).toContain(
      ' Under the lean-to by the wall, you notice a strange mechanism of ' +
        "black iron, whirring to itself, that doesn't belong to the mill's " +
        'original design.',
    )
    expect(text).not.toContain('cobwebs')
  })

  it('shows the jammed mechanism under the lean-to', () => {
    const text = look('OldMill', (game) => {
      const mill = game.state.allRooms.OldMill
      const mechanism = mill.items.find((i) => i instanceof Mechanism)
      if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
      mechanism.repaired = true
    })
    expect(text).toContain(
      ' Under the lean-to by the wall, the black-iron mechanism stands ' +
        'jammed with a rope, silent at last.',
    )
  })

  it('drops the fragment to the ground when the mechanism is jammed', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.OldMill
    game.state.addItemToInventory(new Rope())
    const answer = game.commandParser.parse('use rope with strange mechanism')
    expect(answer).toContain(
      'With a clunk, a hidden compartment springs open, and a fragment of ' +
        'the old millstone drops to the ground at your feet!',
    )
  })

  it('has the cat sleep on the floor by the counter in the open shop', () => {
    const text = look('GeneralStore', (game) => {
      game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    })
    expect(text).toContain(
      ', and every so often looks down by the counter, where his cat sleeps.',
    )
  })

  it('searches the shelves of the shed', () => {
    const game = new Game([new Act1()])
    game.state.currentRoom = game.state.allRooms.AbandonedShed
    game.state.addItemToInventory(new Key())
    game.commandParser.parse('use key with door')
    const lamp = new Lantern()
    lamp.lit = true
    lamp.name = 'lantern (lit)'
    lamp.shortName = 'lantern'
    game.state.addItemToInventory(lamp)
    const answer = game.commandParser.parse('search')
    expect(answer).toContain(
      ', you rummage through the clutter of rusty tools and broken crates. ' +
        'Up on the dusty shelves, you find a discarded [item_name]fishing rod',
    )
  })
})
