import { describe, expect, it } from 'vitest'
import { CommandParser, type CommandTarget } from './CommandParser'
import {
  DIRECTIONS,
  SHORT_DIRECTIONS,
  VERB_FORMS,
  helpText,
  prefixesOf,
} from './Grammar'

/** A target that answers every call with the name of the method called. */
function recordingTarget(): CommandTarget {
  return new Proxy({ state: { settleQuests: () => ({}) } } as CommandTarget, {
    get: (target, name) =>
      name in target ? Reflect.get(target, name) : () => String(name),
  })
}

describe('Grammar', () => {
  it('every declared verb is understood by the parser', () => {
    const parser = new CommandParser(recordingTarget())
    for (const form of VERB_FORMS) {
      for (const verb of form.verbs) {
        const command =
          form.argument === 'none'
            ? verb
            : form.argument === 'exit'
              ? `${verb} north`
              : `${verb} thing`
        expect(parser.parse(command), command).not.toBe('unknown')
      }
    }
  })

  it('every direction and one-letter direction is understood by the parser', () => {
    const parser = new CommandParser(recordingTarget())
    for (const word of [...DIRECTIONS, ...Object.keys(SHORT_DIRECTIONS)]) {
      expect(parser.parse(word), word).toBe('move')
    }
  })

  it('prefixesOf lists every verb of a form with a trailing space', () => {
    expect(prefixesOf('pick up')).toEqual([
      'take ',
      'pick up ',
      'grab ',
      'get ',
    ])
  })

  it('builds the help screen the player has always seen', () => {
    expect(helpText()).toBe(
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
        '  sleep, rest, wait\n' +
        '  hint\n' +
        '  map\n' +
        '  stats\n',
    )
  })
})
