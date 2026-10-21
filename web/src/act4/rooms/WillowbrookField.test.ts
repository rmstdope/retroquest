import { describe, it, expect } from 'vitest'
import { Game, GameRunState } from '@/engine'
import { Act4 } from '../Act4'
import { Grow } from '../spells/Grow'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import {
  FLAG_ACT4_FIELD_GREEN,
  VIRTUE_SELFLESS,
  VIRTUE_TRUTH,
} from '../Act4StoryFlags'
import {
  executeCommands,
  expectCurrentRoom,
  expectStoryFlag,
} from '@/testing/gameHelpers'

const ARCH_LINE =
  'Behind the throne an arch you had not noticed stands open. Beyond it, far off, the road runs home.'
const KNEEL_REMEMBER =
  'You kneel at the edge of the field. Your hands remember the first spell you ever learned.'
const KNEEL_KEPT =
  'You kneel at the edge of the field. The one spell you kept stirs in your hands, small and certain.'
const ARCH_SENTENCE = 'Behind the throne an arch stands open on the road home.'
const AMULET_STEP = ACT4_GOLDEN_PATH.indexOf('use ancient amulet') + 1

type Ending = 'redemption' | 'justice' | 'sacrifice'

/** A game at the end of the chosen ending, in the Throne Chamber. */
function ended(ending: Ending): { game: Game; text: string } {
  const game = new Game([new Act4()])
  game.newTurn()
  game.newTurn()
  executeCommands(game, ACT4_GOLDEN_PATH.slice(0, AMULET_STEP))
  const virtue = ending === 'sacrifice' ? VIRTUE_SELFLESS : VIRTUE_TRUTH
  let text: string
  if (ending === 'redemption') {
    text = executeCommands(game, [
      'use lifelight elixir on malakar',
      'say forgiveness to malakar',
      'cast forgiveness on wound',
    ])
  } else {
    game.state.addVirtue(virtue)
    game.state.addVirtue(virtue)
    executeCommands(game, [
      'use lifelight elixir on prison',
      `say ${ending} to malakar`,
    ])
    text = executeCommands(game, ['use ancient amulet on wound'])
  }
  return { game, text }
}

function home(ending: Ending): Game {
  const { game } = ended(ending)
  executeCommands(game, ['north'])
  return game
}

function reload(game: Game): void {
  expect(game.loadSaveData(game.toSaveData())).toContain(
    'Game loaded successfully.',
  )
}

describe('the arch', () => {
  it('is refused before the ending', () => {
    const game = new Game([new Act4()])
    executeCommands(game, ACT4_GOLDEN_PATH.slice(0, AMULET_STEP))
    expect(executeCommands(game, ['north'])).toContain("You can't go that way.")
    expect(game.state.currentRoom.describe(game.state)).not.toContain('arch')
  })

  for (const ending of ['redemption', 'justice', 'sacrifice'] as const) {
    it(`opens with the ${ending} ending, and stays through a reload`, () => {
      const { game, text } = ended(ending)
      expect(text.trimEnd().endsWith(ARCH_LINE)).toBe(true)
      const look = game.state.currentRoom.describe(game.state)
      expect(look).toContain(`${ARCH_SENTENCE}\n`)
      expect(look).toContain('[exits]north[/exits] (the way home)')
      expect(look).toContain('[exits]south[/exits]')
      reload(game)
      expect(game.state.currentRoom.describe(game.state)).toContain(
        '[exits]north[/exits] (the way home)',
      )
      expect(game.state.currentRoom.description).toContain(ARCH_SENTENCE)
    })
  }
})

describe('Willowbrook Field', () => {
  it('is reached by a walk home, and teaches grow after Redemption or Justice', () => {
    for (const ending of ['redemption', 'justice'] as const) {
      const { game } = ended(ending)
      expect(game.state.knownSpells.map((s) => s.id)).not.toContain('grow')
      const text = executeCommands(game, ['north'])
      expect(text).toContain(
        'You walk out of the fortress and do not look back.',
      )
      expect(text).toContain(KNEEL_REMEMBER)
      expect(text).toContain('[event]You remember the grow spell![/event]')
      expectCurrentRoom(game.state, 'Willowbrook Field')
      expect(game.state.knownSpells.map((s) => s.id)).toContain('grow')
    }
  })

  it('keeps the spell after Sacrifice, with a different line and no event', () => {
    const { game } = ended('sacrifice')
    const text = executeCommands(game, ['north'])
    expect(text).toContain(KNEEL_KEPT)
    expect(text).not.toContain('You remember the grow spell!')
    expect(game.state.knownSpells.map((s) => s.id)).toEqual(['grow'])
  })

  it('shows the field, its four companions and no exits', () => {
    const game = home('redemption')
    const look = game.state.currentRoom.describe(game.state)
    expect(look).toContain('rows of withered crops under a pale sky')
    expect(look).toContain(
      'Characters present: [character_name]Grandmother[/character_name], [character_name]Mira[/character_name], [character_name]Sir Cedric[/character_name], [character_name]Nyx[/character_name]',
    )
    expect(look).not.toContain('Exits:')
  })

  it('refuses every direction gently', () => {
    const game = home('justice')
    for (const dir of ['south', 'north', 'east', 'west']) {
      expect(executeCommands(game, [dir])).toContain(
        'You are home. There is nowhere else you need to go.',
      )
    }
    expectCurrentRoom(game.state, 'Willowbrook Field')
  })

  it('does not repeat the arrival on look or after a reload, and still casts', () => {
    const game = home('redemption')
    reload(game)
    expectCurrentRoom(game.state, 'Willowbrook Field')
    expect(game.state.knownSpells.map((s) => s.id)).toContain('grow')
    expect(executeCommands(game, ['look'])).not.toContain('You remember')
    expectStoryFlag(game.state, FLAG_ACT4_FIELD_GREEN, false)
    expect(executeCommands(game, ['cast grow'])).toContain('You cast')
  })
})

describe('the cradle song at the gate', () => {
  const GATE =
    'At the gate Grandmother is singing to herself: "Hush, little seed, the frost is going—" She sees you, and stops.'

  for (const ending of ['redemption', 'justice', 'sacrifice'] as const) {
    it(`is sung on arrival after the ${ending} ending, between the walk and the kneel`, () => {
      const { game } = ended(ending)
      const text = executeCommands(game, ['north'])
      const walk = text.indexOf('your own field.')
      const gate = text.indexOf(GATE)
      const kneel = text.indexOf('You kneel at the edge of the field.')
      expect(gate).toBeGreaterThan(walk)
      expect(kneel).toBeGreaterThan(gate)
      expect(executeCommands(game, ['look'])).not.toContain('Hush')
    })
  }

  it('has no song in the Sacrifice Throne Chamber', () => {
    expect(ended('sacrifice').text).not.toContain('Hush')
  })

  it('has Grandmother name the song on the first talk only', () => {
    const game = home('justice')
    const first = executeCommands(game, ['talk to grandmother'])
    expect(first).toContain("Your mother's. I didn't think you'd remember.")
    expect(
      first.startsWith(
        '[character_name]Grandmother[/character_name]\n[dialogue]Your mother',
      ),
    ).toBe(true)
    expect(executeCommands(game, ['talk to grandmother'])).not.toContain(
      'Your mother',
    )
  })
})

describe('the companions', () => {
  it('Grandmother tells the message first, then her short line', () => {
    const game = home('redemption')
    const first = executeCommands(game, ['talk to grandmother'])
    expect(first).toContain('You saw them. I can see it in your face.')
    expect(first).toContain(
      'You tell her what they said: that they are proud of her, that they are resting.',
    )
    expect(first).toContain(
      'Resting. Good. Then so can we. Go on, love. The field has waited long enough.',
    )
    reload(game)
    const later = executeCommands(game, ['talk to grandmother'])
    expect(later).toContain('Go on, love. The field has waited long enough.')
    expect(later).not.toContain('You saw them')
  })

  it('Mira follows the ending', () => {
    expect(executeCommands(home('redemption'), ['talk to mira'])).toContain(
      'He remembers. Then I will go and see him, one day. Not yet.',
    )
    expect(executeCommands(home('justice'), ['talk to mira'])).toContain(
      'Good. And I am sorry, both at once. He taught me my first spell, too.',
    )
    expect(executeCommands(home('sacrifice'), ['talk to mira'])).toContain(
      'All of it? Oh, Elior. Then I will teach you again, slowly, if you want to learn.',
    )
  })

  it('Sir Cedric and Nyx have one line each, repeated', () => {
    const game = home('justice')
    for (let i = 0; i < 2; i++) {
      expect(executeCommands(game, ['talk to sir cedric'])).toContain(
        'I have walked a long way beside you. This is a good place to stop.',
      )
      expect(executeCommands(game, ['talk to nyx'])).toContain(
        'The little light brushes your cheek, warm, and settles back into the hedge.',
      )
    }
  })
})

describe('casting grow at home', () => {
  it('refuses the companions by name', () => {
    const game = home('redemption')
    expect(executeCommands(game, ['cast grow on grandmother'])).toContain(
      'Grow is for the field, not for Grandmother.',
    )
    expect(executeCommands(game, ['cast grow on sir cedric'])).toContain(
      'Grow is for the field, not for Sir Cedric.',
    )
    expectStoryFlag(game.state, FLAG_ACT4_FIELD_GREEN, false)
  })

  for (const cast of [
    'cast grow',
    'cast grow on field',
    'cast grow on crops',
  ]) {
    it(`"${cast}" greens the field and ends the act`, () => {
      const game = home('sacrifice')
      const text = executeCommands(game, [cast])
      expect(text).toContain(
        '[event]You cast [spell_name]grow[/spell_name].[/event]',
      )
      expect(text).toContain('Green runs out from your fingers along the rows.')
      expect(text).toContain('Grandmother opens the gate.')
      expect(text).toContain('Welcome home, Elior.')
      expectStoryFlag(game.state, FLAG_ACT4_FIELD_GREEN, true)
      game.newTurn()
      expect(game.runState).toBe(GameRunState.GameOver)
    })
  }

  it('names the ending on the complete page', () => {
    const hooks: Record<Ending, string> = {
      redemption: 'Malakar is himself again. And Elior is home.',
      justice:
        'Malakar is sealed away, and the kingdom is set right. Elior is home.',
      sacrifice:
        'Elior gave his magic away and kept the smallest spell. He is home.',
    }
    for (const ending of Object.keys(hooks) as Ending[]) {
      const game = home(ending)
      executeCommands(game, ['cast grow'])
      game.newTurn()
      const page = game.getActCompleteText() ?? ''
      expect(page.startsWith(hooks[ending])).toBe(true)
      expect(page).toContain('the final act of RetroQuest!')
    }
  })

  it('leaves other spells working after Redemption, and gone after Sacrifice', () => {
    expect(executeCommands(home('redemption'), ['cast bless'])).not.toContain(
      'That magic is gone from you now.',
    )
    expect(executeCommands(home('sacrifice'), ['cast bless'])).toContain(
      'That magic is gone from you now.',
    )
  })

  it('does not change grow elsewhere in the fortress', () => {
    const { game } = ended('sacrifice')
    expect(executeCommands(game, ['cast grow'])).toContain(
      'nothing else happens',
    )
  })
})

describe('more of the field', () => {
  it('answers to Cedric and refuses grow for every companion', () => {
    const game = home('justice')
    expect(executeCommands(game, ['talk to cedric'])).toContain(
      'good place to stop',
    )
    for (const name of ['Mira', 'Nyx', 'Cedric']) {
      expect(executeCommands(game, [`cast grow on ${name}`])).toContain(
        'Grow is for the field, not for',
      )
    }
    expectStoryFlag(game.state, FLAG_ACT4_FIELD_GREEN, false)
  })

  it('finds no field to grow in the fortress', () => {
    const { game } = ended('redemption')
    game.state.learnSpell(new Grow())
    expect(executeCommands(game, ['cast grow on field'])).toContain(
      "You don't see a 'field'",
    )
  })

  it('keeps the ending for Mira and the last page through a reload', () => {
    for (const ending of ['redemption', 'sacrifice'] as const) {
      const game = home(ending)
      reload(game)
      expectCurrentRoom(game.state, 'Willowbrook Field')
      expect(game.state.knownSpells.map((s) => s.id)).toContain('grow')
      expect(executeCommands(game, ['talk to mira'])).toContain(
        ending === 'redemption' ? 'He remembers.' : 'teach you again',
      )
      executeCommands(game, ['cast grow'])
      reload(game)
      game.newTurn()
      expect(game.getActCompleteText()).toContain('is home.')
    }
  })
})
