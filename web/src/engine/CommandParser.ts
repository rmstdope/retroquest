/**
 * Turns a typed command into a call on the game. Also holds the `cheat act N`
 * command sequences that play an act's golden path.
 */
import type { Quest } from './Quest'

const ACT_1_CHEAT_COMMANDS: string[] = [
  'use lantern',
  'take bread',
  'use journal',
  'search',
  'take faded photograph',
  'examine faded photograph',
  'talk to grandmother',
  'e',
  'talk to villager',
  'w',
  's',
  'take carrot',
  'use hoe',
  'take knife',
  's',
  'take egg',
  'take feather',
  'use bread with chicken',
  'take key',
  'n',
  'e',
  'examine well',
  'e',
  'take horseshoe',
  'talk to blacksmith',
  'give coin to blacksmith',
  'w',
  'w',
  'use hoe',
  'n',
  'e',
  'n',
  'talk to mira',
  's',
  'e',
  'buy rope from shopkeeper',
  'w',
  'take bucket',
  'talk to villager',
  'w',
  's',
  'use hoe',
  'e',
  'use bucket with well',
  's',
  'use key with door',
  'take shovel',
  'search',
  'take fishing rod',
  'take magnet',
  's',
  'use rope with mechanism',
  'take fragment',
  'e',
  'take stone',
  'talk to fisherman',
  'use rod with river',
  'give fish to fisherman',
  's',
  'use knife with vines',
  'take stick',
  's',
  'take pebble',
  's',
  'e',
  'take saw',
  'use fishing rod with magnet',
  'use stick with magnetic fishing rod',
  'w',
  'n',
  'n',
  'n',
  'w',
  'n',
  'n',
  'e',
  'give millstone fragment to blacksmith',
  'w',
  's',
  's',
  'e',
  's',
  's',
  'rest',
  'take rare flower',
  'n',
  'n',
  'w',
  'n',
  'n',
  'w',
  'n',
  'e',
  'n',
  'give rare flower to mira',
  's',
  'w',
  's',
  'e',
  'cast purify on well',
  'use extended magnetic fishing rod with well',
  'cast revive on withered carrot',
  's',
  'cast unlock on mysterious box',
  'open box',
  's',
  'e',
  's',
  's',
  'cast light',
  'n',
  'cast grow on bush',
  'take wild berries',
  's',
  's',
  'talk to priest',
  'n',
  'n',
  'n',
  'w',
  'n',
  'n',
  'e',
  'n',
  'talk to shopkeeper',
  's',
  'w',
  's',
  's',
  'e',
  's',
  's',
  's',
  'use matches with candle',
  'take locket',
  'n',
  'n',
  'n',
  'w',
  'n',
  'n',
  'w',
  'n',
  'give faded photograph to grandmother',
  'give locket to grandmother',
  'cast bless',
  's',
  'e',
  's',
  's',
  'e',
  's',
  's',
  's',
  'e',
  'give shiny ring to merchant',
]

const ACT_2_CHEAT_COMMANDS: string[] = [
  'take flower',
  'take stick',
  'talk to mountain hermit',
  'examine camp',
  'take pass',
  'n',
  'give pass to gate captain',
  'talk to gate captain',
  'search',
  'take map',
  'n',
  'use map',
  'examine city notice board',
  'talk to town crier',
  'take flyer',
  'n',
  'give pass to herald',
  'talk to castle guard captain',
  'w',
  'talk to sir cedric',
  'use training sword',
  'talk to sir cedric',
  'e',
  's',
  'e',
  'give flyer to master merchant aldric',
  'buy forest survival kit from master merchant aldric',
  'buy enhanced lantern from master merchant aldric',
  'talk to caravan master thorne',
  'n',
  'talk to innkeeper marcus',
  'talk to barmaid elena',
  'buy room key from innkeeper marcus',
  'use key with door',
  'e',
  'search',
  'take coins',
  'take journal',
  'use journal',
  'w',
  's',
  'buy quality rope from master merchant aldric',
  'w',
  'n',
  'w',
  'w',
  'give entry pass to court herald',
  "give traveler's journal to historians",
  'search',
  'e',
  'n',
  'give walking stick to families',
  'talk to local craftsmen',
  'talk to families',
  'n',
  'talk to master healer lyria',
  'give healing herbs to master healer lyria',
  's',
  'search',
  'go secret_passage',
  'cast mend on protective enchantments',
  'talk to spectral librarian',
  'use ancient chronicle',
  'take crystal focus',
  'go secret_passage',
  'n',
  'give crystal focus to master healer lyria',
  's',
  's',
  'e',
  's',
  's',
  's',
  'e',
  'examine stones',
  'talk to forest hermit',
  'use forest survival kit',
  'e',
  'take enchanted acorn',
  'use protective charm',
  'use enhanced lantern',
  'talk to forest sprites',
  's',
  'look at silver-barked tree',
  'give enchanted acorn to ancient tree spirit',
  'take silver leaves',
  'n',
  'e',
  'cast nature_sense',
  'talk to water nymphs',
  'say tree to water nymphs',
  'say water to water nymphs',
  'say ants to water nymphs',
  'take crystal-clear water',
  'take moonflowers',
  'w',
  's',
  'give moonflowers to ancient tree spirit',
  'n',
  'w',
  'w',
  'n',
  'n',
  'e',
  'n',
  'cast greater_heal on barmaid elena',
  'use crystal-clear water with barmaid elena',
  'cast dispel on barmaid elena',
  'talk to innkeeper marcus',
  's',
  'w',
  's',
  's',
  'e',
  'e',
  'cast forest_speech',
  'use quality rope with ravine',
  'w',
  'w',
  'n',
  'n',
  'e',
  'talk to caravan master thorne',
  'w',
  'n',
  'w',
  'talk to training master',
  'talk to squires',
  'search',
  "take squire's diary",
  "use squire's diary",
  'w',
  'examine secret documents',
  'give secret documents to lord commander',
  'e',
  'talk to sir cedric',
  'e',
  's',
  's',
  's',
  'e',
  'e',
  's',
  's',
  'use druidic charm with offering altar',
  'talk to nyx',
  'n',
  'n',
  'w',
  'w',
  'n',
  'n',
  'n',
  'w',
]

const ACT_3_CHEAT_COMMANDS: string[] = [
  'talk to mira',
  'examine note',
  'talk to mira',
  'examine mural',
  'take letter',
  'examine letter',
  'cast light',
  'take key',
  'n',
  'search',
  'take moon rune shards',
  'e',
  'cast purify on pillars',
  'use moon rune shards with pillars',
  'e',
  'use key with locker',
  'cast unlock on locker',
  'open locker',
  'take lantern',
  'w',
  's',
  'search',
  'use lantern with bracket',
  'use lantern with bracket',
  'use lantern with bracket',
  'cast light',
  'e',
  'talk to tide-born guardian',
  'say myself to tide-born guardian',
  'take crystal',
  'w',
  'w',
  'talk to mira',
  'talk to ash scholar',
  'examine canteen',
  'take mirror segment',
  'n',
  'search',
  'take brass mirror segment',
  'take binding resin',
  'e',
  'examine inscription',
  'examine mirror mount',
  'take brass mirror segment',
  'use brass mirror segment with mirror mount',
  'use binding resin with mirror mount',
  'cast mend on mirror mount',
  's',
  'search',
  'take ash-fern',
  'take cooled slag',
  'use cooled slag with ash-fern',
  'n',
  'e',
  'use vent stone',
  'use vent stone',
  'use vent stone',
  'use heat-ward mix',
  's',
  'rest',
  'talk to phoenix',
  'say patience to phoenix',
  'n',
  'w',
  'w',
  's',
  'talk to mira',
  'talk to mine overseer',
  'n',
  'search',
  'use key with supply crate',
  'open supply crate',
  'take reinforced braces',
  'take support straps',
  'take wedge blocks',
  'e',
  'examine rock',
  'use reinforced braces with rock',
  'use wedge blocks with rock',
  'talk to miners',
  'e',
  'examine walls',
  'take rubbings',
  'search',
  'take old oath scrolls',
  'w',
  's',
  'examine stones',
  'cast bless on stones',
  'use stones with rubbings',
  'e',
  'examine scrolls',
  'talk to ancient dragon',
  'say oath to ancient dragon',
  'take scale',
  'w',
  'w',
  'talk to mira',
  'talk to mira',
  'take elixir',
  'talk to mira',
]

const CHEAT_COMMANDS: Record<string, string[]> = {
  '1': ACT_1_CHEAT_COMMANDS,
  '2': ACT_2_CHEAT_COMMANDS,
  '3': ACT_3_CHEAT_COMMANDS,
}

/** The part of the game the parser drives (implemented by Game). */
export interface CommandTarget {
  state: {
    nextActivatedQuest(): Quest | null
    nextUpdatedQuest(): Quest | null
    nextCompletedQuest(): Quest | null
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
      const commands = CHEAT_COMMANDS[cmd.slice('cheat act '.length).trim()]
      if (commands) return this.executeCheat(commands)
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

  /** `use <item>` or `use <item> with <other>`, from the command as typed. */
  private use(command: string): string {
    const tail = command.trim().slice('use '.length)
    const stripped = tail.trim()
    if (!stripped) return 'What do you want to use?'
    if (tail.toLowerCase().trimEnd().endsWith(' with')) return USE_WITH_USAGE
    const lower = stripped.toLowerCase()
    const split = lower.indexOf(' with ')
    if (split < 0) return this.game.use(lower)
    const item = lower.slice(0, split).trim()
    const other = lower.slice(split + ' with '.length).trim()
    if (!item || !other) return USE_WITH_USAGE
    return this.game.use(item, other)
  }

  /** Run a command sequence, settling quest changes after each command. */
  private executeCheat(commands: string[]): string {
    const results: string[] = []
    for (const command of commands) {
      results.push(this.parse(command))
      while (this.game.state.nextActivatedQuest()) {
        // activate every quest whose trigger is met
      }
      while (this.game.state.nextUpdatedQuest()) {
        // drain pending updates
      }
      while (this.game.state.nextCompletedQuest()) {
        // complete every quest whose completion is met
      }
    }
    return results.join('\n')
  }
}
