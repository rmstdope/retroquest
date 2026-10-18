import { describe, it, expect } from 'vitest'
import { parseTurn } from './parseTurn'

// Real engine answers captured from Act I (talk to grandmother, search, …)
const GRANDMOTHER =
  '[event]You speak with [character_name]grandmother[/character_name].[/event]\n' +
  '[dialogue]Oh, [character_name]Elior[/character_name], my dear. The village... ' +
  "it feels a bit on edge lately, doesn't it? \n" +
  'Just... be observant, child.[/dialogue]'

const MIRA =
  '[character_name]Mira[/character_name] smiles warmly as you enter her fragrant hut. ' +
  "[dialogue]'Welcome, [character_name]Elior[/character_name]. I sense a stirring of " +
  "the old powers within you.'[/dialogue]"

// Real answers whose [event] / [success] spans run over several lines
const GRANDMOTHER_REVIVE =
  '[event]You speak with [character_name]grandmother[/character_name].[/event]\n\n' +
  '[dialogue]He thought it might be a key. Keep your eyes open, ' +
  '[character_name]Elior[/character_name].[/dialogue]\n\n' +
  '[event]As she speak of it, the words your father wrote seem to settle in your mind. \n' +
  'You feel a new understanding... You have learned the ' +
  '[spell_name]Revive[/spell_name] spell![/event]'

const ENCHANTED_ACORN =
  '[character_name]ancient tree spirit[/character_name] stirs. ' +
  "[dialogue]'You have shown respect and understanding.'[/dialogue]\n\n" +
  "[success]The tree spirit's wisdom flows into your mind, teaching you the secrets of " +
  'communication with the natural world.\n\n' +
  'You have learned the [spell_name]Forest Speech[/spell_name] spell![/success]'

const ECHO_STONES =
  '[event]You recite the resonant chant at each stone. [/event]\n' +
  '[success]The words echo and re-echo, building into a harmonious silence that ' +
  "banishes the wandering phantoms. The path to the dragon's hall now lies open.[/success]"

describe('parseTurn', () => {
  it('returns no blocks for empty or whitespace-only text', () => {
    expect(parseTurn('')).toEqual([])
    expect(parseTurn('  \n\n ')).toEqual([])
  })

  it('turns plain narration into a text block, keeping inline tags', () => {
    const raw =
      'You search the cottage thoroughly and discover a ' +
      '[item_name]faded photograph[/item_name] hidden in a drawer.'

    expect(parseTurn(raw)).toEqual([{ kind: 'text', markup: raw }])
  })

  it('splits narration lines into separate text blocks and skips blank lines', () => {
    expect(parseTurn('First line.\n\nSecond line.\n')).toEqual([
      { kind: 'text', markup: 'First line.' },
      { kind: 'text', markup: 'Second line.' },
    ])
  })

  it('recognises a line that is entirely an event', () => {
    expect(
      parseTurn('[event]You take a look at your surroundings.[/event]\n\n'),
    ).toEqual([
      { kind: 'event', markup: 'You take a look at your surroundings.' },
    ])
  })

  it('recognises a line that is entirely a failure', () => {
    expect(parseTurn("[failure]You can't go that way.[/failure]")).toEqual([
      { kind: 'failure', markup: "You can't go that way." },
    ])
  })

  it('keeps inline tags inside failures', () => {
    const raw =
      "[failure]There is no character named '[character_name]mira[/character_name]' " +
      'here to talk to.[/failure]'

    expect(parseTurn(raw)).toEqual([
      {
        kind: 'failure',
        markup:
          "There is no character named '[character_name]mira[/character_name]' " +
          'here to talk to.',
      },
    ])
  })

  it('gives dialogue the speaker named in the event line before it', () => {
    expect(parseTurn(GRANDMOTHER)).toEqual([
      {
        kind: 'event',
        markup: 'You speak with [character_name]grandmother[/character_name].',
      },
      {
        kind: 'dialogue',
        speaker: 'grandmother',
        markup:
          'Oh, [character_name]Elior[/character_name], my dear. The village... ' +
          "it feels a bit on edge lately, doesn't it? \n" +
          'Just... be observant, child.',
      },
    ])
  })

  it('splits narration and dialogue on the same line, naming the speaker', () => {
    expect(parseTurn(MIRA)).toEqual([
      {
        kind: 'text',
        markup:
          '[character_name]Mira[/character_name] smiles warmly as you enter her fragrant hut.',
      },
      {
        kind: 'dialogue',
        speaker: 'Mira',
        markup:
          "'Welcome, [character_name]Elior[/character_name]. I sense a stirring of " +
          "the old powers within you.'",
      },
    ])
  })

  it('does not take a speaker from names inside an earlier dialogue', () => {
    const raw =
      "[dialogue]'Find [character_name]Mira[/character_name],' a voice says.[/dialogue]\n" +
      "[dialogue]'Hurry.'[/dialogue]"

    const blocks = parseTurn(raw)

    expect(
      blocks.map((b) => (b.kind === 'dialogue' ? b.speaker : b.kind)),
    ).toEqual([null, null])
  })

  it('keeps narration after a dialogue on the same line', () => {
    const raw =
      "[character_name]Borin[/character_name] grunts. [dialogue]'Aye.'[/dialogue] " +
      'He returns to his anvil.'

    expect(parseTurn(raw)).toEqual([
      {
        kind: 'text',
        markup: '[character_name]Borin[/character_name] grunts.',
      },
      { kind: 'dialogue', speaker: 'Borin', markup: "'Aye.'" },
      { kind: 'text', markup: 'He returns to his anvil.' },
    ])
  })

  it('treats an unclosed dialogue as dialogue to the end', () => {
    expect(parseTurn("[dialogue]'Wait—")).toEqual([
      { kind: 'dialogue', speaker: null, markup: "'Wait—" },
    ])
  })

  it('groups consecutive success / pending lines into one checklist', () => {
    const raw =
      'Mira has tasked you with preparing for your journey. She says you will need: \n\n' +
      '[success] * Warm clothing[/success]\n' +
      '[pending] * Magical protection[/pending]\n' +
      '[success] * A map to find your way[/success]'

    expect(parseTurn(raw)).toEqual([
      {
        kind: 'text',
        markup:
          'Mira has tasked you with preparing for your journey. She says you will need:',
      },
      {
        kind: 'checklist',
        items: [
          { markup: 'Warm clothing', done: true },
          { markup: 'Magical protection', done: false },
          { markup: 'A map to find your way', done: true },
        ],
      },
    ])
  })

  it('treats a line with a tag around only part of it as text', () => {
    const raw = '[event]A door creaks.[/event] Something moves inside.'

    expect(parseTurn(raw)).toEqual([{ kind: 'text', markup: raw }])
  })

  it('keeps an event that runs over several lines as event blocks', () => {
    expect(parseTurn(GRANDMOTHER_REVIVE).slice(2)).toEqual([
      {
        kind: 'event',
        markup:
          'As she speak of it, the words your father wrote seem to settle in your mind.',
      },
      {
        kind: 'event',
        markup:
          'You feel a new understanding... You have learned the ' +
          '[spell_name]Revive[/spell_name] spell!',
      },
    ])
  })

  it('closes and reopens a span that runs over several lines', () => {
    expect(parseTurn(ENCHANTED_ACORN).slice(2)).toEqual([
      {
        kind: 'text',
        markup:
          "[success]The tree spirit's wisdom flows into your mind, teaching you the " +
          'secrets of communication with the natural world.[/success]',
      },
      {
        kind: 'text',
        markup:
          '[success]You have learned the [spell_name]Forest Speech[/spell_name] ' +
          'spell![/success]',
      },
    ])
  })

  it('trims an event and keeps a success line without a bullet as text', () => {
    expect(parseTurn(ECHO_STONES)).toEqual([
      { kind: 'event', markup: 'You recite the resonant chant at each stone.' },
      {
        kind: 'text',
        markup:
          '[success]The words echo and re-echo, building into a harmonious silence that ' +
          "banishes the wandering phantoms. The path to the dragon's hall now lies open." +
          '[/success]',
      },
    ])
  })
})
