import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { Key } from './Key'
import { Bread } from './Bread'
import { SharpKnife } from './SharpKnife'
import { Candle } from './Candle'
import { Mechanism } from './Mechanism'
import { Scenery } from './Scenery'
import { SCENERY_BY_ROOM } from './sceneryLines'
import {
  FLAG_COOP_KEY_FELL,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_VEGETABLE_FIELD_WATERED,
} from '../Act1StoryFlags'
import { AbandonedShed } from '../rooms/AbandonedShed'

function gameIn(room: string): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms[room]
  return game
}

function say(game: Game, command: string): string {
  return game.commandParser.parse(command)
}

const FAILURE = (word: string): string =>
  `[failure]You don't see ${/^[aeiou]/.test(word) ? 'an' : 'a'} '${word}' to examine here or in your inventory.[/failure]`

describe('Scenery chips', () => {
  it('answers examine with the agreed line, by any typed word', () => {
    const game = gameIn('VillageSquare')
    const line =
      'Water trickles from the mouth of a stone fish into the basin. ' +
      'The rim is worn smooth where people sit, but no one is sitting there today.'
    expect(say(game, 'examine fountain')).toBe(line)
    expect(say(game, 'examine basin')).toBe(line)
  })

  it('refuses to be taken with the hearth refusal', () => {
    const game = gameIn('VillageChapel')
    expect(say(game, 'take altar')).toBe(
      "[failure]You can't take the [item_name]altar[/item_name].[/failure]",
    )
  })

  it('gives the cottage hearth a second word, fire', () => {
    const game = gameIn('EliorsCottage')
    expect(say(game, 'examine fire')).toBe(say(game, 'examine hearth'))
  })

  it('shows eight chips in the chapel, the mark readable from the start', () => {
    const game = gameIn('VillageChapel')
    const names = game.state.currentRoom.items.map((i) => i.name)
    expect(names).toEqual([
      'candle',
      'prayer book',
      'altar',
      'bell rope',
      'mark over the door',
      'pews',
      'dark corner',
    ])
    expect(say(game, 'examine mark')).toContain('A tree under two moons')
  })

  it('leaves unlisted things with the failure line', () => {
    const game = gameIn('VillageChapel')
    for (const word of ['bell', 'door', 'windows', 'rope']) {
      expect(say(game, `examine ${word}`)).toBe(FAILURE(word))
    }
  })

  it('every scenery word resolves in its room to its own chip', () => {
    for (const [room, defs] of Object.entries(SCENERY_BY_ROOM)) {
      const game = gameIn(room)
      game.state.currentRoom.items.push(...defs.map((d) => new Scenery(d.key)))
      for (const def of defs) {
        for (const word of [def.name, ...def.aliases]) {
          const found = game.state.currentRoom.getItemByName(word)
          expect(found, `${room}: ${word}`).toBeInstanceOf(Scenery)
          expect((found as Scenery).key, `${room}: ${word}`).toBe(def.key)
        }
      }
    }
  })
})

describe('Scenery that follows the story', () => {
  it('crops: withered, then green again', () => {
    const game = gameIn('VegetableField')
    expect(say(game, 'examine crops')).toContain('curl brown')
    game.state.setStoryFlag(FLAG_VEGETABLE_FIELD_WATERED, true)
    expect(say(game, 'examine crops')).toContain('Young leaves')
    expect(say(game, 'examine soil')).toContain('dark and gives')
  })

  it('counter: before and after Patches is home', () => {
    const game = gameIn('GeneralStore')
    expect(say(game, 'examine counter')).toContain('folded blanket lies')
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    expect(say(game, 'examine counter')).toContain('Patches sleeps')
  })

  it('rafter: before and after the key falls', () => {
    const game = gameIn('ChickenCoop')
    expect(say(game, 'examine rafter')).toContain('out of your reach')
    game.state.currentRoom.addItem(new Key())
    expect(say(game, 'examine rafter')).toContain('Only dust')
  })

  it('rafter: the bread that drops the key sets the flag', () => {
    const game = gameIn('ChickenCoop')
    game.state.addItemToInventory(new Bread())
    say(game, 'use bread with chicken')
    expect(game.state.getStoryFlag(FLAG_COOP_KEY_FELL)).toBe(true)
  })

  it('rafter: an old save with the shed already open reads as fallen', () => {
    const game = gameIn('ChickenCoop')
    ;(game.state.allRooms.AbandonedShed as AbandonedShed).locked = false
    expect(say(game, 'examine rafter')).toContain('Only dust')
  })

  it('gears: whirring, then jammed', () => {
    const game = gameIn('OldMill')
    expect(say(game, 'examine gears')).toContain('whirring comes')
    const mech = game.state.currentRoom.items.find(
      (i) => i instanceof Mechanism,
    ) as Mechanism
    mech.repaired = true
    expect(say(game, 'examine gears')).toContain('mill is quiet')
  })

  it('stone: dim, then lit with the refrain', () => {
    const game = gameIn('HiddenGlade')
    expect(say(game, 'examine stone')).toContain('shadow lies so deep')
    expect(say(game, 'examine grass')).toContain('grey and still')
    ;(
      game.state.currentRoom as unknown as { lightSpellCast: boolean }
    ).lightSpellCast = true
    expect(say(game, 'examine stone')).toContain(
      'Power follows purpose; purpose follows truth.',
    )
    expect(say(game, 'examine grass')).toBe('Tall grass stirs in the breeze.')
  })

  it('dark corner: candle not lit, then lit', () => {
    const game = gameIn('VillageChapel')
    expect(say(game, 'examine corner')).toContain('eyes slide off')
    const candle = game.state.currentRoom.items.find(
      (i) => i instanceof Candle,
    ) as Candle
    candle.isLit = true
    expect(say(game, 'examine corner')).toContain('In the candlelight')
  })
})

describe('Scenery that appears with the story', () => {
  it('shed: only boards while locked, the rest after the door opens', () => {
    const game = gameIn('AbandonedShed')
    expect(say(game, 'examine boards')).toContain('Grey boards')
    expect(say(game, 'examine workbench')).toBe(FAILURE('workbench'))
    game.state.addItemToInventory(new Key())
    say(game, 'use key with door')
    expect(say(game, 'examine workbench')).toContain('A long workbench')
    expect(say(game, 'examine crates')).toContain('Something small shifts')
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    expect(say(game, 'examine crates')).toContain('hollow in the dust')
    expect(say(game, 'examine tools')).toContain('Rusty tools')
    expect(say(game, 'examine shelves')).toContain('Dusty shelves')
  })

  it('forest path: the alcove only once the vines are cut', () => {
    const game = gameIn('ForestPath')
    expect(say(game, 'examine alcove')).toBe(FAILURE('alcove'))
    game.state.addItemToInventory(new SharpKnife())
    say(game, 'use knife with vines')
    expect(say(game, 'examine alcove')).toBe(
      'A small hollow under the bank, sheltered by roots.',
    )
  })
})

describe('Old saves', () => {
  it('load with the chips present and the story lines current', () => {
    const game = gameIn('VillageChapel')
    for (const room of Object.values(game.state.allRooms)) {
      room.items = room.items.filter((i) => !(i instanceof Scenery))
    }
    const shed = game.state.allRooms.AbandonedShed as AbandonedShed
    shed.locked = false
    const data = game.toSaveData()
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(data)
    expect(say(fresh, 'examine altar')).toContain('plain stone altar')
    fresh.state.currentRoom = fresh.state.allRooms.AbandonedShed
    expect(say(fresh, 'examine workbench')).toContain('A long workbench')
    fresh.loadSaveData(fresh.toSaveData())
    const counts = fresh.state.allRooms.VillageChapel.items.filter(
      (i) => i instanceof Scenery,
    )
    expect(counts).toHaveLength(5)
  })
})

describe('Scenery that agrees with its room', () => {
  it('shed boards: no light comes through them, as the room says', () => {
    const game = gameIn('AbandonedShed')
    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      'no light gets past the grimy boards',
    )
    const boards = say(game, 'examine boards')
    expect(boards).not.toMatch(/light comes through/i)
    expect(boards).toBe(
      'Grey boards, warped and grimy, ' +
        'and nailed so close that hardly a crack shows between them.',
    )
  })

  it('mill gears: still while the sails turn, because the shaft misses them', () => {
    const game = gameIn('OldMill')
    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      'its sails turning slowly in the breeze',
    )
    expect(say(game, 'examine gears')).toBe(
      'Wooden gears, furred with dust and cobwebs. ' +
        'The shaft from the sails turns above them and never meets them, ' +
        "and they don't move; the whirring comes from the iron thing among them.",
    )
    const mech = game.state.currentRoom.items.find(
      (i) => i instanceof Mechanism,
    ) as Mechanism
    mech.repaired = true
    expect(say(game, 'examine gears')).toBe(
      'Wooden gears, furred with dust. ' +
        'The shaft from the sails turns above them and never meets them. ' +
        'The mill is quiet now.',
    )
  })

  it('dream: the man, the child and the shadows each read as themselves', () => {
    const game = gameIn('TheDream')
    const man = say(game, 'examine man')
    expect(man).not.toContain('no face')
    expect(man).toContain('hand')
    expect(say(game, 'examine hand')).toBe(man)
    expect(say(game, 'examine child')).toContain('Gone with him')
    expect(say(game, 'examine shadows')).toContain('like smoke')
  })
})
