import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Act } from './Act'
import { Character } from './Character'
import {
  Game,
  GameRunState,
  MemorySaveStorage,
  normalizeSaveName,
  type SaveStorage,
} from './Game'
import { GameState } from './GameState'
import { Item } from './Item'
import { Quest } from './Quest'
import { Room } from './Room'
import { Spell } from './Spell'

/** A carriable item with optional pickup hooks, as the take tests need. */
class TakeItem extends Item {
  pickupMessage: string

  constructor(name: string, canPickup = true, pickupMessage = '') {
    super({ name, description: 'A test item', canBeCarried: canPickup })
    this.pickupMessage = pickupMessage
  }

  override preventPickup(): string {
    return this.canBeCarried
      ? ''
      : `[failure]The ${this.name} is too heavy to lift.[/failure]`
  }

  override pickedUp(): string {
    return this.pickupMessage
  }
}

/** A character answering a few words. */
class Talker extends Character {
  constructor(name: string) {
    super({ name, description: `${name} the talker.` })
  }

  override sayTo(_gameState: GameState, words: string): string {
    if (words === 'hello') {
      return `[dialogue][character_name]${this.name}[/character_name] responds: 'Hello there!'[/dialogue]`
    }
    return `[dialogue][character_name]${this.name}[/character_name] looks confused and doesn't understand '${words}'.[/dialogue]`
  }
}

/** A spell that reports what it was cast on. */
class EchoSpell extends Spell {
  constructor(id: string, name: string = id) {
    super({ id, name, description: `A ${name} spell` })
  }

  override castSpell(): string {
    return `[event]You cast [spell_name]${this.name}[/spell_name] without a target.[/event]`
  }

  override castOnItem(_gameState: GameState, target: Item): string {
    return `[event]You cast [spell_name]${this.name}[/spell_name] on [item_name]${target.name}[/item_name].[/event]`
  }

  override castOnCharacter(_gameState: GameState, target: Character): string {
    return `[event]You cast [spell_name]${this.name}[/spell_name] on [character_name]${target.name}[/character_name].[/event]`
  }
}

function item(name: string, shortName?: string): Item {
  return new Item({
    name,
    description: `A ${name}.`,
    shortName,
    canBeCarried: true,
  })
}

function character(name: string): Character {
  return new Character({ name, description: `${name} description.` })
}

/** Cottage (south) <-> Field (north). */
function basicRooms(): Record<string, Room> {
  const cottage = new Room({
    name: 'EliorsCottage',
    description: 'A cozy cottage with a warm hearth.',
    exits: { south: 'VegetableField' },
  })
  const field = new Room({
    name: 'VegetableField',
    description: 'A patch of tilled earth.',
    exits: { north: 'EliorsCottage' },
  })
  return { EliorsCottage: cottage, VegetableField: field }
}

function makeGame(rooms = basicRooms(), quests: Quest[] = []): Game {
  return new Game([
    new Act({ name: 'TestAct', rooms, quests, musicFile: '', musicInfo: '' }),
  ])
}

describe('Game', () => {
  let rooms: Record<string, Room>
  let game: Game

  beforeEach(() => {
    rooms = basicRooms()
    game = makeGame(rooms)
  })

  describe('golden path', () => {
    it('is the path of the act named Act<N>, empty when there is none', () => {
      const act = (name: string, goldenPath?: string[]): Act =>
        new Act({
          name,
          rooms: basicRooms(),
          quests: [],
          musicFile: '',
          musicInfo: '',
          goldenPath,
        })
      const two = new Game([
        act('Act1', ['look']),
        act('Act2', ['map', 'look']),
      ])
      expect(two.goldenPath(2)).toEqual(['map', 'look'])
      expect(two.goldenPath(3)).toEqual([])
      expect(new Game([act('Act4')]).goldenPath(4)).toEqual([])
    })

    it('runs through the cheat command', () => {
      const cheated = new Game([
        new Act({
          name: 'Act1',
          rooms: basicRooms(),
          quests: [],
          musicFile: '',
          musicInfo: '',
          goldenPath: ['go south'],
        }),
      ])
      cheated.commandParser.parse('cheat act 1')
      expect(cheated.state.currentRoom.name).toBe('VegetableField')
    })
  })

  describe('item lookup', () => {
    it('delegates to the state lookup, honouring the where-to-look options', () => {
      const roomKey = item('Cellar Key', 'key')
      const bagKey = item('Brass Key', 'key')
      game.state.currentRoom.addItem(roomKey)
      game.state.inventory.push(bagKey)
      expect(game.findAllItems('key')).toEqual(game.state.findItems('key'))
      expect(game.findItem('key')).toBe(bagKey)
      expect(game.findItem('key', { inventory: false })).toBe(roomKey)
      expect(game.findAllItems('key', { room: false })).toEqual([bagKey])
    })
  })

  describe('start', () => {
    it('begins in the first room, running, showing the logo and not accepting input', () => {
      expect(game.state.currentRoom).toBe(rooms.EliorsCottage)
      expect(game.isRunning).toBe(true)
      expect(game.state.inventory).toEqual([])
      expect(game.runState).toBe(GameRunState.ShowLogo)
      expect(game.acceptInput).toBe(false)
      expect(game.getActName()).toBe('Act 1')
    })

    it('calls the act set-up hook on its fresh state', () => {
      const act = new Act({
        name: 'A',
        rooms: basicRooms(),
        quests: [],
        musicFile: '',
        musicInfo: '',
      })
      act.setupGameState = (state) => state.setStoryFlag('ready', true)
      expect(new Game([act]).state.getStoryFlag('ready')).toBe(true)
    })

    it('shows the logo with the act music credits, lines ending cleanly', () => {
      const act = new Act({
        name: 'A',
        rooms: basicRooms(),
        quests: [],
        musicFile: 'x.mp3',
        musicInfo: 'Song by X',
      })
      const logo = new Game([act]).getAsciiLogo()
      expect(logo).toContain('Welcome to')
      expect(logo.endsWith('[bold]Music track:[/bold] Song by X')).toBe(true)
      const art = logo.split('[bold yellow]')[1].split('[/bold yellow]')[0]
      const lines = art.split('\n').filter((line) => line.trim())
      expect(lines.length).toBeGreaterThan(0)
      expect(lines.every((line) => line.trimEnd().endsWith('#'))).toBe(true)
    })
  })

  describe('turns', () => {
    it('goes logo -> intro -> running and then accepts input', () => {
      game.acts[0].getActIntro = () => 'INTRO'
      expect(game.getResultText()).toContain('Welcome to')
      game.newTurn()
      expect(game.runState).toBe(GameRunState.ActIntro)
      expect(game.isActIntroShowing()).toBe(true)
      expect(game.getResultText()).toBe('INTRO')
      expect(game.getActIntro()).toBe('INTRO')
      expect(game.acceptInput).toBe(false)
      game.newTurn()
      expect(game.isActRunning()).toBe(true)
      expect(game.acceptInput).toBe(true)
      expect(game.hasChangedRoom).toBe(true)
    })

    it('ignores input until the act runs, then shows the command result', () => {
      game.handleInput('look')
      expect(game.getResultText()).not.toBe('')
      expect(game.commandResult).toBe('')
      game.newTurn()
      game.newTurn()
      game.handleInput('xyzzy')
      expect(game.getResultText()).toContain(
        "I don't understand the command: 'xyzzy'",
      )
      game.newTurn()
      expect(game.isActRunning()).toBe(true)
    })

    it('opens the act-complete text with the finished act’s hook, and only that act’s', () => {
      class HookedAct extends Act {
        /** A hook for the test. */
        override getCompletionHook(): string {
          return 'A hook.'
        }
      }
      const options = {
        rooms: basicRooms(),
        quests: [],
        musicFile: '',
        musicInfo: '',
      }
      const first = new HookedAct({ ...options, name: 'First' })
      const second = new Act({
        ...options,
        rooms: basicRooms(),
        name: 'Second',
      })
      let firstDone = false
      first.isCompleted = () => firstDone
      const game = new Game([first, second])
      game.newTurn()
      game.newTurn()
      firstDone = true
      game.newTurn()
      expect(game.getActCompleteText()).toMatch(
        /^A hook\.\n\nCongratulations — you have completed Act 1!/,
      )
      expect(
        new Act({ ...options, name: 'Plain' }).getCompletionHook(game.state),
      ).toBe('')
    })

    it('moves on to the next act when the act completes, then ends the game', () => {
      const first = new Act({
        name: 'First',
        rooms: basicRooms(),
        quests: [],
        musicFile: 'a.mp3',
        musicInfo: 'A',
      })
      const secondRooms = {
        Gate: new Room({ name: 'Gate', description: 'A gate.' }),
      }
      const second = new Act({
        name: 'Second',
        rooms: secondRooms,
        quests: [],
        musicFile: 'b.mp3',
        musicInfo: 'B',
      })
      let firstDone = false
      let secondDone = false
      first.isCompleted = () => firstDone
      second.isCompleted = () => secondDone
      const game = new Game([first, second])
      game.newTurn()
      game.newTurn()
      firstDone = true
      const firstState = game.state
      game.handleInput('look')
      game.newTurn()
      expect(game.isActTransitioning()).toBe(true)
      expect(game.acceptInput).toBe(false)
      expect(game.currentAct).toBe(0)
      expect(game.state).toBe(firstState)
      expect(game.getResultText()).toContain(
        'Congratulations — you have completed Act 1!',
      )
      expect(game.getResultText()).toContain('Get ready for Act 2')
      expect(game.getActCompleteText()).toMatch(
        /^Congratulations — you have completed Act 1!\n\nTake a moment.*Act 2.*\.$/s,
      )
      game.newTurn()
      expect(game.getActCompleteText()).toBeNull()
      expect(game.isActIntroShowing()).toBe(true)
      expect(game.currentAct).toBe(1)
      expect(game.state.currentRoom).toBe(secondRooms.Gate)
      expect(game.getActName()).toBe('Act 2')
      game.newTurn()
      secondDone = true
      game.newTurn()
      expect(game.isRunning).toBe(false)
      expect(game.acceptInput).toBe(false)
    })

    it('carries declared flags and virtues into the next act, and drops the rest', () => {
      const first = new Act({
        name: 'First',
        rooms: basicRooms(),
        quests: [],
        musicFile: 'a.mp3',
        musicInfo: 'A',
      })
      first.carriedFlags = () => ['field_watered']
      const second = new Act({
        name: 'Second',
        rooms: { Gate: new Room({ name: 'Gate', description: 'A gate.' }) },
        quests: [],
        musicFile: 'b.mp3',
        musicInfo: 'B',
      })
      const third = new Act({
        name: 'Third',
        rooms: { Field: new Room({ name: 'Field', description: 'A field.' }) },
        quests: [],
        musicFile: 'c.mp3',
        musicInfo: 'C',
      })
      let done = 0
      first.isCompleted = () => done >= 1
      second.isCompleted = () => done >= 2
      const game = new Game([first, second, third])
      game.newTurn()
      game.newTurn()
      game.state.setStoryFlag('field_watered', true)
      game.state.setStoryFlag('private_to_first', true)
      game.state.addVirtue('mercy')
      done = 1
      game.newTurn()
      game.newTurn()
      expect(game.currentAct).toBe(1)
      expect(game.state.getStoryFlag('field_watered')).toBe(true)
      expect(game.state.getStoryFlag('private_to_first')).toBe(false)
      expect(game.state.hasVirtue('mercy')).toBe(true)
      game.newTurn()
      game.newTurn()
      done = 2
      game.newTurn()
      game.newTurn()
      expect(game.currentAct).toBe(2)
      expect(game.state.getStoryFlag('field_watered')).toBe(true)
    })

    it('hints from the active quests, the main quest first, and is quiet with none', () => {
      const side = new Quest({ name: 'Side', description: 'Fetch the rope.' })
      class Main extends Quest {
        override isMain(): boolean {
          return true
        }
      }
      const main = new Main({ name: 'Main', description: 'Find the glade.' })
      const act = new Act({
        name: 'Hints',
        rooms: basicRooms(),
        quests: [side, main],
        musicFile: 'a.mp3',
        musicInfo: 'A',
      })
      const game = new Game([act])
      expect(game.hint()).toBe(
        '[dim]You think it over. Nothing presses on you just now.[/dim]',
      )
      game.state.activatedQuests.push(side, main)
      expect(game.hint()).toBe(
        'You stop and think over what you know.\n' +
          '[bold]Main:[/bold] Find the glade.\n' +
          '[bold]Side:[/bold] Fetch the rope.',
      )
    })

    it("keeps the finished act, its state and its music until the transition's page is passed", () => {
      const mk = (name: string, file: string): Act =>
        new Act({
          name,
          rooms: basicRooms(),
          quests: [],
          musicFile: file,
          musicInfo: name,
        })
      const first = mk('First', 'a.mp3')
      const second = mk('Second', 'b.mp3')
      let firstDone = false
      let secondDone = false
      first.isCompleted = () => firstDone
      second.isCompleted = () => secondDone
      const game = new Game([first, second])
      const empty = { musicFile: '', musicInfo: '' }
      expect(game.currentMusic()).toEqual(empty)
      game.newTurn()
      game.newTurn()
      expect(game.currentMusic()).toEqual({
        musicFile: 'a.mp3',
        musicInfo: 'First',
      })
      firstDone = true
      const firstState = game.state
      game.newTurn()
      expect(game.isActTransitioning()).toBe(true)
      expect(game.currentAct).toBe(0)
      expect(game.state).toBe(firstState)
      // The finished act's music plays on under its closing pages.
      expect(game.currentMusic()).toEqual({
        musicFile: 'a.mp3',
        musicInfo: 'First',
      })
      expect(game.nextActIntro()).toBe(second.getActIntro())
      game.newTurn()
      expect(game.currentAct).toBe(1)
      expect(game.state).not.toBe(firstState)
      expect(game.nextActIntro()).toBeNull()
      expect(game.currentMusic()).toEqual(empty)
      game.newTurn()
      expect(game.currentMusic()).toEqual({
        musicFile: 'b.mp3',
        musicInfo: 'Second',
      })
      secondDone = true
      game.newTurn()
      expect(game.isGameOver()).toBe(true)
      expect(game.currentMusic()).toEqual({
        musicFile: 'b.mp3',
        musicInfo: 'Second',
      })
    })

    it('enters game over when the last act completes, staying in that act', () => {
      const only = new Act({
        name: 'Only',
        rooms: basicRooms(),
        quests: [],
        musicFile: 'a.mp3',
        musicInfo: 'A',
      })
      let done = false
      only.isCompleted = () => done
      const game = new Game([only])
      game.newTurn()
      game.newTurn()
      expect(game.isGameOver()).toBe(false)
      done = true
      game.handleInput('look')
      game.newTurn()
      expect(game.isGameOver()).toBe(true)
      expect(game.isActRunning()).toBe(false)
      expect(game.isRunning).toBe(false)
      expect(game.acceptInput).toBe(false)
      expect(game.currentAct).toBe(0)
      expect(game.getActName()).toBe('Act 1')
      expect(game.getResultText()).toContain(
        'Congratulations — you have completed Act 1, ' +
          'the final act of RetroQuest!',
      )
      expect(game.getActCompleteText()).toBe(
        'Congratulations — you have completed Act 1, ' +
          'the final act of RetroQuest!',
      )
      game.newTurn()
      expect(game.isGameOver()).toBe(true)
      game.handleInput('look')
      expect(game.getResultText()).not.toContain('Vegetable')
    })
  })

  describe('move', () => {
    it('moves through an exit, enters the room and marks it visited', () => {
      const entered = vi.spyOn(rooms.VegetableField, 'onEnter')
      const result = game.move('south')
      expect(game.state.currentRoom).toBe(rooms.VegetableField)
      expect(result).toBe('')
      expect(entered).toHaveBeenCalledWith(game.state)
      expect(game.hasChangedRoom).toBe(true)
      expect(game.state.visitedRooms).toEqual([
        'EliorsCottage',
        'VegetableField',
      ])
      game.move('north')
      expect(game.state.visitedRooms).toEqual([
        'EliorsCottage',
        'VegetableField',
      ])
    })

    it('refuses directions without an exit or leading nowhere', () => {
      expect(game.move('west')).toBe(
        "[failure]You can't go that way.[/failure]",
      )
      rooms.EliorsCottage.exits.east = 'Nowhere'
      expect(game.move('east')).toBe(
        '[failure]That exit leads nowhere (room not found).[/failure]',
      )
    })

    it("answers a blocked direction with the room's own line", () => {
      class SealedRoom extends Room {
        /** Seal the north exit with a story line. */
        override blockedExit(
          _gameState: GameState,
          direction: string,
        ): string | null {
          return direction === 'north' ? '[event]Sealed shut.[/event]' : null
        }
      }
      const sealed = new SealedRoom({ name: 'Sealed', description: 'd' })
      const game = makeGame({ Sealed: sealed })
      expect(game.move('north')).toBe('[event]Sealed shut.[/event]')
      expect(game.move('west')).toBe(
        "[failure]You can't go that way.[/failure]",
      )
      expect(game.state.currentRoom).toBe(sealed)
    })

    it('lets a room handle a direction itself without leaving', () => {
      class WadeRoom extends Room {
        /** Take over east: wade in place instead of leaving. */
        override walk(_gameState: GameState, direction: string): string | null {
          return direction === 'east' ? '[event]You wade.[/event]' : null
        }
      }
      const wade = new WadeRoom({
        name: 'Wade',
        description: 'd',
        exits: { east: 'Wade', north: 'Other' },
      })
      const other = new Room({ name: 'Other', description: 'd' })
      const game = makeGame({ Wade: wade, Other: other })
      expect(game.move('east')).toBe('[event]You wade.[/event]')
      expect(game.state.currentRoom).toBe(wade)
      expect(game.move('north')).not.toContain('You move')
      expect(game.state.currentRoom).toBe(other)
    })

    it('shows the text a room says on departure, with no echo of the move', () => {
      class GateRoom extends Room {
        /** Say something when leaving east. */
        override departText(_gameState: GameState, direction: string): string {
          return direction === 'east' ? '[event]You slip out.[/event]\n\n' : ''
        }
      }
      const gate = new GateRoom({
        name: 'Gate',
        description: 'd',
        exits: { east: 'Other' },
      })
      const other = new Room({ name: 'Other', description: 'd' })
      const game = makeGame({ Gate: gate, Other: other })
      expect(game.move('west')).not.toContain('You slip out.')
      const moved = game.move('east')
      expect(moved.startsWith('[event]You slip out.[/event]')).toBe(true)
      expect(moved).not.toContain('You move')
    })

    it('lets the player leave a room named Main Square by any of its exits', () => {
      const square = new Room({
        name: 'Main Square',
        description: 'd',
        exits: { north: 'Castle', south: 'Gate' },
      })
      const castle = new Room({ name: 'Castle', description: 'd' })
      const gate = new Room({ name: 'Gate', description: 'd' })
      const game = makeGame({ MainSquare: square, Castle: castle, Gate: gate })
      expect(game.move('north')).not.toContain('You move')
      expect(game.state.currentRoom).toBe(castle)
    })
  })

  describe('map', () => {
    it('lists visited rooms with their exits', () => {
      const initial = game.map()
      expect(initial).toContain('[bold]Visited Rooms and Exits:[/bold]')
      expect(initial).toContain('- [room_name]EliorsCottage[/room_name]:')
      expect(initial).toContain(
        '    south -> [room_name]VegetableField[/room_name]',
      )
      expect(initial).not.toContain('- [room_name]VegetableField[/room_name]')
      game.move('south')
      game.move('north')
      const result = game.map()
      expect(result).toContain(
        '    north -> [room_name]EliorsCottage[/room_name]',
      )
      expect(result.split('- ').length - 1).toBe(2)
    })

    it('says so when a visited room has no exits', () => {
      const game = makeGame({
        Void: new Room({ name: 'Void', description: 'd' }),
      })
      expect(game.map()).toContain('    No exits')
    })
  })

  describe('take and drop', () => {
    it('takes an item from the room into the inventory', () => {
      const egg = item('egg')
      rooms.EliorsCottage.items.push(egg)
      expect(game.take('egg')).toBe(
        'This might come in handy, so you decide to pick it up.',
      )
      expect(game.state.inventory).toEqual([egg])
      expect(rooms.EliorsCottage.items).toEqual([])
    })

    it('reports missing items', () => {
      expect(game.take('nonexistent')).toBe(
        "[failure]There is no 'nonexistent' here to take.[/failure]",
      )
    })

    it('takes every identical item at once', () => {
      for (let i = 0; i < 5; i++)
        rooms.EliorsCottage.items.push(new TakeItem('coins'))
      const result = game.commandParser.parse('take coins')
      expect(result).toBe(
        'This might come in handy, so you decide to pick it up.',
      )
      expect(rooms.EliorsCottage.items).toEqual([])
      expect(game.state.getItemCount('coins')).toBe(5)
    })

    it('takes what it can and explains what it cannot', () => {
      rooms.EliorsCottage.items.push(
        new TakeItem('book'),
        new TakeItem('book', true, 'This book is heavy!'),
        new TakeItem('book', false),
      )
      const result = game.take('book')
      expect(result).toBe(
        'This might come in handy, so you decide to pick it up.\n' +
          'This book is heavy!\n' +
          '[failure]The book is too heavy to lift.[/failure]',
      )
      expect(rooms.EliorsCottage.items).toHaveLength(1)
      expect(game.state.getItemCount('book')).toBe(2)
    })

    it('says only the pickup line of a single item that has one', () => {
      rooms.EliorsCottage.items.push(
        new TakeItem('gem', true, 'The gem glows!'),
      )
      expect(game.take('gem')).toBe('The gem glows!')
      expect(game.state.getItemCount('gem')).toBe(1)
    })

    it('only reports the prevention when nothing could be taken', () => {
      rooms.EliorsCottage.items.push(new TakeItem('anvil', false))
      expect(game.take('anvil')).toBe(
        '[failure]The anvil is too heavy to lift.[/failure]',
      )
      expect(game.take('well')).toBe(
        "[failure]There is no 'well' here to take.[/failure]",
      )
    })

    it('drops an inventory item into the room', () => {
      const lantern = item('lantern')
      game.state.inventory.push(lantern)
      expect(game.drop('lantern')).toBe(
        '[event]You drop the [item_name]lantern[/item_name].[/event]',
      )
      const token = item("nyx's token")
      game.state.inventory.push(token)
      expect(game.drop("nyx's token")).toBe(
        "[event]You drop the [item_name]nyx's token[/item_name].[/event]",
      )
      expect(game.state.inventory).toEqual([])
      expect(rooms.EliorsCottage.items).toEqual([lantern, token])
      expect(game.drop('nonexistent')).toBe(
        "[failure]You don't have a 'nonexistent' to drop.[/failure]",
      )
    })
  })

  describe('inventory', () => {
    it('lists carried items', () => {
      expect(game.inventory()).toBe('Your inventory is empty.')
      game.state.inventory.push(item('apple'), item('stick'))
      expect(game.inventory()).toBe(
        '[bold]You are carrying:[/bold]\n- [item_name]apple[/item_name]\n- [item_name]stick[/item_name]',
      )
    })
  })

  describe('spells', () => {
    it('learns a spell once', () => {
      const light = new EchoSpell('light')
      expect(game.learn(light)).toBe(
        'You have learned the [spell_name]light[/spell_name] spell!',
      )
      expect(game.learn(light)).toBe('')
      expect(game.state.knownSpells).toEqual([light])
    })

    it('lists known spells', () => {
      expect(game.spells()).toBe("You don't know any spells yet.")
      game.learn(new EchoSpell('light'))
      game.learn(new EchoSpell('heal'))
      expect(game.spells()).toBe(
        '[bold]Known Spells:[/bold]\n' +
          '  - [spell_name]light[/spell_name]: A light spell\n' +
          '  - [spell_name]heal[/spell_name]: A heal spell',
      )
    })
  })

  describe('cast', () => {
    beforeEach(() => {
      game.state.knownSpells = [new EchoSpell('heal'), new EchoSpell('light')]
      rooms.EliorsCottage.addItem(item('test item', 'item'))
      rooms.EliorsCottage.addCharacter(character('test character'))
      game.state.inventory.push(item('inventory item'))
    })

    it('casts without a target, on items (room, inventory, short name) and characters', () => {
      expect(game.cast('heal')).toBe(
        '[event]You cast [spell_name]heal[/spell_name] without a target.[/event]',
      )
      const onItem =
        '[event]You cast [spell_name]heal[/spell_name] on [item_name]test item[/item_name].[/event]'
      expect(game.cast('heal on test item')).toBe(onItem)
      expect(game.cast('HEAL on TEST ITEM')).toBe(onItem)
      expect(game.cast('heal on item')).toBe(onItem)
      expect(game.cast('heal on inventory item')).toContain(
        '[item_name]inventory item[/item_name]',
      )
      expect(game.cast('heal on test character')).toBe(
        '[event]You cast [spell_name]heal[/spell_name] on [character_name]test character[/character_name].[/event]',
      )
    })

    it('lets a character answer a spell cast on it before the spell does', () => {
      class Wary extends Character {
        override receiveSpell(_gameState: GameState, spell: Spell): string {
          return `[event]${this.name} meets ${spell.name}.[/event]`
        }
      }
      rooms.EliorsCottage.addCharacter(
        new Wary({ name: 'wary one', description: 'd' }),
      )
      expect(game.cast('heal on wary one')).toBe(
        '[event]wary one meets heal.[/event]',
      )
    })

    it('casts a multi-word spell by its shown name as well as its id, never printing the id', () => {
      game.state.knownSpells.push(new EchoSpell('two_words', 'Two Words'))
      const expected =
        '[event]You cast [spell_name]Two Words[/spell_name] without a target.[/event]'
      expect(game.cast('two words')).toBe(expected)
      expect(game.cast('two_words')).toBe(expected)
      expect(game.cast('Two Words on test item')).toContain(
        '[item_name]test item[/item_name]',
      )
      const missing = game.cast('two words on dragon')
      expect(missing).toContain('[spell_name]Two Words[/spell_name]')
      expect(missing).not.toContain('two_words')
      expect(game.spells()).toContain('[spell_name]Two Words[/spell_name]')
      expect(game.spells()).not.toContain('two_words')
      const learned = game.learn(new EchoSpell('other_one', 'Other One'))
      expect(learned).toContain('[spell_name]Other One[/spell_name]')
      expect(learned).not.toContain('other_one')
    })

    it('prefers items over characters with the same name', () => {
      rooms.EliorsCottage.addItem(item('target'))
      rooms.EliorsCottage.addCharacter(character('target'))
      const result = game.cast('heal on target')
      expect(result).toContain('[item_name]target[/item_name]')
      expect(result).not.toContain('[character_name]')
    })

    it('reports unknown spells and missing targets', () => {
      expect(game.cast('fireball')).toBe(
        "[failure]You don't know any spell called 'fireball'.[/failure]",
      )
      expect(game.cast('heal on dragon')).toBe(
        "[failure]You don't see a 'dragon' to cast [spell_name]heal[/spell_name] on.[/failure]",
      )
      expect(game.cast('')).toBe(
        "[failure]You don't know any spell called ''.[/failure]",
      )
      expect(game.cast('on')).toBe(
        "[failure]You don't know any spell called 'on'.[/failure]",
      )
      expect(game.cast('heal on')).toBe(
        "[failure]You don't know any spell called 'heal on'.[/failure]",
      )
    })
  })

  describe('examine', () => {
    it('examines items in the inventory or room, then characters', () => {
      const apple = item('Golden Apple')
      apple.description = 'A golden delicious apple.'
      game.state.inventory.push(apple)
      expect(game.examine('golden apple')).toBe('A golden delicious apple.')
      const rock = item('rock')
      rooms.EliorsCottage.addItem(rock)
      expect(game.examine('rock')).toBe('A rock.')
      const john = new Character({
        name: 'Blacksmith John',
        description: 'Strong and sturdy.',
      })
      rooms.EliorsCottage.addCharacter(john)
      expect(game.examine('blacksmith JOHN')).toBe('Strong and sturdy.')
    })

    it('asks what to examine and reports unknown targets', () => {
      expect(game.examine('')).toBe('Examine what?')
      expect(game.examine('dragon')).toBe("You don't see that here.")
    })
  })

  describe('look, search, rest, listen', () => {
    it('looks around and flags the room for re-description', () => {
      game.hasChangedRoom = false
      expect(game.look()).toBe('')
      expect(game.hasChangedRoom).toBe(true)
    })

    it('delegates search and rest to the room', () => {
      rooms.EliorsCottage.search = () => 'You find a coin.'
      rooms.EliorsCottage.rest = () => 'You nap.'
      expect(game.search()).toBe('You find a coin.')
      expect(game.rest()).toBe('You nap.')
    })

    it('listens to the room or an item', () => {
      rooms.EliorsCottage.getAmbientSound = (state) =>
        state === game.state ? 'Leaves rustle.' : 'Silence.'
      expect(game.listen()).toBe('Leaves rustle.')
      const shell = item('Whispering Shell')
      shell.listen = () => 'You hear the sea.'
      rooms.EliorsCottage.addItem(shell)
      expect(game.listen('whispering SHELL')).toBe('You hear the sea.')
      expect(game.listen('relic')).toBe(
        "[failure]You don't see a 'relic' to listen to here or in your inventory.[/failure]",
      )
    })
  })

  describe('talk and say', () => {
    it('lets the room answer when nobody by that name is there', () => {
      rooms.EliorsCottage.talkToNobody = () => 'quiet'
      expect(game.talk('ghost')).toBe('quiet')
    })

    it('talks to a character in the room', () => {
      rooms.EliorsCottage.addCharacter(character('Mira'))
      expect(game.talk('mira')).toContain('has nothing to say right now')
      expect(game.talk('')).toBe('[failure]Talk to whom?[/failure]')
      expect(game.talk('ghost')).toBe(
        "[failure]There is no character named '[character_name]ghost[/character_name]' here to talk to.[/failure]",
      )
    })

    it('says words to a character', () => {
      rooms.EliorsCottage.addCharacter(new Talker('Guard Captain'))
      expect(game.say('hello', 'guard captain')).toContain(
        "responds: 'Hello there!'",
      )
      expect(game.say('magic words', 'guard captain')).toContain(
        "doesn't understand 'magic words'",
      )
      expect(game.say('hello', 'ghost')).toBe(
        "[failure]There is no character named '[character_name]ghost[/character_name]' here to speak to.[/failure]",
      )
      expect(game.say('', 'guard captain')).toBe(
        '[failure]What do you want to say?[/failure]',
      )
      expect(game.say('hello', '')).toBe(
        '[failure]Who do you want to say that to?[/failure]',
      )
      expect(game.say('', '')).toBe(
        '[failure]What do you want to say?[/failure]',
      )
    })
  })

  describe('give', () => {
    it('hands an inventory item to a character in the room', () => {
      const apple = item('apple')
      const villager = character('Villager')
      villager.giveItem = (_state, given) => `Villager takes the ${given.name}.`
      game.state.inventory.push(apple)
      rooms.EliorsCottage.addCharacter(villager)
      expect(game.give('apple to villager')).toBe('Villager takes the apple.')
    })

    it('reports missing items, missing characters and bad formats', () => {
      rooms.EliorsCottage.addCharacter(character('Villager'))
      expect(game.give('nonexistent_item to villager')).toBe(
        "[failure]You don't have any 'nonexistent_item' to give.[/failure]",
      )
      game.state.inventory.push(item('apple'))
      expect(game.give('apple to Ghost')).toBe(
        "[failure]There is no character named 'Ghost' here.[/failure]",
      )
      expect(game.give('apple villager')).toBe(
        "[failure]Invalid command format. Please use 'give <target1> to <target2>'.[/failure]",
      )
      expect(game.give('to villager')).toBe(
        '[failure]What do you want to give?[/failure]',
      )
      expect(game.give('apple to')).toBe(
        '[failure]Who/What should I give apple to?[/failure]',
      )
    })

    it('uses the default refusal of a plain character', () => {
      game.state.inventory.push(item('stick'))
      rooms.EliorsCottage.addCharacter(character('Grumpy Person'))
      expect(game.give('stick to grumpy person')).toContain(
        "[character_name]Grumpy Person[/character_name] doesn't seem interested in the [item_name]stick[/item_name].",
      )
    })
  })

  describe('buy', () => {
    it('asks the character to sell', () => {
      const shopkeeper = character('Shopkeeper')
      shopkeeper.buyItem = (_state, name) => `Sold: ${name}`
      rooms.EliorsCottage.addCharacter(shopkeeper)
      expect(game.buy('magic beans from shopkeeper')).toBe('Sold: magic beans')
      rooms.EliorsCottage.addCharacter(character('villager'))
      expect(game.buy('rope from villager')).toContain(
        '[character_name]Villager[/character_name] has nothing to sell you.',
      )
    })

    it('reports missing characters and bad formats', () => {
      expect(game.buy('rope from Ghostly Shopkeeper')).toBe(
        "[failure]There is no character named 'Ghostly shopkeeper' here.[/failure]",
      )
      expect(game.buy('rope shopkeeper')).toBe(
        "[failure]Invalid command format. Please use 'buy <target1> from <target2>'.[/failure]",
      )
      expect(game.buy('from shopkeeper')).toBe(
        '[failure]What do you want to buy?[/failure]',
      )
      expect(game.buy('rope from')).toBe(
        '[failure]Who/What should I buy rope from?[/failure]',
      )
    })
  })

  describe('use', () => {
    function using(name: string): Item {
      const it = item(name)
      it.use = () => `You used the [item]${name}[/item].`
      it.useWith = (_state, other) =>
        `You used the [item]${name}[/item] with [item]${other.name}[/item].`
      it.useOnCharacter = (_state, target) =>
        `You used the [item_name]${name}[/item_name] on [character_name]${target.name}[/character_name].`
      return it
    }

    it('uses an item from the inventory or the room', () => {
      game.state.addItemToInventory(using('widget'))
      rooms.EliorsCottage.addItem(using('lever'))
      expect(game.use('widget')).toBe('You used the [item]widget[/item].')
      expect(game.use('lever')).toBe('You used the [item]lever[/item].')
      expect(game.use('nonexistent_item')).toBe(
        "[failure]You don't have a 'nonexistent_item' to use, and there isn't one here.[/failure]",
      )
    })

    it('uses an item with another item wherever they are', () => {
      game.state.addItemToInventory(using('key'))
      rooms.EliorsCottage.addItem(using('locked_door'))
      expect(game.use('key', 'locked_door')).toBe(
        'You used the [item]key[/item] with [item]locked_door[/item].',
      )
      expect(game.use('locked_door', 'key')).toBe(
        'You used the [item]locked_door[/item] with [item]key[/item].',
      )
      expect(game.use('key', 'key')).toBe(
        "[failure]You can't use the [item_name]key[/item_name] with itself.[/failure]",
      )
      expect(game.use('key', 'nonexistent_item2')).toBe(
        "[failure]You don't see a 'nonexistent_item2' to use with the [item_name]key[/item_name].[/failure]",
      )
      expect(game.use('nonexistent_item1', 'key')).toBe(
        "[failure]You don't have a 'nonexistent_item1' to use, and there isn't one here.[/failure]",
      )
    })

    it('uses an item on a character when no item matches the target', () => {
      game.state.addItemToInventory(using('Crystal Shard'))
      rooms.EliorsCottage.addCharacter(character('Wise Wizard'))
      expect(game.use('crystal shard', 'wise wizard')).toBe(
        'You used the [item_name]Crystal Shard[/item_name] on [character_name]Wise Wizard[/character_name].',
      )
      game.state.addItemToInventory(item('apple'))
      rooms.EliorsCottage.addCharacter(character('hungry person'))
      expect(game.use('apple', 'hungry person')).toBe(
        "[failure]You can't use the [item_name]apple[/item_name] on [character_name]Hungry Person[/character_name].[/failure]",
      )
      expect(game.use('apple', 'unicorn')).toBe(
        "[failure]You don't see a 'unicorn' to use with the [item_name]apple[/item_name].[/failure]",
      )
    })

    it('prefers an item over a character with the same name', () => {
      game.state.addItemToInventory(using('hammer'))
      game.state.addItemToInventory(using('target'))
      rooms.EliorsCottage.addCharacter(character('target'))
      expect(game.use('hammer', 'target')).toBe(
        'You used the [item]hammer[/item] with [item]target[/item].',
      )
    })
  })

  describe('open, close, eat, drink, equip, unequip', () => {
    it('delegates to the item or reports it missing', () => {
      const box = item('box')
      box.open = () => 'opened'
      box.close = () => 'closed'
      box.eat = () => 'eaten'
      box.drink = () => 'drunk'
      box.equip = () => 'equipped'
      box.unequip = () => 'unequipped'
      rooms.EliorsCottage.addItem(box)
      expect(game.open('box')).toBe('opened')
      expect(game.close('box')).toBe('closed')
      expect(game.eat('box')).toBe('eaten')
      expect(game.drink('box')).toBe('drunk')
      expect(game.equip('box')).toBe('equipped')
      expect(game.unequip('box')).toBe('unequipped')
      expect(game.open('')).toBe('[failure]Open what?[/failure]')
      expect(game.close('')).toBe('[failure]Close what?[/failure]')
      expect(game.eat('')).toBe('[failure]Eat what?[/failure]')
      expect(game.drink('')).toBe('[failure]Drink what?[/failure]')
      expect(game.equip('')).toBe('[failure]Equip what?[/failure]')
      expect(game.unequip('')).toBe('[failure]Unequip what?[/failure]')
      expect(game.open('x')).toBe(
        "[failure]You don't see a 'x' to open here or in your inventory.[/failure]",
      )
      expect(game.close('x')).toBe(
        "[failure]You don't see a 'x' to close here or in your inventory.[/failure]",
      )
      expect(game.eat('x')).toBe(
        "[failure]You don't see a 'x' to eat here or in your inventory.[/failure]",
      )
      expect(game.drink('x')).toBe(
        "[failure]You don't see a 'x' to drink here or in your inventory.[/failure]",
      )
      expect(game.equip('x')).toBe(
        "[failure]You don't see a 'x' to equip here or in your inventory.[/failure]",
      )
      expect(game.unequip('x')).toBe(
        "[failure]You don't see a 'x' to unequip here or in your inventory.[/failure]",
      )
    })
  })

  describe('help, stats, quit, unknown', () => {
    it('lists the commands without revealing the cheat', () => {
      const help = game.help()
      expect(help).toContain('[bold]Available Commands:[/bold]')
      expect(help).toContain('cast <spell> on <object/character>')
      expect(help).toContain('sleep, rest, wait')
      expect(help.toLowerCase()).not.toContain('cheat')
      expect(game.getCommandCompletions()).not.toHaveProperty('cheat')
    })

    it('shows the stats, quits and reports unknown commands', () => {
      expect(game.stats()).toContain('[room_name]EliorsCottage[/room_name]')
      expect(game.quit()).toBe('')
      expect(game.isRunning).toBe(false)
      expect(game.unknown('xyzzy')).toBe(
        "[failure]I don't understand the command: 'xyzzy'. Try 'help' for a list of valid commands.[/failure]",
      )
    })
  })

  describe('completions', () => {
    it('offers the available directions, items, characters and spells', () => {
      rooms.EliorsCottage.addItem(item("Elior's Journal", 'journal'))
      rooms.EliorsCottage.addCharacter(character('Old Mira'))
      game.state.inventory.push(item('rope'))
      game.state.knownSpells = [new EchoSpell('light')]
      const tree = game.getCommandCompletions()
      expect(tree.s).toBeNull()
      expect(tree.south).toBeNull()
      expect(tree).not.toHaveProperty('n')
      expect(tree.go).toEqual({ south: null })
      expect(tree.talk).toEqual({ to: { old: { mira: null } } })
      expect(tree.take).toEqual({ "elior's": { journal: null }, journal: null })
      expect(tree.drop).toEqual({ rope: null })
      expect(tree.give).toEqual({ rope: { to: { old: { mira: null } } } })
      expect(tree.buy).toEqual({
        "elior's": { journal: { from: { old: { mira: null } } } },
        journal: { from: { old: { mira: null } } },
      })
      expect(tree.cast).toEqual({
        light: {
          '@': null,
          on: {
            "elior's": { journal: null },
            journal: null,
            rope: null,
            old: { mira: null },
          },
        },
      })
      expect(tree.use).toHaveProperty('rope')
      expect((tree.use as Record<string, unknown>).rope).toEqual({
        '@': null,
        with: {
          "elior's": { journal: null },
          journal: null,
          rope: null,
          old: { mira: null },
        },
      })
      expect(tree.look).toHaveProperty('at')
      expect(tree.look).toHaveProperty('@', null)
      expect(tree.help).toBeNull()
    })

    it('treats item names that match object properties as plain tokens', () => {
      rooms.EliorsCottage.addItem(item('constructor'))
      const tree = game.getCommandCompletions()
      expect(tree.take).toEqual({ constructor: null })
    })
  })

  describe('save and load', () => {
    class StateAct extends Act {
      done = false

      constructor(label: string, classes = {}) {
        const room = new Room({
          name: `${label} Room`,
          description: `The ${label} room.`,
        })
        super({
          name: label,
          rooms: { [`${label}Room`]: room },
          quests: [],
          musicFile: `${label}.mp3`,
          musicInfo: '',
          classes,
        })
      }

      override isCompleted(): boolean {
        return this.done
      }
    }

    function twoActGame(storage: SaveStorage = new MemorySaveStorage()): Game {
      return new Game(
        [
          new StateAct('First', { StateAct, EchoSpell }),
          new StateAct('Second'),
        ],
        {
          saveStorage: storage,
        },
      )
    }

    function advanceToSecondAct(game: Game): void {
      game.newTurn()
      game.newTurn()
      ;(game.acts[0] as StateAct).done = true
      game.newTurn()
      game.newTurn()
      game.newTurn()
      expect(game.currentAct).toBe(1)
    }

    it('saves to the default and named slots and loads them back', () => {
      const storage = new MemorySaveStorage()
      const game = twoActGame(storage)
      expect(game.save()).toBe('[event]Game saved successfully.[/event]')
      expect(game.save('MySlot')).toBe(
        '[event]Game saved successfully.[/event]',
      )
      expect(storage.read('retroquest')).not.toBeNull()
      expect(storage.read('myslot')).not.toBeNull()
      expect(storage.read('MySlot')).toBeNull()
      expect(game.load()).toBe('[event]Game loaded successfully.[/event]')
      expect(game.load('MySlot')).toBe(
        '[event]Game loaded successfully.[/event]',
      )
      expect(game.load('unknown')).toBe(
        '[failure]No save file found.[/failure]',
      )
    })

    it.each([
      '../evil',
      '/absolute/path',
      'has spaces',
      'has\\backslash',
      'has\x00null',
      '',
    ])('rejects the save name %j', (name) => {
      const game = twoActGame()
      expect(game.save(name)).toContain('[failure]Invalid save name')
      expect(game.load(name)).toContain('[failure]Invalid save name')
    })

    it('reports storage failures', () => {
      const broken = {
        write: () => {
          throw new Error('quota')
        },
        read: () => {
          throw new Error('blocked')
        },
      }
      const game = twoActGame(broken)
      expect(game.save()).toBe('[failure]Failed to save game: quota[/failure]')
      expect(game.load()).toBe(
        '[failure]Failed to load game: blocked[/failure]',
      )
    })

    it('restores the saved act and state in a fresh game', () => {
      const storage = new MemorySaveStorage()
      const game = twoActGame(storage)
      advanceToSecondAct(game)
      game.state.setStoryFlag('seen', true)
      game.save()

      const fresh = twoActGame(storage)
      expect(fresh.load()).toContain('loaded')
      expect(fresh.currentAct).toBe(1)
      expect(fresh.getActName()).toBe('Act 2')
      expect(fresh.state.currentRoom.name).toBe('Second Room')
      expect(fresh.state.currentRoom).toBe(fresh.state.allRooms.SecondRoom)
      expect(fresh.state.getStoryFlag('seen')).toBe(true)
    })

    it('moves back to an earlier act when loading its save', () => {
      const game = twoActGame()
      game.save()
      advanceToSecondAct(game)
      game.load()
      expect(game.currentAct).toBe(0)
    })

    it('lets the loaded act migrate the loaded state', () => {
      const game = twoActGame()
      advanceToSecondAct(game)
      const data = game.toSaveData()
      const fresh = twoActGame()
      const afterLoad = vi.spyOn(fresh.acts[1], 'afterLoad')

      fresh.loadSaveData(data)

      expect(afterLoad).toHaveBeenCalledWith(fresh.state)
    })

    it('loads a save made after the last act ended into that act', () => {
      const storage = new MemorySaveStorage()
      const game = twoActGame(storage)
      advanceToSecondAct(game)
      ;(game.acts[1] as StateAct).done = true
      game.newTurn()
      expect(game.isGameOver()).toBe(true)
      expect(game.isRunning).toBe(false)
      game.save()
      const fresh = twoActGame(storage)
      fresh.newTurn()
      fresh.newTurn()
      expect(fresh.load()).toContain('loaded')
      expect(fresh.currentAct).toBe(1)
      expect(fresh.isActRunning()).toBe(true)
      expect(fresh.state.currentRoom.name).toBe('Second Room')
      // The finished act is complete again: the next turn ends the game.
      ;(fresh.acts[1] as StateAct).done = true
      fresh.newTurn()
      expect(fresh.isGameOver()).toBe(true)
    })

    it('saves the next act, as it will begin, when the save comes between acts', () => {
      const game = twoActGame()
      game.newTurn()
      game.newTurn()
      ;(game.acts[0] as StateAct).done = true
      game.newTurn()
      expect(game.isActTransitioning()).toBe(true)
      const data = game.toSaveData()
      expect(game.currentAct).toBe(0)

      const fresh = twoActGame()
      expect(fresh.loadSaveData(data)).toContain('loaded')
      expect(fresh.currentAct).toBe(1)
      expect(fresh.state.currentRoom.name).toBe('Second Room')
    })

    it('plays on from a load made between acts or after the last one', () => {
      const game = twoActGame()
      game.newTurn()
      game.newTurn()
      const data = game.toSaveData()
      ;(game.acts[0] as StateAct).done = true
      game.newTurn()
      expect(game.isActTransitioning()).toBe(true)

      expect(game.loadSaveData(data)).toContain('loaded')

      expect(game.isActRunning()).toBe(true)
      expect(game.acceptInput).toBe(true)
      expect(game.currentAct).toBe(0)

      const last = twoActGame()
      advanceToSecondAct(last)
      const secondData = last.toSaveData()
      ;(last.acts[1] as StateAct).done = true
      last.newTurn()
      expect(last.isGameOver()).toBe(true)

      last.loadSaveData(secondData)

      expect(last.isActRunning()).toBe(true)
      expect(last.isRunning).toBe(true)
      expect(last.acceptInput).toBe(true)
    })

    it('carries a virtue into the next act and through a save round-trip', () => {
      const game = twoActGame()
      game.newTurn()
      game.newTurn()
      game.state.addVirtue('mercy')
      ;(game.acts[0] as StateAct).done = true
      game.newTurn()
      game.newTurn()
      game.newTurn()
      expect(game.currentAct).toBe(1)
      expect(game.state.hasVirtue('mercy')).toBe(true)
      const fresh = twoActGame()
      expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
      expect(fresh.state.hasVirtue('mercy')).toBe(true)
    })

    it('exposes the save data for other storages and rejects broken data', () => {
      const game = twoActGame()
      const data = game.toSaveData()
      expect(JSON.parse(data)).toMatchObject({ version: 4, actIndex: 0 })
      expect(game.loadSaveData(data)).toBe(
        '[event]Game loaded successfully.[/event]',
      )
      expect(game.loadSaveData('not json')).toContain(
        '[failure]Failed to load game',
      )
      expect(game.loadSaveData('{"version":99}')).toContain(
        '[failure]Failed to load game',
      )
      expect(game.loadSaveData('{"version":1}')).toContain(
        '[failure]Failed to load game',
      )
      const oldSave = JSON.parse(data) as Record<string, unknown>
      oldSave.version = 3
      expect(game.loadSaveData(JSON.stringify(oldSave))).toContain(
        'unsupported save format',
      )
    })

    it('keeps a known spell castable by its shown name after a save round-trip', () => {
      const game = twoActGame()
      game.state.knownSpells.push(new EchoSpell('two_words', 'Two Words'))
      const reloaded = twoActGame()
      reloaded.loadSaveData(game.toSaveData())
      const [spell] = reloaded.state.knownSpells
      expect(spell).toMatchObject({ id: 'two_words', name: 'Two Words' })
      expect(reloaded.state.hasSpell('two_words')).toBe(true)
      expect(reloaded.cast('two words')).toContain('Two Words')
    })

    it('names act classes after their act so acts may share class names', () => {
      const game = twoActGame()
      expect(game.registry.names()).toContain('First.StateAct')
      expect(game.registry.names()).toContain('GameState')
    })
  })
})

describe('normalizeSaveName', () => {
  it('trims and lowercases a valid name', () => {
    expect(normalizeSaveName('  My-Save_1 ')).toBe('my-save_1')
  })

  it.each(['', 'my save', 'a.b', 'a/b', 'é'])('rejects %j', (name) => {
    expect(normalizeSaveName(name)).toBeNull()
  })
})
