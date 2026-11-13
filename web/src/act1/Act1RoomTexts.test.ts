import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from './Act1'
import { Locket } from './items/Locket'
import { Well } from './items/Well'
import { Vines } from './items/Vines'

/** An Act I game with Elior standing in the named room. */
function gameIn(room: string): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

describe('Act I room and item texts say one true thing', () => {
  it('smells the well as sour milk, glinting only while the ring is in it', () => {
    const game = gameIn('VillageWell')
    const well = game.state.currentRoom.items.find((i) => i instanceof Well)
    const sour =
      'The water below is dark and still, and it smells sour, the way milk ' +
      'does when it has turned.'
    const glint =
      ' Far down, something glints, or you think it does. It is much too ' +
      'deep to reach.'
    const withRing = well!.examine(game.state)
    expect(withRing).toContain(sour + glint)
    expect(withRing).not.toContain('stomach')
    if (well instanceof Well) well.containsRing = false
    const empty = well!.examine(game.state)
    expect(empty).toContain(sour)
    expect(empty).not.toContain('glints')
  })

  it('cuts the remembering sentence from the forest path, blocked and cleared', () => {
    const game = gameIn('ForestPath')
    const room = game.state.currentRoom
    expect(room.descriptionFor(game.state)).not.toContain('remembers')
    expect(room.descriptionFor(game.state)).toMatch(
      /unseen creatures nearby\.$/,
    )
    room.items = room.items.filter((i) => !(i instanceof Vines))
    expect(room.descriptionFor(game.state)).not.toContain('remembers')
    expect(room.descriptionFor(game.state)).toMatch(
      /unseen creatures nearby\.( In the alcove.*)?$/,
    )
  })

  it('does not tell the player to ask their family about the locket', () => {
    const game = gameIn('VillageSquare')
    expect(new Locket().examine(game.state)).toContain(
      'It feels cool to the touch.',
    )
    expect(new Locket().examine(game.state)).not.toContain('family')
  })
})

describe('A save made before the rewrite shows the new wording', () => {
  it('rewords the rooms and the carried locket on load', () => {
    const old = new Game([new Act1()])
    const rooms = old.state.allRooms
    for (const name of [
      'VillageSquare',
      'BlacksmithsForge',
      'RoadToGreendale',
      'AbandonedShed',
      'MirasHut',
    ]) {
      rooms[name].description = 'The old wording.'
    }
    const locket = new Locket()
    locket.description += ' Perhaps someone in your family might know more.'
    old.state.addItemToInventory(locket)

    const loaded = new Game([new Act1()])
    loaded.loadSaveData(old.toSaveData())

    for (const name of [
      'VillageSquare',
      'BlacksmithsForge',
      'RoadToGreendale',
      'AbandonedShed',
      'MirasHut',
    ]) {
      const room = loaded.state.allRooms[name]
      expect(room.descriptionFor(loaded.state)).not.toContain('old wording')
    }
    expect(describeIn(loaded, 'VillageSquare')).toContain('keep their voices')
    expect(
      loaded.state.inventory.find((i) => i instanceof Locket)?.description,
    ).not.toContain('family')
  })
})

/** The description of a room in a loaded game. */
function describeIn(game: Game, room: string): string {
  return game.state.allRooms[room].descriptionFor(game.state)
}
