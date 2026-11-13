/**
 * The grammar of the game's commands, declared once. `CommandParser` reads the
 * verbs from it, `Game.getCommandCompletions` builds the suggestion tree from
 * it and `Game.help` prints its help lines, so adding or removing a word the
 * game understands is one edit here (and the parser branch that runs it).
 */

/** What a verb is followed by, which decides the suggestions after it. */
export type ArgumentKind =
  /** Nothing: the verb is the whole command. */
  | 'none'
  /** One of the open exits of the room. */
  | 'exit'
  /** An item in the room or the pack. */
  | 'item'
  /** An item lying in the room. */
  | 'roomItem'
  /** An item in the pack. */
  | 'inventoryItem'
  /** An item or a character here. */
  | 'thing'
  /** A character here. */
  | 'character'
  /** A spell the player knows. */
  | 'spell'
  /** The player's own words (not listable), or a save name. */
  | 'text'

/** A word that joins a verb's first argument to a second one ("give X to Y"). */
export interface VerbJoin {
  /** The joining words the parser accepts, such as `with` and `on`. */
  words: readonly string[]
  /** What follows the joining word. */
  argument: ArgumentKind
  /** Whether the command may be sent without the second argument ('use rope'). */
  optional: boolean
}

/** One command shape: its verbs, what follows them and how help shows it. */
export interface VerbForm {
  /** The words that start the command; a verb may hold several words ("pick up"). */
  verbs: readonly string[]
  /** What the verb takes, or `none` for a bare command. */
  argument: ArgumentKind
  /** The words that join a second argument to the first, if the command has one. */
  joins?: VerbJoin
  /** The help section the form is listed under. */
  group: string
  /** The help lines (without indentation) that show the form. */
  help: readonly string[]
}

/** The directions the parser accepts, in the order a room lists its exits. */
export const DIRECTIONS = [
  'north',
  'south',
  'east',
  'west',
  'up',
  'down',
] as const

/** The one-letter directions: the letter the parser turns into the direction. */
export const SHORT_DIRECTIONS: Readonly<Record<string, string>> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
}

/** The help sections in the order the help screen lists them. */
export const HELP_GROUPS = [
  'Movement',
  'Interaction',
  'Examination',
  'Inventory Management',
  'Magic',
  'Game Management',
  'Miscellaneous',
] as const

/** Every command shape the parser accepts, in the order help lists them. */
export const VERB_FORMS: readonly VerbForm[] = [
  {
    verbs: ['go', 'move'],
    argument: 'exit',
    group: 'Movement',
    help: [
      'go <direction>, move <direction>, <direction>, <short_direction> ' +
        '(e.g., go north, , move north, north, n)',
    ],
  },
  {
    verbs: ['talk to', 'speak to', 'converse with'],
    argument: 'character',
    group: 'Interaction',
    help: [
      'talk to <character>, speak to <character>, converse with <character>',
    ],
  },
  {
    verbs: ['say'],
    argument: 'text',
    group: 'Interaction',
    help: ['say <word(s)> to <character>'],
  },
  {
    verbs: ['give', 'hand'],
    argument: 'inventoryItem',
    joins: { words: ['to'], argument: 'character', optional: false },
    group: 'Interaction',
    help: ['give <item> to <character>, hand <item> to <character>'],
  },
  {
    verbs: ['buy'],
    argument: 'roomItem',
    joins: { words: ['from'], argument: 'character', optional: false },
    group: 'Interaction',
    help: ['buy <item> from <character>'],
  },
  {
    verbs: ['look', 'observe', 'survey', 'l'],
    argument: 'none',
    group: 'Examination',
    help: ['look, observe, survey, l'],
  },
  {
    verbs: ['look at', 'inspect', 'examine', 'check'],
    argument: 'thing',
    group: 'Examination',
    help: [
      'look at <object>, inspect <object>, examine <object>, check <object>',
    ],
  },
  {
    verbs: ['search', 'investigate'],
    argument: 'none',
    group: 'Examination',
    help: ['search, investigate'],
  },
  {
    verbs: ['take', 'pick up', 'grab', 'get'],
    argument: 'roomItem',
    group: 'Inventory Management',
    help: ['take <item>, pick up <item>, grab <item>, get <item>'],
  },
  {
    verbs: ['use'],
    argument: 'item',
    joins: { words: ['with', 'on'], argument: 'thing', optional: true },
    group: 'Inventory Management',
    help: ['use <item>, use <item> with <item>'],
  },
  {
    verbs: ['inventory', 'i', 'inv'],
    argument: 'none',
    group: 'Inventory Management',
    help: ['inventory, i, inv'],
  },
  {
    verbs: ['open'],
    argument: 'item',
    group: 'Inventory Management',
    help: ['open <container>'],
  },
  {
    verbs: ['close'],
    argument: 'item',
    group: 'Inventory Management',
    help: ['close <container>'],
  },
  {
    verbs: ['cast'],
    argument: 'spell',
    joins: { words: ['on'], argument: 'thing', optional: true },
    group: 'Magic',
    help: ['cast <spell>', 'cast <spell> on <object/character>'],
  },
  {
    verbs: ['spells'],
    argument: 'none',
    group: 'Magic',
    help: ['spells'],
  },
  {
    verbs: ['save'],
    argument: 'text',
    group: 'Game Management',
    help: ['save [name], load [name]'],
  },
  {
    verbs: ['load'],
    argument: 'text',
    group: 'Game Management',
    help: [],
  },
  {
    verbs: ['help', '?'],
    argument: 'none',
    group: 'Game Management',
    help: ['help, ?'],
  },
  {
    verbs: ['quit', 'exit'],
    argument: 'none',
    group: 'Game Management',
    help: ['quit, exit'],
  },
  {
    verbs: ['sleep', 'rest', 'wait'],
    argument: 'none',
    group: 'Miscellaneous',
    help: ['sleep, rest, wait'],
  },
  {
    verbs: ['hint'],
    argument: 'none',
    group: 'Miscellaneous',
    help: ['hint'],
  },
  {
    verbs: ['map'],
    argument: 'none',
    group: 'Miscellaneous',
    help: ['map'],
  },
  {
    verbs: ['stats'],
    argument: 'none',
    group: 'Miscellaneous',
    help: ['stats'],
  },
]

/** The form that has `verb` among its verbs; throws for a verb the grammar lacks. */
export function formOf(verb: string): VerbForm {
  const form = VERB_FORMS.find((candidate) => candidate.verbs.includes(verb))
  if (form === undefined) throw new Error(`No grammar for "${verb}"`)
  return form
}

/** The verbs of the form `verb` belongs to, each followed by a space, for prefix matching. */
export function prefixesOf(verb: string): string[] {
  return formOf(verb).verbs.map((word) => `${word} `)
}

/** The help screen, built from the forms' help lines. */
export function helpText(): string {
  const sections = HELP_GROUPS.map((group) => {
    const lines = VERB_FORMS.filter((form) => form.group === group).flatMap(
      (form) => form.help,
    )
    return `[bold]${group}:[/bold]\n` + lines.map((l) => `  ${l}\n`).join('')
  })
  return '[bold]Available Commands:[/bold]\n\n' + sections.join('\n')
}

/** The verb that also examines when a thing follows it: "look rope" reads as "look at rope". */
export const EXAMINE_SHORTHAND = 'look'
