import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { describe, it, expect } from 'vitest'
import { BreathOfTheMountain } from './BreathOfTheMountain'
import { TidewardSigilsQuest } from './TidewardSigils'
import { LanternsOfTheDeepsQuest } from './LanternsOfTheDeeps'
import { MirrorsOfEmberlightQuest } from './MirrorsOfEmberlight'

describe('Act III side quest logs', () => {
  it('Breath of the Mountain tells the steps in order', () => {
    expect(new BreathOfTheMountain().completion).toBe(
      'You set the vent stones, sealed the vents with ash-fern and slag, ' +
        "counted the mountain's breath, and crossed to the crater on the in-breath.",
    )
  })

  it('Tideward Sigils places the pillars in the Outer Wards', () => {
    expect(new TidewardSigilsQuest().description).toBe(
      'Three warding pillars stand in the drowned courtyard of the Outer Wards. ' +
        'Cleaned and set with moon sigils, they could draw the sea back from the hall beyond.',
    )
  })

  it('Lanterns of the Deeps names the brackets and what a light in them could do', () => {
    expect(new LanternsOfTheDeepsQuest().description).toBe(
      'Three carved brackets line the flooded antechamber, cut to hold a lantern. ' +
        'With a light burning in each, the hall might show the way through.',
    )
  })

  it('Lanterns of the Deeps ends on the path to the sanctum', () => {
    expect(new LanternsOfTheDeepsQuest().completion).toBe(
      'The prism lanterns burn in their brackets, and their light lays a ' +
        'clear path through the flooded hall to the sanctum.',
    )
  })
})

describe('Act III side quest logs in older saves', () => {
  it('load with the new wording', () => {
    const game = new Game([new Act3()])
    const breath = new BreathOfTheMountain()
    const sigils = new TidewardSigilsQuest()
    const lanterns = new LanternsOfTheDeepsQuest()
    breath.completion = 'old'
    sigils.description = 'old'
    lanterns.description = 'old'
    lanterns.completion = 'old'
    game.state.activatedQuests.push(sigils)
    game.state.completedQuests.push(breath, lanterns)
    new Act3().afterLoad(game.state)
    game.state.refreshSavedText()
    expect(breath.completion).toBe(new BreathOfTheMountain().completion)
    expect(sigils.description).toBe(new TidewardSigilsQuest().description)
    expect(lanterns.description).toBe(new LanternsOfTheDeepsQuest().description)
    expect(lanterns.completion).toBe(new LanternsOfTheDeepsQuest().completion)
  })
})

describe('Act III side quest logs not yet offered in an older save', () => {
  it('keep the text they were saved with', () => {
    const game = new Game([new Act3()])
    const breath = new BreathOfTheMountain()
    const sigils = new TidewardSigilsQuest()
    const lanterns = new LanternsOfTheDeepsQuest()
    breath.completion = 'old'
    sigils.description = 'old'
    lanterns.description = 'old'
    lanterns.completion = 'old'
    const mirrors = new MirrorsOfEmberlightQuest()
    mirrors.completion = 'old'
    game.state.nonActivatedQuests = [breath, sigils, lanterns, mirrors]
    new Act3().afterLoad(game.state)
    game.state.refreshSavedText()
    expect(mirrors.completion).toBe('old')
    expect(breath.completion).toBe('old')
    expect(sigils.description).toBe('old')
    expect(lanterns.description).toBe('old')
    expect(lanterns.completion).toBe('old')
  })
})

describe('Mirrors of Emberlight speaks to the player', () => {
  it('tells the mending as something you did, in plain words', () => {
    const quest = new MirrorsOfEmberlightQuest()
    expect(quest.completion).toMatch(/^You /)
    expect(quest.completion).not.toMatch(/Elior|ancient|with care and skill/)
    expect(quest.description).not.toMatch(/ancient/)
  })

  it('loads an older save with the new wording', () => {
    const game = new Game([new Act3()])
    const quest = new MirrorsOfEmberlightQuest()
    quest.description = 'old'
    quest.completion = 'old'
    game.state.completedQuests.push(quest)
    game.state.refreshSavedText()
    expect(quest.description).toBe(new MirrorsOfEmberlightQuest().description)
    expect(quest.completion).toBe(new MirrorsOfEmberlightQuest().completion)
  })
})
