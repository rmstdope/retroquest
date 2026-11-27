import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { describe, it, expect } from 'vitest'
import { BreathOfTheMountain } from './BreathOfTheMountain'
import { TidewardSigilsQuest } from './TidewardSigils'
import { LanternsOfTheDeepsQuest } from './LanternsOfTheDeeps'
import { MirrorsOfEmberlightQuest } from './MirrorsOfEmberlight'

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
    expect(quest.completion).toMatch(/\byou\b/i)
    expect(quest.completion).not.toMatch(/Elior|ancient|with care and skill/)
    expect(quest.description).not.toMatch(/ancient/)
  })
})
