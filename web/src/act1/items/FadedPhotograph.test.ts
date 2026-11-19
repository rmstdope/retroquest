import { describe, it, expect } from 'vitest'
import { Game, GameController, findMarkupProblems, writing } from '@/engine'
import { Act1 } from '../Act1'
import { FLAG_READ_PHOTO_MESSAGE } from '../Act1StoryFlags'
import { executeCommands } from '@/testing/gameHelpers'
import { FadedPhotograph } from './FadedPhotograph'

const MESSAGE = writing('Seek the truth where the river bends.')

/** A fresh Act I game with the photograph in Elior's bag, not yet examined. */
function gameWithPhotograph(): Game {
  const game = new Game([new Act1()])
  game.state.addItemToInventory(new FadedPhotograph())
  return game
}

/** The photograph's tooltip in the Bag, as the UI reads it. */
function bagTooltip(game: Game): string {
  const entry = new GameController(game)
    .getInventory()
    .find((item) => item.name.includes('faded photograph'))
  if (!entry) throw new Error('the photograph is not in the bag')
  return entry.description
}

describe('FadedPhotograph', () => {
  it('writes the message on its back as deliberately unsigned words', () => {
    const description = new FadedPhotograph().description
    expect(findMarkupProblems(description)).toEqual([])
    expect(description).toContain(MESSAGE)
  })

  it('keeps the message on its back out of the Bag until Elior turns it over', () => {
    const game = gameWithPhotograph()
    const tooltip = bagTooltip(game)
    expect(findMarkupProblems(tooltip)).toEqual([])
    expect(tooltip).not.toContain(MESSAGE)
    expect(tooltip).toContain('Something is written on the back.')
    expect(game.state.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)).toBeFalsy()
  })

  it('shows the message once examined, in the answer and in the Bag', () => {
    const game = gameWithPhotograph()
    const answer = executeCommands(game, ['examine photograph'])
    expect(answer).toContain(MESSAGE)
    expect(game.state.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)).toBe(true)
    expect(bagTooltip(game)).toContain(MESSAGE)
  })
})
