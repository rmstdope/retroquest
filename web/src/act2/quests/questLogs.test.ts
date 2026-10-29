import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from '../Act2'

/** The quests whose logs name a real person or place, with their agreed texts. */
const LOGS: { name: string; description?: string; completion?: string }[] = [
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
    const quest = game.state.getQuest(log.name)
    if (!quest) throw new Error(`no quest ${log.name}`)
    const completion = quest.completion
    if (log.description) quest.description = 'old words'
    if (log.completion) quest.completion = 'old words'

    const loaded = new Game([new Act2()])
    expect(loaded.loadSaveData(game.toSaveData())).toContain('loaded')

    const reloaded = loaded.state.getQuest(log.name)
    if (log.description) expect(reloaded?.description).toBe(log.description)
    expect(reloaded?.completion).toBe(log.completion ?? completion)
  })
})
