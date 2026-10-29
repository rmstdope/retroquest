import { describe, it, expect } from 'vitest'
import { Game, type Quest } from '@/engine'
import { Act2 } from '../Act2'

/** A quest's name and the agreed wording of the fields that changed. */
type Log = { name: string; description?: string; completion?: string }

/** The quests whose logs name a real person or place, with their agreed texts. */
const LOGS: Log[] = [
  {
    name: "The Hermit's Warning",
    description:
      "A hermit at the forest's edge says the forest moves its paths and " +
      "keeps old things that don't care for strangers. The hermit gave you " +
      'a charm with their mark on it, and told you not to walk in tonight: ' +
      'make camp by the stones first, so the forest can get a look at you.',
  },
  {
    name: "The Forest Guardian's Riddles",
    description:
      'The forest sprites say the water nymphs, east of the Forest ' +
      'Entrance, have riddles for travellers who want the deep paths.',
    completion:
      "You answered the nymphs' three riddles: water, mask and truth. " +
      'They gave you water from their stream and moonflowers from its bank.',
  },
  {
    name: 'Whispers in the Wind',
    description:
      'The spirit in the silver-barked tree taught you forest speech for ' +
      'an acorn. Now its roots want what the nymphs in the Whispering ' +
      'Glade can give.',
    completion:
      "You brought the tree spirit the nymphs' water and moonflowers, and " +
      'the way south opened toward Nyx.',
  },
  {
    name: "The Knight's Test",
    description:
      'Sir Cedric will not trust you on your word. He wants to see you ' +
      'with a blade, in the courtyard.',
    completion:
      'You held your own against Sir Cedric in the yard, and he trusts ' +
      'you now.',
  },
  {
    name: 'Supplies for the Journey',
    description:
      'Sir Cedric gave you coin for the forest: a survival kit, an ' +
      'enhanced lantern and rope, from the Market District.',
    completion: 'The kit, the lantern and the rope are in your pack.',
  },
  {
    name: 'The Ancient Library',
    description:
      'Behind a bricked-up cellar door in the Residential Quarter, steps ' +
      'lead down to a library nobody in Greendale talks about.',
    completion:
      "The library's keeper was a Warden once. Its chronicle taught you " +
      'dispel, and its last page warns that Malakar seeks the blood of ' +
      'Willowbrook.',
  },
  {
    name: 'Echoes of the Past',
    description:
      "Someone copied Willowbrook's birth rolls into a notebook and hid " +
      'it under the floor of the Silver Stag. The historians in the Great ' +
      'Hall keep those rolls.',
  },
  {
    name: "The Merchant's Lost Caravan",
    completion:
      "You found Thorne's caravan at the bottom of a ravine and brought " +
      'his people out on a rope. In thanks he gave you papers sent from ' +
      "Heavensforth, meant for a knight's hands.",
  },
]

describe('Act II quest logs name real people and places', () => {
  it.each(LOGS)('$name reads as agreed', (log) => {
    const quest = new Game([new Act2()]).state.getQuest(log.name)
    if (log.description) expect(quest?.description).toBe(log.description)
    if (log.completion) expect(quest?.completion).toBe(log.completion)
  })

  it.each(LOGS)('$name is brought up to date in an older save', (log) => {
    const game = new Game([new Act2()])
    ageText(game.state.getQuest(log.name), log)

    expectNewWording(load(game), log)
  })

  it.each(LOGS)('$name is brought up to date once completed', (log) => {
    const game = new Game([new Act2()])
    const quest = game.state.getQuest(log.name)
    if (!quest) throw new Error(`no quest ${log.name}`)
    quest.completed = true
    game.state.nonActivatedQuests = game.state.nonActivatedQuests.filter(
      (q) => q !== quest,
    )
    game.state.completedQuests.push(quest)
    ageText(quest, log)

    const loaded = load(game)
    expectNewWording(loaded, log)
    expect(loaded.state.completedQuests.map((q) => q.name)).toContain(log.name)
  })
})

/** Give a quest the old words in every field the agreed wording replaces. */
function ageText(quest: Quest | null, log: Log): void {
  if (!quest) throw new Error(`no quest ${log.name}`)
  if (log.description) quest.description = 'old words'
  if (log.completion) quest.completion = 'old words'
}

/** Save a game and load it into a fresh one. */
function load(game: Game): Game {
  const loaded = new Game([new Act2()])
  expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')
  return loaded
}

/** Expect the quest of a game to read as the agreed wording says. */
function expectNewWording(game: Game, log: Log): void {
  const quest = game.state.getQuest(log.name)
  if (log.description) expect(quest?.description).toBe(log.description)
  if (log.completion) expect(quest?.completion).toBe(log.completion)
}
