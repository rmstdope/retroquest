import { describe, it, expect, beforeEach } from 'vitest'
import { CommandParser, type CommandTarget } from './CommandParser'

type Call = unknown[]

/** A fake game that records which command methods the parser calls. */
class RecordingGame implements CommandTarget {
  calls: Call[] = []
  paths: Record<number, string[]> = {}
  settlements = 0
  state = {
    settleQuests: () => {
      this.settlements++
      return { activated: [], updated: [], completed: [] }
    },
  }

  goldenPath(actNumber: number): string[] {
    return this.paths[actNumber] ?? []
  }

  private record(...call: Call): string {
    this.calls.push(call)
    return ''
  }

  move(direction: string) {
    return this.record('move', direction)
  }
  talk(target: string) {
    return this.record('talk', target)
  }
  say(words: string, character: string) {
    return this.record('say', words, character)
  }
  give(args: string) {
    return this.record('give', args)
  }
  buy(args: string) {
    return this.record('buy', args)
  }
  help() {
    return this.record('help')
  }
  look() {
    return this.record('look')
  }
  examine(target: string) {
    return this.record('examine', target)
  }
  search() {
    return this.record('search')
  }
  take(item: string) {
    return this.record('take', item)
  }
  drop(item: string) {
    return this.record('drop', item)
  }
  use(item: string, other?: string) {
    return this.record('use', item, other ?? null)
  }
  inventory() {
    return this.record('inventory')
  }
  open(target: string) {
    return this.record('open', target)
  }
  close(target: string) {
    return this.record('close', target)
  }
  cast(args: string) {
    return this.record('cast', args)
  }
  spells() {
    return this.record('spells')
  }
  save(name?: string) {
    return this.record('save', name ?? '')
  }
  load(name?: string) {
    return this.record('load', name ?? '')
  }
  quit() {
    return this.record('quit')
  }
  rest() {
    return this.record('rest')
  }
  map() {
    return this.record('map')
  }
  stats() {
    return this.record('stats')
  }
  unknown(command: string) {
    return this.record('unknown', command)
  }
}

function expectCalls(
  game: RecordingGame,
  parser: CommandParser,
  table: Record<string, Call>,
) {
  for (const [command, call] of Object.entries(table)) {
    game.calls = []
    parser.parse(command)
    expect(game.calls, command).toEqual([call])
  }
}

describe('CommandParser', () => {
  let game: RecordingGame
  let parser: CommandParser

  beforeEach(() => {
    game = new RecordingGame()
    parser = new CommandParser(game)
  })

  it('dispatches movement commands', () => {
    expectCalls(game, parser, {
      'go north': ['move', 'north'],
      'move north': ['move', 'north'],
      north: ['move', 'north'],
      n: ['move', 'north'],
      'go south': ['move', 'south'],
      'move south': ['move', 'south'],
      south: ['move', 'south'],
      s: ['move', 'south'],
      'go east': ['move', 'east'],
      'move east': ['move', 'east'],
      east: ['move', 'east'],
      e: ['move', 'east'],
      'go west': ['move', 'west'],
      'move west': ['move', 'west'],
      west: ['move', 'west'],
      w: ['move', 'west'],
      'go up': ['move', 'up'],
      'move up': ['move', 'up'],
      up: ['move', 'up'],
      'go down': ['move', 'down'],
      'move down': ['move', 'down'],
      down: ['move', 'down'],
      'go secret_passage': ['move', 'secret_passage'],
      '  GO North ': ['move', 'north'],
    })
  })

  it('dispatches interaction commands', () => {
    expectCalls(game, parser, {
      'talk to mira': ['talk', 'mira'],
      'speak to blacksmith': ['talk', 'blacksmith'],
      'converse with villager': ['talk', 'villager'],
      'say hello to mira': ['say', 'hello', 'mira'],
      'say magic word to guardian spirit': [
        'say',
        'magic word',
        'guardian spirit',
      ],
      'say the answer is wisdom to water nymph': [
        'say',
        'the answer is wisdom',
        'water nymph',
      ],
      'give bread to grandmother': ['give', 'bread to grandmother'],
      'hand coin to merchant': ['give', 'coin to merchant'],
      'buy rope from shopkeeper': ['buy', 'rope from shopkeeper'],
    })
  })

  it('asks who to say something to', () => {
    for (const command of ['say hello', 'say to mira', 'say  to ']) {
      expect(parser.parse(command)).toContain(
        'You need to specify who to say that to',
      )
    }
    expect(game.calls).toEqual([])
  })

  it('dispatches examination commands', () => {
    expectCalls(game, parser, {
      look: ['look'],
      observe: ['look'],
      survey: ['look'],
      l: ['look'],
      'look at statue': ['examine', 'statue'],
      'look statue': ['examine', 'statue'],
      'inspect scroll': ['examine', 'scroll'],
      'examine book': ['examine', 'book'],
      'check altar': ['examine', 'altar'],
      search: ['search'],
      investigate: ['search'],
    })
  })

  it('dispatches inventory commands', () => {
    expectCalls(game, parser, {
      'take key': ['take', 'key'],
      'pick up sword': ['take', 'sword'],
      'grab apple': ['take', 'apple'],
      'get shield': ['take', 'shield'],
      'drop key': ['drop', 'key'],
      'discard rock': ['drop', 'rock'],
      'use lantern': ['use', 'lantern', null],
      'use key with chest': ['use', 'key', 'chest'],
      'use Bread With Chicken': ['use', 'bread', 'chicken'],
      inventory: ['inventory'],
      i: ['inventory'],
      inv: ['inventory'],
      'open chest': ['open', 'chest'],
      'close door': ['close', 'door'],
    })
  })

  it('asks what to use', () => {
    expect(parser.parse('use')).toBe('What do you want to use?')
    expect(parser.parse('use   ')).toBe('What do you want to use?')
    expect(parser.parse('use key with   ')).toContain(
      'You need to specify two items to use with each other',
    )
    expect(game.calls).toEqual([])
  })

  it('dispatches magic commands', () => {
    expectCalls(game, parser, {
      'cast fireball': ['cast', 'fireball'],
      'cast fireball on goblin': ['cast', 'fireball on goblin'],
      spells: ['spells'],
    })
  })

  it('dispatches game management commands', () => {
    expectCalls(game, parser, {
      save: ['save', ''],
      'save myadventure': ['save', 'myadventure'],
      load: ['load', ''],
      'load myadventure': ['load', 'myadventure'],
      help: ['help'],
      '?': ['help'],
      quit: ['quit'],
      exit: ['quit'],
    })
  })

  it('dispatches miscellaneous commands', () => {
    expectCalls(game, parser, {
      sleep: ['rest'],
      rest: ['rest'],
      map: ['map'],
      stats: ['stats'],
      xyzzy: ['unknown', 'xyzzy'],
      '': ['unknown', ''],
    })
  })

  it('remembers the last raw command', () => {
    parser.parse('Take Key')
    expect(parser.lastRaw).toBe('Take Key')
  })

  describe('cheats', () => {
    it('runs the golden path the game gives for the act', () => {
      game.paths[2] = ['take flower', 'talk to mountain hermit']
      parser.parse('cheat act 2')
      expect(game.calls).toEqual([
        ['take', 'flower'],
        ['talk', 'mountain hermit'],
      ])
    })

    it('does not know a cheat for an act without a golden path', () => {
      parser.parse('cheat act 4')
      expect(game.calls).toEqual([['unknown', 'cheat act 4']])
    })

    it('only accepts a plain act number', () => {
      game.paths[1] = ['look']
      parser.parse('cheat act 01')
      expect(game.calls).toEqual([['unknown', 'cheat act 01']])
    })

    it('does not know a cheat for a non-numeric act', () => {
      parser.parse('cheat act x')
      expect(game.calls).toEqual([['unknown', 'cheat act x']])
    })

    it('settles quests after each cheat command', () => {
      game.paths[1] = ['look', 'look']
      parser.parse('cheat act 1')
      expect(game.settlements).toBeGreaterThan(1)
      expect(game.settlements).toBe(game.calls.length)
    })
  })
})
