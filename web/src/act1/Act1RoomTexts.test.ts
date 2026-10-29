import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from './Act1'
import { Locket } from './items/Locket'
import { Well } from './items/Well'
import { Vines } from './items/Vines'
import { executeCommands } from '@/testing/gameHelpers'

/** An Act I game with Elior standing in the named room. */
function gameIn(room: string): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

/** The room's description as the player reads it, markup included. */
function describeRoom(room: string): string {
  const game = gameIn(room)
  return game.state.currentRoom.descriptionFor(game.state)
}

describe('Act I room and item texts say one true thing', () => {
  it('describes the Village Square as hushed', () => {
    expect(describeRoom('VillageSquare')).toBe(
      'The heart of Willowbrook: cobblestones around an old stone fountain, ' +
        'and a weathered notice board covered in faded announcements. Half the ' +
        'market stalls stand empty. The people at the others keep their voices ' +
        'down, and stop talking when you pass.',
    )
  })

  it('hangs farm iron in the forge', () => {
    const text = describeRoom('BlacksmithsForge')
    expect(text).toContain(
      'A hot, smoky forge. Coals glow in the hearth and the anvil rings. ' +
        'Hinges, ploughshares and horseshoes hang from the walls, waiting to ' +
        'be mended or fetched, and the ',
    )
    expect(text).toContain(' wipes his brow without putting down the hammer.')
  })

  it('places the well between the field and the forge', () => {
    const text = describeRoom('VillageWell')
    expect(text).toContain(
      'An old stone well stands between the field and the forge, its stones ' +
        'worn smooth by countless hands.',
    )
    expect(text).toMatch(/ Moss creeps up the sides\.$/)
  })

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

  it('ends the shed description on lamp oil and refuses the locked search plainly', () => {
    expect(describeRoom('AbandonedShed')).toContain(
      'Little light gets past the grimy boards, and the air smells of old ' +
        'earth and lamp oil.',
    )
    const game = gameIn('AbandonedShed')
    expect(executeCommands(game, ['search'])).toContain(
      'The door is locked. Through a gap in the boards there is only dark, ' +
        'and a smell of dust.',
    )
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

  it('shows the merchant mare on three good shoes on the road', () => {
    expect(describeRoom('RoadToGreendale')).toContain(
      'runs east under old oaks, their branches meeting overhead. The way is ' +
        'well trodden, lined with wildflowers and fallen leaves. ',
    )
    expect(describeRoom('RoadToGreendale')).toMatch(
      /stands at the roadside, and his thin grey mare grazes beside it on three good shoes\.$/,
    )
  })

  it('ends the withered field on rows that were green a month ago', () => {
    expect(describeRoom('VegetableField')).toMatch(
      /of soil and distant rain\. These rows were green a month ago\.$/,
    )
  })

  it("shows Mira's hut without potions or named wisdom", () => {
    const text = describeRoom('MirasHut')
    expect(text).toContain(
      'A small hut hung with drying herbs: lavender, sage, and roots in ' +
        'bundles from the rafters. Shelves of bottles line the walls, every ' +
        'one labelled. ',
    )
    expect(text).toContain(
      ' moves among them without looking, the way you move through your own kitchen.',
    )
  })

  it('lets the mechanism answer a bare use with a true line', () => {
    const game = gameIn('OldMill')
    const text = executeCommands(game, ['use mechanism'])
    expect(text).toContain(
      'You put a hand to the gears. They turn under it and keep turning; ' +
        'fingers will not stop them.',
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
