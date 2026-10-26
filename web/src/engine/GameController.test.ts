import { describe, it, expect, vi } from 'vitest'
import { Act } from './Act'
import { Character } from './Character'
import { Game } from './Game'
import { GameController, type QuestReport } from './GameController'
import { GameState } from './GameState'
import { Item } from './Item'
import { Quest } from './Quest'
import { Room } from './Room'
import { Spell } from './Spell'

function item(name: string, shortName?: string): Item {
  return new Item({ name, description: `A ${name}.`, shortName })
}

function character(name: string): Character {
  return new Character({ name, description: 'Hello there.' })
}

class SimpleQuest extends Quest {
  main: boolean

  constructor(name: string, main = false) {
    super({ name, description: `Do ${name}.` })
    this.main = main
  }

  override isMain(): boolean {
    return this.main
  }
}

const FLAG_ACT_DONE = 'act_done'

class FlagQuest extends SimpleQuest {
  override checkTrigger(): boolean {
    return true
  }

  override checkCompletion(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT_DONE)
  }
}

class FlagAct extends Act {
  override isCompleted(gameState: GameState): boolean {
    return gameState.getStoryFlag(FLAG_ACT_DONE)
  }
}

function simpleAct(rooms: Record<string, Room>, quests: Quest[] = []): Act {
  return new Act({
    name: 'Test Act',
    rooms,
    quests,
    musicFile: '',
    musicInfo: '',
  })
}

function makeController(
  options: {
    roomName?: string
    description?: string
    items?: Item[]
    characters?: Character[]
    exits?: Record<string, string>
    quests?: Quest[]
  } = {},
): GameController {
  const room = new Room({
    name: options.roomName ?? 'Test Room',
    description: options.description ?? 'A test room.',
    items: options.items,
    characters: options.characters,
    exits: options.exits,
  })
  return new GameController(
    new Game([simpleAct({ TestRoom: room }, options.quests)]),
  )
}

function startAct(ctrl: GameController): void {
  ctrl.game.newTurn() // logo -> act intro
  ctrl.game.newTurn() // act intro -> running
}

describe('GameController', () => {
  it('starts with the logo text', () => {
    const ctrl = makeController()
    expect(ctrl.start()).toContain('Welcome to')
  })

  it('runs commands through the parser', () => {
    const ctrl = makeController()
    expect(ctrl.handleCommand('xyzzy')).toContain("I don't understand")
    expect(ctrl.look()).toBe('')
    expect(ctrl.getActIntro()).toBe('')
  })

  describe('golden path', () => {
    it('is the golden path of the numbered act, empty when it has none', () => {
      const act = new Act({
        name: 'Act1',
        rooms: {
          Start: new Room({ name: 'Start', description: 'A room.' }),
        },
        quests: [],
        musicFile: '',
        musicInfo: '',
        goldenPath: ['look'],
      })
      const controller = new GameController(new Game([act]))
      expect(controller.goldenPath(1)).toEqual(['look'])
      expect(controller.goldenPath(2)).toEqual([])
    })
  })

  describe('room data', () => {
    it('reports the room name and description', () => {
      const ctrl = makeController({
        roomName: 'Moonlit Glade',
        description: 'Vines creep along crumbling stone walls.',
      })
      expect(ctrl.getRoomName()).toBe('Moonlit Glade')
      expect(ctrl.getRoomDescription()).toBe(
        'Vines creep along crumbling stone walls.',
      )
    })

    it('lists the rooms visited so far by name', () => {
      const ctrl = makeController()
      expect(ctrl.getVisitedRooms()).toEqual([ctrl.getRoomName()])
    })

    it('lists characters and items by name', () => {
      expect(makeController().getRoomCharacters()).toEqual([])
      expect(makeController().getRoomItems()).toEqual([])
      const ctrl = makeController({
        characters: [character('Mira'), character('Elior')],
        items: [item('Old Scroll'), item('Rusty Key')],
      })
      expect(ctrl.getRoomCharacters()).toEqual(['Mira', 'Elior'])
      expect(ctrl.getRoomItems()).toEqual(['Old Scroll', 'Rusty Key'])
    })

    it('maps exits to the destination rooms display names', () => {
      expect(makeController().getRoomExits()).toEqual({})
      expect(
        makeController({ exits: { north: 'MarketRoad' } }).getRoomExits(),
      ).toEqual({
        north: 'MarketRoad',
      })
      const square = new Room({
        name: 'Village Square',
        description: 'A busy square.',
      })
      const cottage = new Room({
        name: "Elior's Cottage",
        description: 'A cottage.',
        exits: { east: 'VillageSquare' },
      })
      const ctrl = new GameController(
        new Game([
          simpleAct({ EliorsCottage: cottage, VillageSquare: square }),
        ]),
      )
      expect(ctrl.getRoomExits()).toEqual({ east: 'Village Square' })
    })

    it('shows a room label for an exit instead of the destination name', () => {
      class Gate extends Room {
        override exitLabel(): string | null {
          return 'the way home'
        }
      }
      const gate = new Gate({
        name: 'Gate',
        description: 'A gate.',
        exits: { north: 'Field' },
      })
      const field = new Room({ name: 'Field', description: 'A field.' })
      const game = new Game([simpleAct({ Gate: gate, Field: field })])
      expect(new GameController(game).getRoomExits()).toEqual({
        north: 'the way home',
      })
      expect(game.commandParser.parse('map')).toContain(
        'north -> [room_name]the way home',
      )
    })

    it('lists every ware of every merchant in the room', () => {
      expect(
        makeController({ characters: [character('guard')] }).getRoomWares(),
      ).toEqual([])
      const shopkeeper = Object.assign(character('shopkeeper'), {
        wares: {
          rope: { item: item('rope'), price: 1 },
          sword: { item: item('sword'), price: 5 },
        },
      })
      const ctrl = makeController({
        characters: [shopkeeper, character('guard')],
      })
      expect(ctrl.getRoomWares()).toEqual([
        { name: 'rope', price: 1, seller: 'shopkeeper' },
        { name: 'sword', price: 5, seller: 'shopkeeper' },
      ])
    })

    it('maps short names of room and bag items to their full names', () => {
      const ctrl = makeController({
        items: [item("Elior's Journal", 'journal'), item('bucket')],
      })
      ctrl.game.state.inventory.push(item('Rusty Hoe', 'hoe'))
      expect(ctrl.getShortNames()).toEqual({
        journal: "Elior's Journal",
        hoe: 'Rusty Hoe',
      })
    })

    it('maps a shared short name to the item the engine picks', () => {
      const ctrl = makeController({ items: [item('Rusted Locker Key', 'key')] })
      ctrl.game.state.inventory.push(
        item("Miner's Key", 'key'),
        item('Old Key', 'key'),
      )
      expect(ctrl.getShortNames()).toEqual({ key: "Miner's Key" })
      expect(ctrl.game.findItem('key')?.name).toBe("Miner's Key")
    })

    it('agrees with the engine lookup for every short name it lists', () => {
      const ctrl = makeController({
        items: [item('Cellar Key', 'key'), item('Torch', 'light')],
      })
      ctrl.game.state.inventory.push(
        item('Brass Key', 'key'),
        item('Lamp', 'light'),
      )
      for (const [short, name] of Object.entries(ctrl.getShortNames())) {
        expect(ctrl.game.findItem(short)?.name).toBe(name)
        expect(ctrl.game.state.findItem(short)?.name).toBe(name)
      }
    })
  })

  describe('journal data', () => {
    it('lists inventory with counts and spells as markup, and quests as data', () => {
      const ctrl = makeController()
      const state = ctrl.game.state
      state.addItemToInventory(item('coin'), 3)
      state.addItemToInventory(item('sword'))
      state.learnSpell(
        new Spell({ id: 'light', name: 'light', description: 'Lights.' }),
      )
      const main = new SimpleQuest('Main Arc', true)
      const side = new SimpleQuest('Side A')
      side.completion = 'Side A done.'
      state.activatedQuests = [main]
      state.completedQuests = [side]

      expect(ctrl.getInventory()).toEqual([
        { name: '[item_name]3 coin[/item_name]', description: 'A coin.' },
        { name: '[item_name]sword[/item_name]', description: 'A sword.' },
      ])
      expect(ctrl.getSpells()).toEqual([
        { name: '[spell_name]light[/spell_name]', description: 'Lights.' },
      ])
      expect(ctrl.getActiveQuests()).toEqual([
        {
          name: 'Main Arc',
          main: true,
          done: false,
          details: { kind: 'journal', latest: 'Do Main Arc.', earlier: [] },
        },
      ])
      expect(ctrl.getCompletedQuests()).toEqual([
        {
          name: 'Side A',
          main: false,
          done: true,
          details: { kind: 'journal', latest: 'Side A done.', earlier: [] },
        },
      ])
    })
  })

  describe('quest events', () => {
    it('reports activation, update and completion once each as pop-up text', () => {
      const quest = new FlagQuest('Main Arc', true)
      let updated = false
      quest.checkUpdate = () => {
        const changed = updated
        updated = false
        return changed
      }
      const ctrl = makeController({ quests: [quest] })
      const none = { activated: [], updated: [], completed: [] }
      expect(ctrl.settleQuests()).toEqual(none) // not running yet
      startAct(ctrl)
      const started = {
        name: 'Main Arc',
        main: true,
        text: 'Do Main Arc.',
      }
      expect(ctrl.settleQuests()).toEqual({ ...none, activated: [started] })
      expect(ctrl.settleQuests()).toEqual(none)
      updated = true
      expect(ctrl.settleQuests()).toEqual({ ...none, updated: [started] })
      ctrl.game.state.setStoryFlag(FLAG_ACT_DONE, true)
      expect(ctrl.settleQuests()).toEqual({
        ...none,
        completed: [
          {
            name: 'Main Arc',
            main: true,
            text: "You have completed the quest 'Main Arc'.",
          },
        ],
      })
      expect(ctrl.settleQuests()).toEqual(none)
    })
  })

  /** A `checkUpdate` that reports a change the first time only. */
  function once(): () => boolean {
    let fired = false
    return () => !fired && (fired = true)
  }

  /** The first quest report of the turn whose log changed, once the act runs. */
  function settleUpdate(ctrl: GameController): QuestReport | undefined {
    startAct(ctrl)
    return ctrl.settleQuests().updated[0]
  }

  describe('quest log data', () => {
    /** A quest with a journal of stages and a checklist, set by hand. */
    class LoggedQuest extends SimpleQuest {
      journal(earlier: string[], latest: string): void {
        this.setJournal(earlier, latest)
      }
      list(): void {
        this.setChecklist(
          { intro: 'Find:', items: [{ done: false, text: 'a key' }] },
          'Find:\n○ a key',
        )
      }
    }

    it('shows an update as its newest journal entry', () => {
      const quest = new LoggedQuest('Arc')
      quest.journal(['First.'], 'Second.')
      const ctrl = makeController()
      quest.checkUpdate = once()
      ctrl.game.state.activatedQuests = [quest]
      expect(settleUpdate(ctrl)).toMatchObject({ text: 'Second.' })
      expect(ctrl.getActiveQuests()[0].details).toEqual({
        kind: 'journal',
        latest: 'Second.',
        earlier: ['First.'],
      })
    })

    it('shows an update of a checklist whole, and lists its items', () => {
      const quest = new LoggedQuest('Arc')
      quest.list()
      const ctrl = makeController()
      quest.checkUpdate = once()
      ctrl.game.state.activatedQuests = [quest]
      expect(settleUpdate(ctrl)).toMatchObject({ text: 'Find:\n○ a key' })
      expect(ctrl.getActiveQuests()[0].details).toEqual({
        kind: 'checklist',
        intro: 'Find:',
        items: [{ done: false, text: 'a key' }],
      })
    })
  })

  describe('a finished checklist in the news', () => {
    it('shows only its items once none is open', () => {
      class Done extends Quest {
        constructor() {
          super({ name: 'Clues', description: 'Intro\n\n✓ a\n✓ b' })
          this.setChecklist(
            {
              intro: 'Intro',
              items: [
                { done: true, text: 'a' },
                { done: true, text: 'b' },
              ],
            },
            this.description,
          )
        }
        private fired = false
        override checkUpdate(): boolean {
          const fire = !this.fired
          this.fired = true
          return fire
        }
      }
      const ctrl = makeController()
      ctrl.game.state.activatedQuests = [new Done()]
      expect(settleUpdate(ctrl)).toMatchObject({ text: '✓ a\n✓ b' })
    })
  })

  describe('progress and stats', () => {
    function questController(): [GameController, SimpleQuest[]] {
      const quests = [
        new SimpleQuest('Main Arc', true),
        new SimpleQuest('Side A'),
        new SimpleQuest('Side B'),
      ]
      return [makeController({ quests: [...quests] }), quests]
    }

    it('counts all quests of the act, completed ones, act number and main quest', () => {
      const [ctrl, quests] = questController()
      expect(ctrl.getQuestProgress()).toEqual({
        completed: 0,
        total: 3,
        actNumber: 1,
        mainQuest: 'Main Arc',
      })
      const state = ctrl.game.state
      state.nonActivatedQuests.splice(
        state.nonActivatedQuests.indexOf(quests[1]),
        1,
      )
      state.completedQuests.push(quests[1])
      expect(ctrl.getQuestProgress()).toMatchObject({ completed: 1, total: 3 })
      expect(makeController().getQuestProgress().mainQuest).toBeNull()
    })

    it('counts quests, spells and places for the act stats', () => {
      const [ctrl, quests] = questController()
      const state = ctrl.game.state
      state.nonActivatedQuests.splice(
        state.nonActivatedQuests.indexOf(quests[1]),
        1,
      )
      state.completedQuests.push(quests[1])
      state.visitedRooms.push('Cellar')
      expect(ctrl.getActStats()).toEqual({
        questsCompleted: 1,
        questsTotal: 3,
        spells: 0,
        places: 2,
      })
    })
  })

  describe('act end', () => {
    it('still reports the completion that ended the last act', () => {
      const act = new FlagAct({
        name: 'Only',
        rooms: { Hall: new Room({ name: 'Hall', description: 'A hall.' }) },
        quests: [new FlagQuest('Final', true)],
        musicFile: '',
        musicInfo: '',
      })
      const ctrl = new GameController(new Game([act]))
      startAct(ctrl)
      ctrl.settleQuests()
      ctrl.game.state.setStoryFlag(FLAG_ACT_DONE, true)
      ctrl.game.newTurn()
      expect(ctrl.game.isGameOver()).toBe(true)
      const { completed } = ctrl.settleQuests()
      expect(completed).toHaveLength(1)
      expect(completed[0].text).toContain(
        "You have completed the quest 'Final'.",
      )
    })

    function twoActController(): GameController {
      const first = new FlagAct({
        name: 'First',
        rooms: { Hall: new Room({ name: 'Hall', description: 'A hall.' }) },
        quests: [new FlagQuest('Main Arc', true), new SimpleQuest('Side A')],
        musicFile: '',
        musicInfo: '',
      })
      const second = simpleAct(
        { Gate: new Room({ name: 'Gate', description: 'A gate.' }) },
        [new SimpleQuest('Next Arc', true)],
      )
      const ctrl = new GameController(new Game([first, second]))
      startAct(ctrl)
      ctrl.settleQuests()
      return ctrl
    }

    function endFirstAct(ctrl: GameController): void {
      ctrl.game.state.setStoryFlag(FLAG_ACT_DONE, true)
      ctrl.game.newTurn()
    }

    it('still reports the completion that ended the act', () => {
      const ctrl = twoActController()
      endFirstAct(ctrl)
      expect(ctrl.game.isActTransitioning()).toBe(true)
      const { completed } = ctrl.settleQuests()
      expect(completed).toHaveLength(1)
      expect(completed[0].name).toBe('Main Arc')
      expect(ctrl.settleQuests().completed).toEqual([])
    })

    it('reports the finished act progress and stats during the transition', () => {
      const ctrl = twoActController()
      ctrl.game.state.visitedRooms.push('Cellar')
      endFirstAct(ctrl)
      ctrl.settleQuests()
      expect(ctrl.getQuestProgress()).toEqual({
        completed: 1,
        total: 2,
        actNumber: 1,
        mainQuest: 'Main Arc',
      })
      expect(ctrl.getActStats()).toMatchObject({
        questsCompleted: 1,
        questsTotal: 2,
        places: 2,
      })
    })

    it('moves on to the next act after the transition', () => {
      const ctrl = twoActController()
      endFirstAct(ctrl)
      ctrl.game.newTurn() // transition -> next act intro
      expect(ctrl.settleQuests().completed).toEqual([])
      expect(ctrl.getQuestProgress()).toMatchObject({
        actNumber: 2,
        mainQuest: 'Next Arc',
      })
      expect(ctrl.getActName()).toBe('Act 2')
    })
  })

  describe('game state', () => {
    it('reports running states, act name and music', () => {
      const room = new Room({ name: 'R', description: '' })
      const act = new Act({
        name: 'A',
        rooms: { R: room },
        quests: [],
        musicFile: 'market.mp3',
        musicInfo: 'Market by Composer',
      })
      const ctrl = new GameController(new Game([act]))
      expect(ctrl.isGameRunning()).toBe(true)
      expect(ctrl.isActRunning()).toBe(false)
      expect(ctrl.getActName()).toBe('Act 1')
      expect(ctrl.getCurrentMusic()).toEqual({ musicFile: '', musicInfo: '' })
      startAct(ctrl)
      expect(ctrl.isActRunning()).toBe(true)
      expect(ctrl.getCurrentMusic()).toEqual({
        musicFile: 'market.mp3',
        musicInfo: 'Market by Composer',
      })
    })

    it('reports game over and keeps the last act playing after it', () => {
      const room = new Room({ name: 'R', description: '' })
      const act = new Act({
        name: 'A',
        rooms: { R: room },
        quests: [],
        musicFile: 'finale.mp3',
        musicInfo: 'Finale by Composer',
      })
      let done = false
      act.isCompleted = () => done
      const ctrl = new GameController(new Game([act]))
      startAct(ctrl)
      expect(ctrl.isGameOver()).toBe(false)
      done = true
      ctrl.game.newTurn()
      expect(ctrl.isGameOver()).toBe(true)
      expect(ctrl.getCurrentMusic()).toEqual({
        musicFile: 'finale.mp3',
        musicInfo: 'Finale by Composer',
      })
    })

    it('takes a turn per command and advances through the intro screens', () => {
      const ctrl = makeController()
      expect(ctrl.isAcceptingInput()).toBe(false)
      expect(ctrl.advanceToRunning().length).toBeGreaterThan(1)
      expect(ctrl.isActRunning()).toBe(true)
      expect(ctrl.isAcceptingInput()).toBe(true)
      expect(ctrl.takeTurn('xyzzy')).toContain("I don't understand")
      expect(ctrl.getResultText()).toBe(ctrl.game.getResultText())
      expect(ctrl.getCommandCompletions()).toEqual(
        ctrl.game.getCommandCompletions(),
      )
    })

    describe('lastTurnRoomDescription', () => {
      function twoRooms(): GameController {
        const field = new Room({
          name: 'Field',
          description: 'A field.',
          exits: { south: 'Hall' },
        })
        const hall = new Room({
          name: 'Hall',
          description: 'A hall.',
          exits: { north: 'Field' },
        })
        const ctrl = new GameController(
          new Game([simpleAct({ Hall: hall, Field: field })]),
        )
        startAct(ctrl)
        return ctrl
      }

      it('is null for a command that does not describe the room', () => {
        const ctrl = twoRooms()
        ctrl.takeTurn('inventory')
        expect(ctrl.lastTurnRoomDescription()).toBeNull()
      })

      it('says a first move arrived at a first visit, and a return did not', () => {
        const ctrl = twoRooms()
        ctrl.takeTurn('go north')
        expect(ctrl.lastTurnRoomDescription()).toEqual({
          moved: true,
          firstVisit: true,
        })
        ctrl.takeTurn('go south')
        expect(ctrl.lastTurnRoomDescription()).toEqual({
          moved: true,
          firstVisit: false,
        })
      })

      it('says a look stayed in the room', () => {
        const ctrl = twoRooms()
        ctrl.takeTurn('look')
        expect(ctrl.lastTurnRoomDescription()).toEqual({
          moved: false,
          firstVisit: false,
        })
        ctrl.takeTurn('xyzzy')
        expect(ctrl.lastTurnRoomDescription()).toBeNull()
      })

      it('counts a room the engine put the player in without a move', () => {
        const ctrl = twoRooms()
        vi.spyOn(ctrl, 'handleCommand').mockImplementation(() => {
          ctrl.game.state.currentRoom = ctrl.game.state.allRooms.Field
          return ''
        })
        ctrl.takeTurn('inventory')
        expect(ctrl.lastTurnRoomDescription()).toEqual({
          moved: true,
          firstVisit: true,
        })
      })

      it('describes the first room of an act as an arrival at a first visit', () => {
        const ctrl = twoRooms()
        ctrl.openRoom()
        expect(ctrl.lastTurnRoomDescription()).toEqual({
          moved: true,
          firstVisit: true,
        })
      })
    })

    it('advances one screen and returns its text', () => {
      const ctrl = makeController()
      const logo = ctrl.getResultText()
      expect(ctrl.advanceTurn()).toBe(logo)
      expect(ctrl.getResultText()).not.toBe(logo)
    })

    it('saves and loads through the game', () => {
      const ctrl = makeController()
      expect(ctrl.loadGame()).toContain('No save file found')
      expect(ctrl.saveGame()).toContain('saved')
      expect(ctrl.loadGame()).toContain('loaded')
      expect(ctrl.saveGame('slot2')).toContain('saved')
      expect(ctrl.loadGame('slot2')).toContain('loaded')
    })
  })
})
