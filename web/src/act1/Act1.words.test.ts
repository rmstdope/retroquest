import { describe, expect, it } from 'vitest'
import { Game, GameController } from '@/engine'
import { wordsMissingOnPath } from '@/testing/sayWordsOnPath'
import { Act1 } from './Act1'
import { ACT1_GOLDEN_PATH } from './Act1GoldenPath'

/** A controller playing Act I from its first screen. */
function opened(): GameController {
  const controller = new GameController(new Game([new Act1()]))
  controller.advanceToRunning()
  controller.openRoom()
  return controller
}

/** The golden path with Patches left by the hearth: Elior hears her offer, then says "stay". */
function stayPath(): string[] {
  const path = [...ACT1_GOLDEN_PATH]
  const home = path.indexOf('talk to patches') + 6
  path.splice(home + 1, 0, 'talk to grandmother', 'say stay to grandmother')
  path.splice(path.indexOf('buy rope from shopkeeper'), 1)
  return path
}

describe('Act 1 words under Say…', () => {
  it('offers only Yes and No in the opening dream', () => {
    expect(opened().getSayWords()).toEqual([
      { word: 'Yes', isNew: false },
      { word: 'No', isNew: false },
    ])
  })

  it('offers every word its golden path says, before the path says it', () => {
    expect(wordsMissingOnPath(new Act1(), ACT1_GOLDEN_PATH)).toEqual([])
  })

  it('offers "stay" before Elior says it to his grandmother over Patches', () => {
    expect(wordsMissingOnPath(new Act1(), stayPath())).toEqual([])
  })

  it('offers the words the story puts in front of Elior along the path, new until said', () => {
    const controller = opened()
    for (const command of stayPath()) {
      controller.takeTurn(command)
      controller.game.state.settleQuests()
    }
    const offered = controller.getSayWords()
    const words = offered.map((entry) => entry.word)
    expect(words.slice(0, 2)).toEqual(['Yes', 'No'])
    expect(words).toEqual(expect.arrayContaining(['Patches', 'Stay', 'Mira']))
    expect(offered.find((entry) => entry.word === 'Stay')?.isNew).toBe(false)
    expect(offered.find((entry) => entry.word === 'Patches')?.isNew).toBe(true)
    expect(controller.hasNewSayWords()).toBe(true)
  })
})
