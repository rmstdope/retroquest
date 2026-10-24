import { describe, it, expect } from 'vitest'
import { Game, dialogue } from '@/engine'
import { Act4 } from '../Act4'
import { Wound } from '../items/Wound'
import { Grow } from '../spells/Grow'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  FLAG_ACT4_FINAL_STAND_COMPLETED,
  FLAG_ACT4_JUSTICE_ENDING,
  FLAG_ACT4_REDEMPTION_ENDING,
  FLAG_ACT4_SACRIFICE_ENDING,
  VIRTUE_MERCY,
  VIRTUE_SELFLESS,
  VIRTUE_TRUTH,
} from '../Act4StoryFlags'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectMarkupWellFormed,
  expectQuestCompleted,
  expectStoryFlag,
} from '@/testing/gameHelpers'

const AMULET_STEP = ACT4_GOLDEN_PATH.indexOf('use ancient amulet') + 1

/** A game with the amulet open in the Throne Chamber and the given virtues. */
function opened(virtues: string[] = []): Game {
  const game = new Game([new Act4()])
  executeCommands(game, ACT4_GOLDEN_PATH.slice(0, AMULET_STEP))
  for (const virtue of virtues) game.state.addVirtue(virtue)
  return game
}

function reload(game: Game): void {
  expect(game.loadSaveData(game.toSaveData())).toContain(
    'Game loaded successfully.',
  )
}

const TWO_TRUTHS = [VIRTUE_TRUTH, VIRTUE_TRUTH]
const TWO_SELFLESS = [VIRTUE_SELFLESS, VIRTUE_SELFLESS]

function spellNames(game: Game): string[] {
  return game.state.knownSpells.map((s) => s.name)
}

const JUSTICE_LINE = dialogue(
  'Elior',
  "You tore the world, Malakar. You drained the king. You sent a man to hunt a child in Willowbrook, and you let Sir Cedric take the blame. I will not pretend you didn't.",
)

describe('the endings are always open', () => {
  it('breaks the prison whatever the virtue record', () => {
    for (const virtues of [[], [VIRTUE_TRUTH, VIRTUE_SELFLESS]]) {
      const game = opened(virtues)
      const text = executeCommands(game, ['use lifelight elixir on prison'])
      expect(text).toContain('Under the elixir the crystal cracks')
      expect(text).not.toContain('does not answer to one who has not yet')
    }
  })

  it('says forgiveness, justice or sacrifice only after the elixir', () => {
    for (const word of ['forgiveness', 'justice', 'sacrifice']) {
      const game = opened(TWO_TRUTHS)
      expect(executeCommands(game, [`say ${word} to malakar`])).toContain(
        'Not yet. The elixir is still in your hand.',
      )
    }
  })
})

describe('Redemption', () => {
  function healed(virtues: string[] = []): Game {
    const game = opened(virtues)
    executeCommands(game, ['use lifelight elixir on malakar'])
    return game
  }

  it('hints at something gentler, and closes the other roads', () => {
    const game = healed(TWO_TRUTHS)
    expect(executeCommands(game, ['use ancient amulet on wound'])).toContain(
      'The wound waits for something gentler than the amulet. Malakar looks up at you, as if he is waiting to hear something.',
    )
    expect(executeCommands(game, ['say justice to malakar'])).toContain(
      'Malakar has drunk the elixir. That road is closed now.',
    )
    expect(executeCommands(game, ['say sacrifice to malakar'])).toContain(
      'Malakar has drunk the elixir. That road is closed now.',
    )
    expect(executeCommands(game, ['say hello to malakar'])).toContain(
      'Malakar only waits.',
    )
  })

  it('teaches forgiveness, once, with the mercy line only after mercy', () => {
    const plain = healed()
    const text = executeCommands(plain, ['say forgiveness to malakar'])
    expect(text).toContain(dialogue('Elior', 'I forgive you.'))
    expect(text).toContain('You have learned the Forgiveness spell!')
    expect(text.startsWith(dialogue('Elior', 'I forgive you.'))).toBe(true)
    expect(text.indexOf('The words are harder')).toBeLessThan(
      text.indexOf('You have learned the Forgiveness spell!'),
    )
    expect(
      text.indexOf('You have learned the Forgiveness spell!'),
    ).toBeLessThan(text.indexOf('You would forgive me.'))
    expectMarkupWellFormed(text)
    expectDialogueSpeaker(text, 'Malakar')
    expect(text).toContain('You would forgive me. They would have too.')
    expect(text).not.toContain('You have shown mercy before')
    expect(spellNames(plain)).toContain('Forgiveness')
    expect(executeCommands(plain, ['say forgiveness to malakar'])).toContain(
      'You have said it. The wound is waiting.',
    )
    expect(
      executeCommands(plain, ['say forgiveness to malakar']),
    ).not.toContain('Elior')
    const merciful = healed([VIRTUE_MERCY])
    expect(executeCommands(merciful, ['say forgiveness to malakar'])).toContain(
      'You have shown mercy before, where none was owed.',
    )
  })

  it('refuses forgiveness cast on Malakar, and plays the ending on the wound', () => {
    const game = healed()
    executeCommands(game, ['say forgiveness to malakar'])
    expect(executeCommands(game, ['cast forgiveness on malakar'])).toContain(
      'Malakar is already forgiven. It is the wound that needs it.',
    )
    const text = executeCommands(game, ['cast forgiveness on wound'])
    expect(text).toContain('Forgiveness settles on the wound')
    expect(text).not.toContain('Then keep something.')
    expect(text).toContain('King Alden breathes again.')
    expect(text).toContain('Thank you, Elior. I will stay here')
    expect(text).toContain('Elior. Look at you. Taller than me, I think.')
    expect(text).toContain('You gave him back to us, our friend.')
    expect(text).toContain('Your parents are at rest.')
    for (const speaker of ['Malakar', 'Aren', 'Lysa']) {
      expect(text).toContain(`[character_name]${speaker}[/character_name]`)
    }
    expectStoryFlag(game.state, FLAG_ACT4_REDEMPTION_ENDING, true)
    expectStoryFlag(game.state, FLAG_ACT4_FINAL_STAND_COMPLETED, true)
    expectQuestCompleted(game.state, 'The Final Stand')
    expect(game.state.currentRoom.description).toBe(
      'The dome is quiet. Where the wound was there is only air. King Alden sits among the shards of his prison, alive, and Malakar sits beside him, himself again. Behind the throne an arch stands open on the road home.',
    )
  })

  it('stays the same after the ending and through a reload', () => {
    const game = healed()
    executeCommands(game, [
      'say forgiveness to malakar',
      'cast forgiveness on wound',
    ])
    for (const g of [game, (reload(game), game)]) {
      expect(executeCommands(g, ['talk to malakar'])).toContain(
        'Go home, Elior. Tell Mira I am sorry, and that I remember her.',
      )
      expect(executeCommands(g, ['talk to king alden'])).toContain(
        'You saved my kingdom, and somehow him as well. Go home.',
      )
      expect(executeCommands(g, ['cast forgiveness on wound'])).toContain(
        'There is no wound left to forgive.',
      )
      expect(executeCommands(g, ['say hello to malakar'])).toContain(
        'There is nothing left to say. It is over.',
      )
      expect(executeCommands(g, ['use ancient amulet'])).toContain(
        'The amulet is only a locket now, warm and quiet.',
      )
      expect(executeCommands(g, ['use ancient amulet on wound'])).toContain(
        'The wound is gone.',
      )
      expect(spellNames(g)).toContain('Forgiveness')
      expect(g.state.currentRoom.description).toContain('himself again')
      expect(executeCommands(g, ['s', 'n'])).not.toContain('Aren')
    }
  })
})

describe('Justice', () => {
  function broken(virtues: string[]): Game {
    const game = opened(virtues)
    executeCommands(game, ['use lifelight elixir on prison'])
    return game
  }

  it('always hints at both endings', () => {
    for (const virtues of [[], TWO_TRUTHS, TWO_SELFLESS]) {
      const text = executeCommands(broken(virtues), [
        'use ancient amulet on wound',
      ])
      expect(text).toContain(
        "The wound will not close for nothing. You could name Malakar's crimes and seal him away with it, in justice. Or you could give up your magic to close it, in sacrifice.",
      )
    }
  })

  it('refuses forgiveness but accepts both words with no virtues', () => {
    const game = broken([])
    expect(executeCommands(game, ['say forgiveness to malakar'])).toContain(
      'Forgiveness alone will not close it now.',
    )
    expect(executeCommands(game, ['say sacrifice to malakar'])).toContain(
      dialogue('Elior', 'Take my magic. All of it. Close the wound with that.'),
    )
    expect(executeCommands(broken([]), ['say justice to malakar'])).toContain(
      JUSTICE_LINE,
    )
  })

  it('adds Alden’s line only after two truth moments', () => {
    const line = 'You named every crime and did not add one.'
    const play = (virtues: string[]): string => {
      const game = broken(virtues)
      executeCommands(game, ['say justice to malakar'])
      return executeCommands(game, ['use ancient amulet on wound'])
    }
    const with2 = play(TWO_TRUTHS)
    const rest =
      'Then it falls to me to set right what he broke. Rest now. You have done enough.'
    expect(with2.indexOf(line)).toBeGreaterThan(with2.indexOf(rest))
    expect(with2.indexOf(line)).toBeLessThan(
      with2.indexOf('Where the wound was'),
    )
    const without = play([VIRTUE_TRUTH, ...TWO_SELFLESS])
    expect(without).not.toContain(line)
    expect(without).toContain(rest)
    expect(
      with2.replace(
        /\[character_name\]King Alden\[\/character_name\]\n\[dialogue\]You named every crime[^\n]*\n/,
        '',
      ),
    ).toBe(without)
  })

  it('plays Justice in two steps and seals Malakar away', () => {
    const game = broken(TWO_TRUTHS)
    const said = executeCommands(game, ['say justice to malakar'])
    expect(said).toContain(JUSTICE_LINE)
    expect(said).toContain("No. You won't. Your mother never could either.")
    expect(said).toContain('The open amulet grows heavy in your hand, ready.')
    expect(executeCommands(game, ['say justice to malakar'])).toContain(
      'You have said it. The amulet is waiting.',
    )
    expect(executeCommands(game, ['say sacrifice to malakar'])).toContain(
      'You have chosen. The amulet is waiting.',
    )
    const text = executeCommands(game, ['use ancient amulet on wound'])
    expect(text).toContain('Threads of gold rise from King Alden')
    expect(text).not.toContain('Then keep something.')
    expect(text).toContain('I am sorry. Tell them— no. They know.')
    const song =
      'The last of him to go is his voice, low: "…the field will wake." Then the seal is shut.'
    expect(text.indexOf(song)).toBeGreaterThan(text.indexOf('They know.'))
    expect(text.indexOf(song)).toBeLessThan(text.indexOf('Then it falls to me'))
    expect(text).toContain('Then it falls to me to set right what he broke.')
    expect(text).toContain('You named what he did, and you did not hate him')
    expectStoryFlag(game.state, FLAG_ACT4_JUSTICE_ENDING, true)
    expectQuestCompleted(game.state, 'The Final Stand')
    expect(game.state.currentRoom.description).toContain('a seal of gold')
    expect(executeCommands(game, ['talk to malakar'])).toContain(
      'Malakar is gone into the seal.',
    )
    expect(executeCommands(game, ['talk to king alden'])).toContain(
      'Go home, Elior. The kingdom will remember what you did here.',
    )
    expect(spellNames(game)).not.toContain('Forgiveness')
    expect(spellNames(game)).toContain('bless')
    reload(game)
    expect(game.state.currentRoom.description).toContain('a seal of gold')
    expect(executeCommands(game, ['say hello to malakar'])).toContain(
      'Malakar is gone into the seal.',
    )
    expect(executeCommands(game, ['use ancient amulet on wound'])).toContain(
      'The wound is gone.',
    )
  })
})

describe('Sacrifice', () => {
  it('gives the magic away, leaving only grow', () => {
    const game = opened(TWO_SELFLESS)
    executeCommands(game, ['use lifelight elixir on prison'])
    const said = executeCommands(game, ['say sacrifice to malakar'])
    expect(said).toContain(
      dialogue('Elior', 'Take my magic. All of it. Close the wound with that.'),
    )
    expect(said).not.toContain('Everything you have learned')
    expect(said).toContain(
      'No. Your parents poured themselves into that wound once already. It does not get to have you too.',
    )
    expect(said).toContain('The open amulet grows heavy in your hand, ready.')
    expect(executeCommands(game, ['say sacrifice to malakar'])).not.toContain(
      'Your parents poured themselves',
    )
    expect(spellNames(game)).toContain('bless')
    const text = executeCommands(game, ['use ancient amulet on wound'])
    const rise =
      'Malakar half rises, reaching for the amulet, and stops his own hand.'
    const keep =
      'Then keep something. One thing. Anything. Do not let me take it all.'
    const press = 'You press the open amulet to the wound and let go.'
    expect(text.startsWith(rise)).toBe(true)
    expect(text.indexOf(keep)).toBeGreaterThan(text.indexOf(rise))
    expect(text.indexOf(press)).toBeGreaterThan(text.indexOf(keep))
    expect(text).toContain(
      'When it is done, one small spell is still in you: grow, the one you did not inherit. You read it from a stone in a glade, and it was never theirs.',
    )
    expect(text).not.toContain('the smallest')
    expect(text).toContain('Your magic is gone. Only grow remains.')
    expect(text).toContain('He will answer to me, and he will live to do it.')
    expect(text).toContain(
      'You gave our gift back to close what he opened, and kept the one thing that was yours. That was always the best of you.',
    )
    expectStoryFlag(game.state, FLAG_ACT4_SACRIFICE_ENDING, true)
    expectQuestCompleted(game.state, 'The Final Stand')
    expect(spellNames(game)).toEqual(['grow'])
    expect(executeCommands(game, ['cast bless'])).toContain(
      'That magic is gone from you now.',
    )
    expect(executeCommands(game, ['talk to malakar'])).toContain(
      'You gave it all away. For them. For me.',
    )
    expect(executeCommands(game, ['talk to king alden'])).toContain(
      'Go home, farmer. You have earned your field.',
    )
    expect(game.state.currentRoom.description).toContain(
      'Malakar kneels before him, grey and powerless',
    )
    reload(game)
    expect(spellNames(game)).toEqual(['grow'])
    expect(game.state.currentRoom.description).toContain('powerless')
  })
})

describe('Sacrifice colouring', () => {
  it('adds Aren’s line only after two selfless moments', () => {
    const line = 'We watched you give, again and again'
    const lysa =
      'You gave our gift back to close what he opened, and kept the one thing that was yours. That was always the best of you.'
    const play = (virtues: string[]): string => {
      const game = opened(virtues)
      executeCommands(game, ['use lifelight elixir on prison'])
      executeCommands(game, ['say sacrifice to malakar'])
      return executeCommands(game, ['use ancient amulet on wound'])
    }
    const with2 = play(TWO_SELFLESS)
    expect(with2.indexOf(line)).toBeGreaterThan(
      with2.indexOf(lysa, with2.indexOf('Where the wound was')),
    )
    expect(with2.indexOf(line)).toBeLessThan(
      with2.indexOf('The ward is finished'),
    )
    const without = play([])
    expect(without).not.toContain(line)
    expect(
      with2.replace(
        /\[character_name\]Aren\[\/character_name\]\n\[dialogue\]We watched you give[^\n]*\n/,
        '',
      ),
    ).toBe(without)
  })
})

describe('Redemption colouring', () => {
  it('stays unchanged with high counters', () => {
    const game = opened([...TWO_TRUTHS, ...TWO_SELFLESS])
    executeCommands(game, ['use lifelight elixir on wound'])
    executeCommands(game, ['say forgiveness to malakar'])
    const text = executeCommands(game, ['cast forgiveness on wound'])
    expect(text).toContain('You gave him back to us')
    expect(text).not.toContain('You named every crime')
    expect(text).not.toContain('We watched you give')
  })
})

describe('after the endings and around them', () => {
  it('keeps both roads open for a save with no virtue record', () => {
    const game = opened(TWO_TRUTHS)
    executeCommands(game, ['use lifelight elixir on prison'])
    game.state.virtues = []
    reload(game)
    const hint = executeCommands(game, ['use ancient amulet on wound'])
    expect(hint).toContain('in justice. Or you could give up your magic')
    executeCommands(game, ['say justice to malakar'])
    executeCommands(game, ['use ancient amulet on wound'])
    expectStoryFlag(game.state, FLAG_ACT4_JUSTICE_ENDING, true)
  })

  it('describes the closed scene when things are examined', () => {
    const game = opened(TWO_TRUTHS)
    executeCommands(game, ['use lifelight elixir on prison'])
    executeCommands(game, ['say justice to malakar'])
    executeCommands(game, ['use ancient amulet on wound'])
    expect(executeCommands(game, ['examine wound'])).toContain(
      'still and empty',
    )
    expect(executeCommands(game, ['examine prison'])).toContain('shards')
    expect(executeCommands(game, ['examine king alden'])).toContain(
      'crown bright again',
    )
    expect(executeCommands(game, ['examine malakar'])).toContain(
      'gone into the seal',
    )
    expect(executeCommands(game, ['give ancient amulet to malakar'])).toContain(
      'Malakar is gone into the seal.',
    )
  })

  it('keeps a word, and the learned spell, through a reload with the wound open', () => {
    const sacrifice = opened(TWO_SELFLESS)
    executeCommands(sacrifice, [
      'use lifelight elixir on prison',
      'say sacrifice to malakar',
    ])
    reload(sacrifice)
    expect(executeCommands(sacrifice, ['say sacrifice to malakar'])).toContain(
      'You have said it. The amulet is waiting.',
    )
    expect(executeCommands(sacrifice, ['say justice to malakar'])).toContain(
      'You have chosen.',
    )
    const redemption = opened()
    executeCommands(redemption, [
      'use lifelight elixir on malakar',
      'say forgiveness to malakar',
    ])
    reload(redemption)
    expect(spellNames(redemption)).toContain('Forgiveness')
    expect(
      executeCommands(redemption, ['say forgiveness to malakar']),
    ).toContain('You have said it. The wound is waiting.')
  })

  it('casts grow alone and on an item', () => {
    const game = opened()
    const grow = new Grow()
    expect(grow.castSpell(game.state)).toContain('nothing else happens')
    expect(grow.castOnItem(game.state, new Wound())).toBeTypeOf('string')
  })
})
