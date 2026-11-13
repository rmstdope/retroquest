/**
 * Turns a typed command into a call on the game. `cheat act N` plays the
 * golden path the game gets from act N.
 */
import type { QuestChanges } from './GameState'
import {
  DIRECTIONS,
  EXAMINE_SHORTHAND,
  SHORT_DIRECTIONS,
  formOf,
  prefixesOf,
} from './Grammar'

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
  hint(): string
  take(item: string): string
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

const TALK_PREFIXES = prefixesOf('talk to')
const GIVE_PREFIXES = prefixesOf('give')
/** `look ` also reads as examine when something follows. */
const EXAMINE_PREFIXES = [...prefixesOf('inspect'), `${EXAMINE_SHORTHAND} `]
/** The examine verbs typed with nothing named; `look` alone is `look`. */
const BARE_EXAMINE_VERBS = formOf('inspect').verbs
const TAKE_PREFIXES = prefixesOf('take')
const LOOK_VERBS = formOf('look').verbs
const GO_PREFIXES = prefixesOf('go')
const SAY_PREFIXES = prefixesOf('say')
const BUY_PREFIXES = prefixesOf('buy')
const USE_PREFIXES = prefixesOf('use')
const OPEN_PREFIXES = prefixesOf('open')
const CLOSE_PREFIXES = prefixesOf('close')
const CAST_PREFIXES = prefixesOf('cast')
const SAVE_PREFIXES = prefixesOf('save')
const LOAD_PREFIXES = prefixesOf('load')
const SPELLS_VERBS = formOf('spells').verbs
const SAVE_VERBS = formOf('save').verbs
const LOAD_VERBS = formOf('load').verbs
const HINT_VERBS = formOf('hint').verbs
const MAP_VERBS = formOf('map').verbs
const STATS_VERBS = formOf('stats').verbs
/** The words that join `use`'s two items: "with", and "on" when there is no "with". */
const USE_JOINS = formOf('use').joins?.words ?? []
const [USE_WITH, USE_ON] = [` ${USE_JOINS[0]} `, ` ${USE_JOINS[1]} `]
const GIVE_JOIN = formOf('give').joins?.words[0] ?? 'to'
const SEARCH_VERBS = formOf('search').verbs
const INVENTORY_VERBS = formOf('inventory').verbs
const HELP_VERBS = formOf('help').verbs
const QUIT_VERBS = formOf('quit').verbs
const REST_VERBS = formOf('sleep').verbs

const SAY_USAGE = 'Use say <word> to <character>'
const USE_WITH_USAGE =
  'You need to specify two items to use with each other. ' +
  'Format: use <item1> with <item2>'

function afterPrefix(command: string, prefixes: string[]): string | null {
  const prefix = prefixes.find((p) => command.startsWith(p))
  return prefix === undefined ? null : command.slice(prefix.length)
}

/**
 * The name the player's command addresses, as typed: the target of `talk to`,
 * `say … to` and `give … to`, or null for any other command. The same prefixes
 * and splitting as `parse`, so the story knows who a command is for.
 */
export function addresseeTarget(command: string): string | null {
  const cmd = command.trim().toLowerCase()
  const talk = afterPrefix(cmd, TALK_PREFIXES)
  if (talk !== null) return talk.trim() || null
  const sayArgs = afterPrefix(cmd, SAY_PREFIXES)
  if (sayArgs !== null) {
    const args = sayArgs
    const separator = args.indexOf(' to ')
    return separator < 0
      ? null
      : args.slice(separator + ' to '.length).trim() || null
  }
  const give = afterPrefix(cmd, GIVE_PREFIXES)
  if (give !== null) {
    const parts = give.split(/\s+/).filter(Boolean)
    const index = parts.indexOf(GIVE_JOIN)
    return index > 0 && index < parts.length - 1
      ? parts.slice(index + 1).join(' ')
      : null
  }
  return null
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
    const sayArgs = afterPrefix(cmd, SAY_PREFIXES)
    if (sayArgs !== null) return this.say(sayArgs.trim())
    const giveArgs = afterPrefix(cmd, GIVE_PREFIXES)
    if (giveArgs !== null) return this.game.give(giveArgs)
    const buyArgs = afterPrefix(cmd, BUY_PREFIXES)
    if (buyArgs !== null) return this.game.buy(buyArgs)

    if (LOOK_VERBS.includes(cmd)) return this.game.look()
    if (BARE_EXAMINE_VERBS.includes(cmd)) return this.game.examine('')
    const examineTarget = afterPrefix(cmd, EXAMINE_PREFIXES)
    if (examineTarget !== null) return this.game.examine(examineTarget)
    if (SEARCH_VERBS.includes(cmd)) return this.game.search()

    const takeTarget = afterPrefix(cmd, TAKE_PREFIXES)
    if (takeTarget !== null) return this.game.take(takeTarget)
    if (cmd === 'use') return 'What do you want to use?'
    if (afterPrefix(cmd, USE_PREFIXES) !== null) return this.use(command)
    if (INVENTORY_VERBS.includes(cmd)) return this.game.inventory()
    const openTarget = afterPrefix(cmd, OPEN_PREFIXES)
    if (openTarget !== null) return this.game.open(openTarget)
    const closeTarget = afterPrefix(cmd, CLOSE_PREFIXES)
    if (closeTarget !== null) return this.game.close(closeTarget)

    const castArgs = afterPrefix(cmd, CAST_PREFIXES)
    if (castArgs !== null) return this.game.cast(castArgs)
    if (SPELLS_VERBS.includes(cmd)) return this.game.spells()

    if (SAVE_VERBS.includes(cmd)) return this.game.save()
    const saveName = afterPrefix(cmd, SAVE_PREFIXES)
    if (saveName !== null) return this.game.save(saveName.trim())
    if (LOAD_VERBS.includes(cmd)) return this.game.load()
    const loadName = afterPrefix(cmd, LOAD_PREFIXES)
    if (loadName !== null) return this.game.load(loadName.trim())
    if (HELP_VERBS.includes(cmd)) return this.game.help()
    if (HINT_VERBS.includes(cmd)) return this.game.hint()
    if (QUIT_VERBS.includes(cmd)) return this.game.quit()

    if (REST_VERBS.includes(cmd)) return this.game.rest()
    if (MAP_VERBS.includes(cmd)) return this.game.map()
    if (STATS_VERBS.includes(cmd)) return this.game.stats()
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
    const word = afterPrefix(cmd, GO_PREFIXES) ?? cmd
    if (word === cmd) {
      const long = SHORT_DIRECTIONS[word] ?? word
      return (DIRECTIONS as readonly string[]).includes(long) ? long : null
    }
    if (cmd.startsWith(GO_PREFIXES[0])) return word.trim()
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
    const tail = command.trim().slice(USE_PREFIXES[0].length)
    const stripped = tail.trim()
    if (!stripped) return 'What do you want to use?'
    if (tail.toLowerCase().trimEnd().endsWith(USE_WITH.trimEnd()))
      return USE_WITH_USAGE
    const lower = stripped.toLowerCase()
    // "on" reads the same as "with" when the command has no "with"
    const joiner = lower.includes(USE_WITH) ? USE_WITH : USE_ON
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
