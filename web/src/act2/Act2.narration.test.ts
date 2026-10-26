import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { parseTurn } from '@/lantern/parseTurn'
import { Act2 } from './Act2'
import { ACT2_GOLDEN_PATH } from './Act2GoldenPath'
import { MendSpell } from './spells/MendSpell'
import { DispelSpell } from './spells/DispelSpell'
import { Coins } from './items/Coins'
import { GreendaleGates } from './rooms/GreendaleGates'

/** Grey event lines that may stay: markers, never the echo of a command. */
const MARKER = /^(✦ |You move |.*this will be remembered)/

/** Event lines of the answers to the Act II golden path that are not markers. */
function echoes(): string[] {
  const game = new Game([new Act2()])
  const found: string[] = []
  for (const command of ACT2_GOLDEN_PATH) {
    const answer = game.commandParser.parse(command)
    game.state.settleQuests()
    for (const block of parseTurn(answer)) {
      if (block.kind !== 'event') continue
      const plain = block.markup.replace(/\[\/?[a-z_]+\]/g, '')
      if (!MARKER.test(plain)) found.push(`${command} => ${plain}`)
    }
  }
  return found
}

describe('Act II narrates the effect of every action', () => {
  it('keeps only markers as grey lines on the golden path', () => {
    expect(echoes()).toEqual([])
  })
})

/** Every non-test source file under `dir`, with its text. */
function sources(dir: string): { file: string; text: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sources(path)
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts'))
      return []
    return [{ file: path, text: readFileSync(path, 'utf8') }]
  })
}

/** The kinds of the blocks that answer `command`; a narrated failure is a `clue`. */
function kinds(game: Game, command: string): string[] {
  return parseTurn(game.commandParser.parse(command)).map((block) =>
    block.kind === 'failure' && block.narrated ? 'clue' : block.kind,
  )
}

describe('Act II keeps grey lines for markers only', () => {
  it('has no event() call in its content', () => {
    const offenders = sources(__dirname)
      .filter(({ text }) => /\bevent\(/.test(text))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it('answers a second inn search with a silent red box and nothing else', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.InnRooms
    expect(kinds(game, 'search')).toEqual(['text'])
    expect(kinds(game, 'search')).toEqual(['failure'])
  })

  it('reads a world-carrying refusal and keeps a bare "already" silent', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    expect(kinds(game, 'search')).toEqual(['clue'])
  })

  it('answers a mend with nothing to mend as one green line, without the cast echo', () => {
    const game = new Game([new Act2()])
    game.state.learnSpell(new MendSpell())
    const answer = game.commandParser.parse('cast mend')
    expect(answer).not.toContain('You cast')
    expect(answer).toContain('finds nothing that needs mending nearby')
  })
})

describe('Act II shops, spells and repeats', () => {
  /** A game in `room` with `coins` coins and the shop open. */
  function shopGame(room: string): Game {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms[room]
    return game
  }

  it('sells the room key in one read sentence and names Marcus', () => {
    const game = shopGame('SilverStagInn')
    for (let i = 0; i < 10; i++) game.state.addItemToInventory(new Coins())
    const answer = game.commandParser.parse(
      'buy room key from innkeeper marcus',
    )
    expect(answer).toContain('is yours for 10')
    expect(answer).toContain(
      '[character_name]Marcus[/character_name] hands you',
    )
    expect(answer).not.toContain('remaining')
    expect(answer).not.toContain('You purchase')
  })

  it('refuses a buyer without coins in one read red box', () => {
    const game = shopGame('SilverStagInn')
    const answer = game.commandParser.parse(
      'buy room key from innkeeper marcus',
    )
    expect(kinds(game, 'buy room key from innkeeper marcus')).toEqual(['clue'])
    expect(answer).toContain("You don't have enough coins for that.")
  })

  it('attributes a shopkeeper refusal to the shopkeeper', () => {
    const game = shopGame('SilverStagInn')
    const turn = parseTurn(
      game.commandParser.parse('buy sword from innkeeper marcus'),
    )
    const speech = turn.find((block) => block.kind === 'dialogue')
    expect(speech?.kind === 'dialogue' && speech.speaker).toBe(
      'innkeeper marcus',
    )
  })

  it('casts every spell on anyone with one fixed sentence and no cast echo', () => {
    const game = shopGame('MarketDistrict')
    game.state.learnSpell(new DispelSpell())
    const answer = game.commandParser.parse(
      'cast dispel on master merchant aldric',
    )
    expect(answer).not.toContain('You cast')
    expect(answer).toContain('Counter-magic flows outward')
  })

  it('answers a second search at the gates with a silent red box', () => {
    const game = shopGame('GreendaleGates')
    const gates = game.state.currentRoom
    if (!(gates instanceof GreendaleGates)) throw new Error('not the gates')
    gates.gateCaptain.entryPassGiven = true
    expect(kinds(game, 'search')).not.toContain('failure')
    expect(kinds(game, 'search')).toEqual(['failure'])
  })
})
