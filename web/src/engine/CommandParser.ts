/**
 * Turns a typed command into a call on the game. `cheat act N` plays the
 * golden path the game gets from act N.
 */
import type { QuestChanges } from './GameState'

/** The part of the game the parser drives (implemented by Game). */
export interface CommandTarget {
  state: {
    settleQuests(): QuestChanges
  }
  move(direction: string): string
  talk(target: string): string
  say(words: string, character: string): string
  give(args: string): string
  buy(args: string): string
  look(): string
  examine(target: string): string
  search(): string
  take(item: string): string
  drop(item: string): string
  use(item: string, other?: string): string
  inventory(): string
  open(target: string): string
  close(target: string): string
  cast(args: string): string
  spells(): string
  save(name?: string): string
  load(name?: string): string
  help(): string
  quit(): string
  rest(): string
  map(): string
  stats(): string
  unknown(command: string): string
  /** The commands that play act `actNumber` (1-based) through; empty when it has none. */
  goldenPath(actNumber: number): string[]
}

const DIRECTIONS = ['north', 'south', 'east', 'west', 'up', 'down'] as const
const SHORT_DIRECTIONS: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
}
const TALK_PREFIXES = ['talk to ', 'speak to ', 'converse with ']
const GIVE_PREFIXES = ['give ', 'hand ']
const EXAMINE_PREFIXES = ['look at ', 'inspect ', 'examine ', 'check ', 'look ']
const TAKE_PREFIXES = ['take ', 'pick up ', 'grab ', 'get ']
const DROP_PREFIXES = ['drop ', 'discard ']

const SAY_USAGE = 'Use say <word> to <character>'
const USE_WITH_USAGE =
  'You need to specify two items to use with each other. ' +
  'Format: use <item1> with <item2>'

function afterPrefix(command: string, prefixes: string[]): string | null {
  const prefix = prefixes.find((p) => command.startsWith(p))
  return prefix === undefined ? null : command.slice(prefix.length)
}

export class CommandParser {
  /** The last command as typed, before normalization. */
  lastRaw: string | null = null

  constructor(private readonly game: CommandTarget) {}

  parse(command: string): string {
    this.lastRaw = command
    const cmd = command.trim().toLowerCase()

    const direction = this.direction(cmd)
    if (direction !== null) return this.game.move(direction)

    const talkTarget = afterPrefix(cmd, TALK_PREFIXES)
    if (talkTarget !== null) return this.game.talk(talkTarget)
    if (cmd.startsWith('say ')) return this.say(cmd.slice('say '.length).trim())
    const giveArgs = afterPrefix(cmd, GIVE_PREFIXES)
    if (giveArgs !== null) return this.game.give(giveArgs)
    if (cmd.startsWith('buy ')) return this.game.buy(cmd.slice('buy '.length))

    if (['look', 'observe', 'survey', 'l'].includes(cmd))
      return this.game.look()
    const examineTarget = afterPrefix(cmd, EXAMINE_PREFIXES)
    if (examineTarget !== null) return this.game.examine(examineTarget)
    if (cmd === 'search' || cmd === 'investigate') return this.game.search()

    const takeTarget = afterPrefix(cmd, TAKE_PREFIXES)
    if (takeTarget !== null) return this.game.take(takeTarget)
    const dropTarget = afterPrefix(cmd, DROP_PREFIXES)
    if (dropTarget !== null) return this.game.drop(dropTarget)
    if (cmd === 'use') return 'What do you want to use?'
    if (cmd.startsWith('use ')) return this.use(command)
    if (['inventory', 'i', 'inv'].includes(cmd)) return this.game.inventory()
    if (cmd.startsWith('open '))
      return this.game.open(cmd.slice('open '.length))
    if (cmd.startsWith('close '))
      return this.game.close(cmd.slice('close '.length))

    if (cmd.startsWith('cast '))
      return this.game.cast(cmd.slice('cast '.length))
    if (cmd === 'spells') return this.game.spells()

    if (cmd === 'save') return this.game.save()
    if (cmd.startsWith('save '))
      return this.game.save(cmd.slice('save '.length).trim())
    if (cmd === 'load') return this.game.load()
    if (cmd.startsWith('load '))
      return this.game.load(cmd.slice('load '.length).trim())
    if (cmd === 'help' || cmd === '?') return this.game.help()
    if (cmd === 'quit' || cmd === 'exit') return this.game.quit()

    if (cmd === 'sleep' || cmd === 'rest') return this.game.rest()
    if (cmd === 'map') return this.game.map()
    if (cmd === 'stats') return this.game.stats()
    if (cmd.startsWith('cheat act ')) {
      const argument = cmd.slice('cheat act '.length).trim()
      const commands = /^[1-9]\d*$/.test(argument)
        ? this.game.goldenPath(Number(argument))
        : []
      if (commands.length > 0) return this.executeCheat(commands)
    }
    return this.game.unknown(cmd)
  }

  /** The direction a movement command names, or null for other commands. */
  private direction(cmd: string): string | null {
    const word = afterPrefix(cmd, ['go ', 'move ']) ?? cmd
    if (word === cmd) {
      const long = SHORT_DIRECTIONS[word] ?? word
      return (DIRECTIONS as readonly string[]).includes(long) ? long : null
    }
    if (cmd.startsWith('go ')) return word.trim()
    return (DIRECTIONS as readonly string[]).includes(word) ? word : null
  }

  private say(args: string): string {
    const separator = args.indexOf(' to ')
    if (separator < 0) {
      return `You need to specify who to say that to. ${SAY_USAGE}`
    }
    const words = args.slice(0, separator).trim()
    const character = args.slice(separator + ' to '.length).trim()
    if (!words || !character) {
      return `You need to specify both what to say and who to say it to. ${SAY_USAGE}`
    }
    return this.game.say(words, character)
  }

  /** `use <item>`, `use <item> with <other>` or `use <item> on <other>`, from the command as typed. */
  private use(command: string): string {
    const tail = command.trim().slice('use '.length)
    const stripped = tail.trim()
    if (!stripped) return 'What do you want to use?'
    if (tail.toLowerCase().trimEnd().endsWith(' with')) return USE_WITH_USAGE
    const lower = stripped.toLowerCase()
    // "on" reads the same as "with" when the command has no "with"
    const joiner = lower.includes(' with ') ? ' with ' : ' on '
    const split = lower.indexOf(joiner)
    if (split < 0) return this.game.use(lower)
    const item = lower.slice(0, split).trim()
    const other = lower.slice(split + joiner.length).trim()
    if (!item || !other) return USE_WITH_USAGE
    return this.game.use(item, other)
  }

  /** Run a command sequence, settling quest changes after each command. */
  private executeCheat(commands: string[]): string {
    const results: string[] = []
    for (const command of commands) {
      results.push(this.parse(command))
      this.game.state.settleQuests()
    }
    return results.join('\n')
  }
}
