/**
 * The game: its acts, the run-state machine (logo, act intro, act running,
 * act transition, game over), every player command, command completion and save/load.
 */
import type { MusicInfo } from './GameController'
import type { Act } from './Act'
import { Character } from './Character'
import { ClassRegistry } from './ClassRegistry'
import { CommandParser, type CommandTarget } from './CommandParser'
import { GameState } from './GameState'
import { Item } from './Item'
import { Quest } from './Quest'
import { Room } from './Room'
import { deserialize, serialize, type SerializedGraph } from './Serializer'
import { Spell } from './Spell'

export const GameRunState = {
  ShowLogo: 'show_logo',
  ActIntro: 'act_intro',
  ActRunning: 'act_running',
  ActTransition: 'act_transition',
  /** The last act is complete: the game stays in it and takes no input. */
  GameOver: 'game_over',
} as const
export type GameRunState = (typeof GameRunState)[keyof typeof GameRunState]

/** Nested completion tokens: a subtree for more tokens, null for a last token. */
export type CompletionTree = { [token: string]: CompletionTree | null }

/** Where named saves go. `write`/`read` may throw when storage is unavailable. */
export interface SaveStorage {
  write(name: string, data: string): void
  read(name: string): string | null
}

export class MemorySaveStorage implements SaveStorage {
  private readonly saves = new Map<string, string>()

  write(name: string, data: string): void {
    this.saves.set(name, data)
  }

  read(name: string): string | null {
    return this.saves.get(name) ?? null
  }
}

export interface GameOptions {
  saveStorage?: SaveStorage
}

/** The JSON a save holds. */
interface SavePayload {
  version: 3
  actIndex: number
  state: SerializedGraph
}

const SAVE_VERSION = 3
const DEFAULT_SAVE_NAME = 'retroquest'
const SAVE_NAME = /^[a-z0-9_-]+$/
const INVALID_SAVE_NAME =
  '[failure]Invalid save name. Use only letters, digits, hyphens, and underscores.[/failure]'
const CARDINAL_DIRECTIONS = ['north', 'south', 'east', 'west'] as const

const ENGINE_CLASSES = { GameState, Item, Character, Spell, Quest, Room }

export class Game implements CommandTarget {
  isRunning = true
  readonly acts: Act[]
  currentAct = 0
  state: GameState
  /**
   * The state of the act that just ended, kept until the next act's intro so
   * UIs can still report the quest completion that ended it.
   */
  finishedActState: GameState | null = null
  readonly commandParser: CommandParser
  /** True when the room should be described again after the command. */
  hasChangedRoom = false
  runState: GameRunState = GameRunState.ShowLogo
  acceptInput = false
  commandResult = ''
  /** Every class a save may contain: the engine's and each act's (`Act1.Bread`). */
  readonly registry: ClassRegistry
  private readonly saveStorage: SaveStorage

  constructor(acts: Act[], { saveStorage }: GameOptions = {}) {
    this.acts = acts
    this.state = this.freshState()
    this.commandParser = new CommandParser(this)
    this.saveStorage = saveStorage ?? new MemorySaveStorage()
    this.registry = new ClassRegistry().registerAll(ENGINE_CLASSES)
    for (const act of acts) {
      for (const [name, cls] of Object.entries(act.classes)) {
        this.registry.register(`${act.name}.${name}`, cls)
      }
    }
  }

  /**
   * A new state for the current act, starting in its first room, holding the
   * given virtues carried over from the act before.
   */
  private freshState(virtues: string[] = []): GameState {
    const act = this.acts[this.currentAct]
    const startingRoom = Object.values(act.rooms)[0]
    const state = new GameState(startingRoom, act.rooms, act.quests)
    state.virtues = [...virtues]
    act.setupGameState(state)
    return state
  }

  /** Advance the run state by one turn. */
  newTurn(): void {
    switch (this.runState) {
      case GameRunState.ShowLogo:
        this.runState = GameRunState.ActIntro
        this.acceptInput = false
        break
      case GameRunState.ActIntro:
        this.runState = GameRunState.ActRunning
        this.acceptInput = true
        this.hasChangedRoom = true
        break
      case GameRunState.ActRunning:
        if (this.acts[this.currentAct].isCompleted(this.state)) {
          if (this.currentAct + 1 < this.acts.length) {
            this.currentAct++
            this.runState = GameRunState.ActTransition
            this.acceptInput = false
            this.finishedActState = this.state
            this.state = this.freshState(this.state.virtues)
            this.hasChangedRoom = true
          } else {
            this.runState = GameRunState.GameOver
            this.isRunning = false
            this.acceptInput = false
          }
        }
        break
      case GameRunState.GameOver:
        break
      case GameRunState.ActTransition:
        this.runState = GameRunState.ActIntro
        this.acceptInput = false
        this.finishedActState = null
        break
    }
  }

  /**
   * The state of the act the player is being shown: the finished act during
   * a transition, the current act otherwise (also after game over).
   */
  presentedState(): GameState {
    return this.finishedActState ?? this.state
  }

  /** Zero-based index of the act `presentedState` belongs to. */
  presentedActIndex(): number {
    return this.finishedActState ? this.currentAct - 1 : this.currentAct
  }

  /**
   * The presented act's music once it runs, and still after game over; empty
   * before that so nothing plays early.
   */
  presentedMusic(): MusicInfo {
    if (!this.isActRunning() && !this.isGameOver())
      return { musicFile: '', musicInfo: '' }
    const act = this.acts[this.presentedActIndex()]
    return { musicFile: act.musicFile, musicInfo: act.musicInfo }
  }

  /** The text to show for the current run state. */
  getResultText(): string {
    switch (this.runState) {
      case GameRunState.ShowLogo:
        return this.getAsciiLogo()
      case GameRunState.ActIntro:
        return this.getActIntro()
      case GameRunState.ActRunning:
        return this.commandResult
      case GameRunState.ActTransition:
      case GameRunState.GameOver:
        return `${this.commandResult}\n\n${this.actCompleteBody()}\n`
    }
  }

  /**
   * The act-complete message of the transition and game-over screens: the
   * finished act's hook, if it has one, then the words every act shares.
   */
  private actCompleteBody(): string {
    const hook = this.acts[this.presentedActIndex()].getCompletionHook(
      this.presentedState(),
    )
    return (hook ? `${hook}\n\n` : '') + this.sharedActCompleteWords()
  }

  /** The words every act-complete page shares. */
  private sharedActCompleteWords(): string {
    return this.runState === GameRunState.GameOver
      ? `Congratulations — you have completed Act ${this.currentAct + 1}, ` +
          'the final act of RetroQuest!'
      : `Congratulations — you have completed Act ${this.currentAct}!\n\n` +
          'Take a moment to catch your breath and grab a cup of coffee. ' +
          `Get ready for Act ${this.currentAct + 1}, where new challenges, ` +
          'characters, and mysteries await.'
  }

  /**
   * The act-complete text (without the act's last answer) while a transition
   * or the game-over screen shows; null in every other state.
   */
  getActCompleteText(): string | null {
    return this.runState === GameRunState.ActTransition ||
      this.runState === GameRunState.GameOver
      ? this.actCompleteBody()
      : null
  }

  /** Run the player's command when the act is running; ignored otherwise. */
  handleInput(data: string): void {
    this.commandResult =
      this.runState === GameRunState.ActRunning
        ? this.commandParser.parse(data)
        : ''
  }

  isActRunning(): boolean {
    return this.runState === GameRunState.ActRunning
  }

  isActTransitioning(): boolean {
    return this.runState === GameRunState.ActTransition
  }

  /** True once the last act is complete: the game is over. */
  isGameOver(): boolean {
    return this.runState === GameRunState.GameOver
  }

  isActIntroShowing(): boolean {
    return this.runState === GameRunState.ActIntro
  }

  getAsciiLogo(): string {
    return (
      `
Welcome to
[bold yellow]
########  ######### ######## ########   #######   #######  ##     ## #########  #######  ########
##     ## ##           ##    ##     ## ##     ## ##     ## ##     ## ##        ##           ##
##     ## ##           ##    ##     ## ##     ## ##     ## ##     ## ##        ##           ##
########  #########    ##    ########  ##     ## ##     ## ##     ## #########  #######     ##
##   ##   ##           ##    ##   ##   ##     ## ##  ## ## ##     ## ##               ##    ##
##    ##  ##           ##    ##    ##  ##     ## ##   #### ##     ## ##        ##     ##    ##
##     ## #########    ##    ##     ##  #######   #######   #######  #########  #######     ##
[/bold yellow]
[bold]Music track:[/bold] ` + this.acts[this.currentAct].musicInfo
    )
  }

  getActIntro(): string {
    return this.acts[this.currentAct].getActIntro()
  }

  /** 'Act 1', 'Act 2', … */
  getActName(): string {
    return `Act ${this.currentAct + 1}`
  }

  /** Completion tokens for the commands possible right now. */
  getCommandCompletions(): CompletionTree {
    const room = this.state.currentRoom
    const names = (items: Item[]): string[] => [
      ...items.map((item) => item.name.toLowerCase()),
      ...items
        .filter((item) => item.shortName)
        .map((item) => item.shortName.toLowerCase()),
    ]
    const allItemNames = names([...room.items, ...this.state.inventory])
    const inventoryItemNames = names(this.state.inventory)
    const roomItemNames = names(room.items)
    const characterNames = room.characters.map((c) => c.name.toLowerCase())
    const spellNames = this.state.knownSpells.map((s) => s.name.toLowerCase())
    const exits = room.getExits(this.state)
    const exitNames = leaves(Object.keys(exits))

    const directional: CompletionTree = {}
    for (const direction of CARDINAL_DIRECTIONS) {
      if (direction in exits) directional[direction[0]] = null
    }
    for (const direction of CARDINAL_DIRECTIONS) {
      if (direction in exits) directional[direction] = null
    }

    const itemsAndCharacters = {
      ...nested(allItemNames),
      ...nested(characterNames),
    }
    const withCharacters = (
      keys: string[],
      preposition: string,
    ): CompletionTree =>
      Object.fromEntries(
        keys.map((k) => [k, { [preposition]: nested(characterNames) }]),
      )
    const withTarget = (keys: string[], preposition: string): CompletionTree =>
      Object.fromEntries(
        keys.map((k) => [k, { '@': null, [preposition]: itemsAndCharacters }]),
      )

    const completions: CompletionTree = {
      go: exitNames,
      move: exitNames,
      ...directional,
      talk: { to: nested(characterNames) },
      speak: { to: nested(characterNames) },
      converse: { with: nested(characterNames) },
      give: withCharacters(inventoryItemNames, 'to'),
      hand: nested(inventoryItemNames),
      buy: withCharacters(roomItemNames, 'from'),
      look: { '@': null, at: itemsAndCharacters, ...itemsAndCharacters },
      l: null,
      observe: null,
      survey: null,
      inspect: itemsAndCharacters,
      examine: itemsAndCharacters,
      check: itemsAndCharacters,
      read: nested(allItemNames),
      search: null,
      investigate: null,
      take: nested(roomItemNames),
      pick: { up: nested(roomItemNames) },
      grab: nested(roomItemNames),
      get: nested(roomItemNames),
      drop: nested(inventoryItemNames),
      discard: nested(inventoryItemNames),
      use: withTarget(allItemNames, 'with'),
      inventory: null,
      i: null,
      inv: null,
      open: nested(allItemNames),
      close: nested(allItemNames),
      cast: withTarget(spellNames, 'on'),
      spells: null,
      save: null,
      load: null,
      help: null,
      '?': null,
      quit: null,
      exit: null,
      sleep: null,
      rest: null,
      map: null,
      stats: null,
    }
    return splitMultiwordKeys(completions)
  }

  /** The character with the name in the current room, or null. */
  findCharacter(target: string): Character | null {
    return this.state.currentRoom.getCharacterByName(target)
  }

  /**
   * The first item named by full or short name, looking in the inventory
   * first and then in the room, or null.
   */
  findItem(
    target: string,
    { inventory = true, room = true } = {},
  ): Item | null {
    return this.state.findItem(target, { inventory, room })
  }

  /** Every item named by full or short name, inventory first, then the room. */
  findAllItems(target: string, { inventory = true, room = true } = {}): Item[] {
    return this.state.findItems(target, { inventory, room })
  }

  move(direction: string): string {
    const room = this.state.currentRoom
    const exits = room.getExits(this.state)
    // Greendale's Main Square: without the city map the player gets lost.
    if (
      room.name === 'Main Square' &&
      !this.state.getStoryFlag('used_city_map') &&
      direction !== 'south' &&
      Object.hasOwn(room.exits, direction)
    ) {
      return (
        "[event]You wander through Greendale's winding streets, but without a proper " +
        'map to guide you, you quickly become lost in the maze of alleys and ' +
        'buildings. Eventually, you find your way back to the Main Square, ' +
        'feeling disoriented.[/event]'
      )
    }
    if (!(direction in exits))
      return (
        room.blockedExit(this.state, direction) ??
        "[failure]You can't go that way.[/failure]"
      )
    const next = this.state.allRooms[exits[direction]]
    if (!next)
      return '[failure]That exit leads nowhere (room not found).[/failure]'
    this.state.currentRoom = next
    next.onEnter(this.state)
    this.state.markVisited(next)
    this.hasChangedRoom = true
    return (
      `[event]You move ${direction} to [room_name]${next.name}[/room_name].[/event]\n\n` +
      next.enterText(this.state)
    )
  }

  help(): string {
    return (
      '[bold]Available Commands:[/bold]\n' +
      '\n' +
      '[bold]Movement:[/bold]\n' +
      '  go <direction>, move <direction>, <direction>, <short_direction> ' +
      '(e.g., go north, , move north, north, n)\n' +
      '\n' +
      '[bold]Interaction:[/bold]\n' +
      '  talk to <character>, speak to <character>, converse with <character>\n' +
      '  say <word(s)> to <character>\n' +
      '  give <item> to <character>, hand <item> to <character>\n' +
      '  buy <item> from <character>\n' +
      '\n' +
      '[bold]Examination:[/bold]\n' +
      '  look, observe, survey, l\n' +
      '  look at <object>, inspect <object>, examine <object>, check <object>\n' +
      '  search, investigate\n' +
      '\n' +
      '[bold]Inventory Management:[/bold]\n' +
      '  take <item>, pick up <item>, grab <item>, get <item>\n' +
      '  drop <item>, discard <item>\n' +
      '  use <item>, use <item> with <item>\n' +
      '  inventory, i, inv\n' +
      '  open <container>\n' +
      '  close <container>\n' +
      '\n' +
      '[bold]Magic:[/bold]\n' +
      '  cast <spell>\n' +
      '  cast <spell> on <object/character>\n' +
      '  spells\n' +
      '\n' +
      '[bold]Game Management:[/bold]\n' +
      '  save [name], load [name]\n' +
      '  help, ?\n' +
      '  quit, exit\n' +
      '\n' +
      '[bold]Miscellaneous:[/bold]\n' +
      '  sleep, rest\n' +
      '  map\n' +
      '  stats\n'
    )
  }

  look(): string {
    this.hasChangedRoom = true
    return '[event]You take a look at your surroundings.[/event]\n\n'
  }

  examine(target: string): string {
    if (!target) return 'Examine what?'
    const item = this.findItem(target)
    if (item) return item.examine(this.state)
    const character = this.findCharacter(target)
    if (character) return character.examine(this.state)
    return `You don't see any '${target}' here.`
  }

  /** The visited rooms and their exits. */
  map(): string {
    const visited = Object.values(this.state.allRooms).filter((room) =>
      this.state.visitedRooms.includes(room.name),
    )
    if (visited.length === 0) return 'No rooms visited yet.'
    const output = ['[bold]Visited Rooms and Exits:[/bold]']
    for (const room of visited) {
      output.push(`- [room_name]${room.name}[/room_name]:`)
      const exits = Object.entries(room.getExits(this.state))
      if (exits.length === 0) output.push('    No exits')
      for (const [direction, key] of exits) {
        const destination =
          room.exitLabel(this.state, direction) ??
          this.state.allRooms[key]?.name ??
          key
        output.push(`    ${direction} -> [room_name]${destination}[/room_name]`)
      }
    }
    return output.join('\n')
  }

  /**
   * The golden path of the act named `Act<actNumber>` (the acts' naming
   * convention, so single-act games work too); empty when there is none.
   */
  goldenPath(actNumber: number): string[] {
    const name = `Act${actNumber}`
    return this.acts.find((act) => act.name === name)?.goldenPath ?? []
  }

  unknown(command: string): string {
    return (
      `[failure]I don't understand the command: '${command}'. ` +
      "Try 'help' for a list of valid commands.[/failure]"
    )
  }

  quit(): string {
    this.isRunning = false
    return ''
  }

  drop(itemName: string): string {
    const item = this.findItem(itemName, { room: false })
    if (!item)
      return `[failure]You don't have a '${itemName}' to drop.[/failure]`
    this.state.inventory.splice(this.state.inventory.indexOf(item), 1)
    this.state.currentRoom.items.push(item)
    return `You drop the [item_name]${item.name}[/item_name].`
  }

  /** Take every item with the name from the room; some may refuse. */
  take(itemName: string): string {
    const candidates = this.findAllItems(itemName, { inventory: false })
    if (candidates.length === 0) {
      return `[failure]There is no '${itemName}' here to take.[/failure]`
    }
    const taken: [Item, string][] = []
    const prevented: string[] = []
    for (const item of candidates) {
      const refusal = item.preventPickup()
      if (refusal) {
        prevented.push(refusal)
        continue
      }
      const room = this.state.currentRoom
      room.items.splice(room.items.indexOf(item), 1)
      this.state.inventory.push(item)
      taken.push([item, item.pickedUp(this.state)])
    }
    const responses: string[] = []
    if (taken.length === 1) {
      const [item, message] = taken[0]
      const event = `[event]You take the [item_name]${item.name}[/item_name].[/event]`
      responses.push(message ? `${event} ${message}` : event)
    } else if (taken.length > 1) {
      const name = taken[0][0].name
      responses.push(
        `[event]You take ${taken.length} [item_name]${name}[/item_name].[/event]`,
      )
      responses.push(...taken.map(([, message]) => message).filter(Boolean))
    }
    responses.push(...prevented)
    return responses.join('\n')
  }

  inventory(): string {
    if (this.state.inventory.length === 0) return 'Your inventory is empty.'
    const lines = this.state.inventory.map(
      (item) => `- [item_name]${item.name}[/item_name]`,
    )
    return ['[bold]You are carrying:[/bold]', ...lines].join('\n')
  }

  talk(target: string): string {
    if (!target) return '[failure]Talk to whom?[/failure]'
    const character = this.findCharacter(target)
    if (character) return character.talkTo(this.state)
    return (
      `[failure]There is no character named ` +
      `'[character_name]${target}[/character_name]' here to talk to.[/failure]`
    )
  }

  say(words: string, characterName: string): string {
    if (!words) return '[failure]What do you want to say?[/failure]'
    if (!characterName)
      return '[failure]Who do you want to say that to?[/failure]'
    const character = this.findCharacter(characterName)
    if (character) return character.sayTo(this.state, words)
    return (
      `[failure]There is no character named ` +
      `'[character_name]${characterName}[/character_name]' here to speak to.[/failure]`
    )
  }

  /** Split "<target1> <delimiter> <target2>"; a failure text when it does not fit. */
  private splitCommand(
    args: string,
    command: string,
    delimiter: string,
  ): [string, string] | string {
    const parts = args.toLowerCase().split(/\s+/).filter(Boolean)
    const index = parts.indexOf(delimiter)
    if (index < 0) {
      return (
        `[failure]Invalid command format. ` +
        `Please use '${command} <target1> ${delimiter} <target2>'.[/failure]`
      )
    }
    if (index === 0) return `[failure]What do you want to ${command}?[/failure]`
    const target1 = parts.slice(0, index).join(' ')
    if (index >= parts.length - 1) {
      return `[failure]Who/What should I ${command} ${target1} ${delimiter}?[/failure]`
    }
    return [target1, parts.slice(index + 1).join(' ')]
  }

  give(args: string): string {
    const split = this.splitCommand(args, 'give', 'to')
    if (typeof split === 'string') return split
    const [itemName, characterName] = split
    const item = this.findItem(itemName, { room: false })
    if (!item)
      return `[failure]You don't have any '${itemName}' to give.[/failure]`
    const character = this.findCharacter(characterName)
    if (!character) {
      return `[failure]There is no character named '${capitalize(characterName)}' here.[/failure]`
    }
    return character.giveItem(this.state, item)
  }

  buy(args: string): string {
    const split = this.splitCommand(args, 'buy', 'from')
    if (typeof split === 'string') return split
    const [itemName, characterName] = split
    const character = this.findCharacter(characterName)
    if (!character) {
      return `[failure]There is no character named '${capitalize(characterName)}' here.[/failure]`
    }
    return character.buyItem(this.state, itemName)
  }

  /** Use an item, alone or with another item or a character. */
  use(itemName: string, targetName?: string): string {
    const item = this.findItem(itemName)
    if (!item) {
      return `[failure]You don't have a '${itemName}' to use, and there isn't one here.[/failure]`
    }
    if (!targetName) return item.use(this.state)
    const other = this.findItem(targetName)
    if (!other) {
      const character = this.findCharacter(targetName)
      if (character) return item.useOnCharacter(this.state, character)
      return (
        `[failure]You don't see a '${targetName}' to use with the ` +
        `[item_name]${item.name}[/item_name].[/failure]`
      )
    }
    if (item === other) {
      return `[failure]You can't use the [item_name]${item.name}[/item_name] with itself.[/failure]`
    }
    return item.useWith(this.state, other)
  }

  /**
   * `<spell>` or `<spell> on <target>`. A spell is cast by its shown name or
   * its id (`prophetic vision` or `prophetic_vision`).
   */
  cast(args: string): string {
    const lower = args.toLowerCase()
    const split = lower.indexOf(' on ')
    const spellName = (split < 0 ? lower : lower.slice(0, split)).trim()
    const targetName =
      split < 0 ? null : lower.slice(split + ' on '.length).trim()
    const spell = this.state.knownSpells.find((s) => s.answersTo(spellName))
    if (!spell)
      return (
        this.acts[this.currentAct].unknownSpell(this.state, spellName) ??
        `[failure]You don't know any spell called '${spellName}'.[/failure]`
      )
    if (!targetName) return spell.castSpell(this.state)
    const item = this.findItem(targetName)
    if (item) return spell.castOnItem(this.state, item)
    const character = this.findCharacter(targetName)
    if (character) return spell.castOnCharacter(this.state, character)
    const named = spell.castOnName(this.state, targetName)
    if (named !== null) return named
    return (
      `[failure]You don't see a '${targetName}' to cast ` +
      `[spell_name]${spell.name}[/spell_name] on.[/failure]`
    )
  }

  /** Learn a spell; '' when it was already known. */
  learn(spell: Spell): string {
    if (this.state.knownSpells.includes(spell)) return ''
    this.state.knownSpells.push(spell)
    return `[event]You have learned the [spell_name]${spell.name}[/spell_name] spell![/event]`
  }

  spells(): string {
    if (this.state.knownSpells.length === 0)
      return "You don't know any spells yet."
    const lines = this.state.knownSpells.map(
      (spell) =>
        `  - [spell_name]${spell.name}[/spell_name]: ${spell.description}`,
    )
    return ['[bold]Known Spells:[/bold]', ...lines].join('\n')
  }

  search(): string {
    return this.state.currentRoom.search(this.state)
  }

  listen(target?: string): string {
    if (!target) return this.state.currentRoom.getAmbientSound()
    const item = this.findItem(target)
    if (item) return item.listen(this.state)
    return `[failure]You don't see a '${target}' to listen to here or in your inventory.[/failure]`
  }

  rest(): string {
    return this.state.currentRoom.rest(this.state)
  }

  open(target: string): string {
    return this.itemAction(target, 'open', (item) => item.open(this.state))
  }

  close(target: string): string {
    return this.itemAction(target, 'close', (item) => item.close(this.state))
  }

  eat(target: string): string {
    return this.itemAction(target, 'eat', (item) => item.eat(this.state))
  }

  drink(target: string): string {
    return this.itemAction(target, 'drink', (item) => item.drink(this.state))
  }

  equip(target: string): string {
    return this.itemAction(target, 'equip', (item) => item.equip(this.state))
  }

  unequip(target: string): string {
    return this.itemAction(target, 'unequip', (item) =>
      item.unequip(this.state),
    )
  }

  /** Run an action on the named item, asking for or reporting a missing one. */
  private itemAction(
    target: string,
    verb: string,
    action: (item: Item) => string,
  ): string {
    if (!target) return `[failure]${capitalize(verb)} what?[/failure]`
    const item = this.findItem(target)
    if (item) return action(item)
    return `[failure]You don't see a '${target}' to ${verb} here or in your inventory.[/failure]`
  }

  stats(): string {
    return this.state.stats()
  }

  /** Save under the name (lowercased; letters, digits, '-' and '_' only). */
  save(name = DEFAULT_SAVE_NAME): string {
    const slot = normalizeSaveName(name)
    if (slot === null) return INVALID_SAVE_NAME
    try {
      this.saveStorage.write(slot, this.toSaveData())
    } catch (error) {
      return `[failure]Failed to save game: ${message(error)}[/failure]`
    }
    return '[event]Game saved successfully.[/event]'
  }

  load(name = DEFAULT_SAVE_NAME): string {
    const slot = normalizeSaveName(name)
    if (slot === null) return INVALID_SAVE_NAME
    let data: string | null
    try {
      data = this.saveStorage.read(slot)
    } catch (error) {
      return `[failure]Failed to load game: ${message(error)}[/failure]`
    }
    if (data === null) return '[failure]No save file found.[/failure]'
    return this.loadSaveData(data)
  }

  /**
   * The current state and act as save data (JSON). After the last act ends
   * the act index is capped at the last act to keep the save loadable.
   */
  toSaveData(): string {
    const payload: SavePayload = {
      version: SAVE_VERSION,
      actIndex: Math.min(this.currentAct, this.acts.length - 1),
      state: serialize(this.state, this.registry),
    }
    return JSON.stringify(payload)
  }

  /** Restore the state and act from save data made by `toSaveData`. */
  loadSaveData(data: string): string {
    try {
      const payload = JSON.parse(data) as Partial<SavePayload>
      if (payload.version !== SAVE_VERSION || !payload.state) {
        throw new Error('unsupported save format')
      }
      if (
        typeof payload.actIndex !== 'number' ||
        !(payload.actIndex in this.acts)
      ) {
        throw new Error('unknown act')
      }
      const state = deserialize(payload.state, this.registry)
      if (!(state instanceof GameState))
        throw new Error('no game state in the save')
      this.acts[payload.actIndex].afterLoad(state)
      state.refreshQuestLogs()
      this.state = state
      this.currentAct = payload.actIndex
    } catch (error) {
      return `[failure]Failed to load game: ${message(error)}[/failure]`
    }
    return '[event]Game loaded successfully.[/event]'
  }
}

/**
 * The one save-name rule: the name trimmed and lowercased, or null when it
 * holds anything but letters, digits, hyphens and underscores.
 */
export function normalizeSaveName(name: string): string | null {
  const normalized = name.trim().toLowerCase()
  return SAVE_NAME.test(normalized) ? normalized : null
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Each name as a leaf token. */
function leaves(names: string[]): CompletionTree {
  return Object.fromEntries(names.map((name) => [name, null]))
}

/** Multi-word names as nested tokens: "old mira" -> { old: { mira: null } }. */
function nested(names: string[]): CompletionTree {
  const tree: CompletionTree = {}
  for (const name of names) {
    const parts = name.split(/\s+/).filter(Boolean)
    let node = tree
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = null
        return
      }
      let next = Object.hasOwn(node, part) ? node[part] : null
      if (!next) {
        next = {}
        node[part] = next
      }
      node = next
    })
  }
  return tree
}

/** Split multi-word keys at every level into nested tokens. */
function splitMultiwordKeys(tree: CompletionTree): CompletionTree {
  const result: CompletionTree = {}
  for (const [key, value] of Object.entries(tree)) {
    const parts = key.split(/\s+/).filter(Boolean)
    const child = value === null ? null : splitMultiwordKeys(value)
    if (parts.length <= 1) {
      result[key] = child
      continue
    }
    let node = result
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node[part] = child
        return
      }
      let next = Object.hasOwn(node, part) ? node[part] : null
      if (!next) {
        next = {}
        node[part] = next
      }
      node = next
    })
  }
  return result
}
