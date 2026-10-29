import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { describe, it, expect } from 'vitest'
import { BreathOfTheMountain } from './BreathOfTheMountain'
import { TidewardSigilsQuest } from './TidewardSigils'
import { LanternsOfTheDeepsQuest } from './LanternsOfTheDeeps'

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
    lanterns.completion = 'old'
    game.state.activatedQuests.push(sigils)
    game.state.completedQuests.push(breath, lanterns)
    new Act3().afterLoad(game.state)
    expect(breath.completion).toBe(new BreathOfTheMountain().completion)
    expect(sigils.description).toBe(new TidewardSigilsQuest().description)
    expect(lanterns.completion).toBe(new LanternsOfTheDeepsQuest().completion)
  })
})
