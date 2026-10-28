import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { FallenRock } from './FallenRock'
import { ReinforcedBraces } from './ReinforcedBraces'
import { RustedLockerKey } from './RustedLockerKey'
import { SupportStraps } from './SupportStraps'
import { WedgeBlocks } from './WedgeBlocks'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act III game with a fallen rock in the current room. */
function createGameWithRock(): { game: Game; rock: FallenRock } {
  const game = new Game([new Act3()])
  const rock = new FallenRock()
  game.state.currentRoom.addItem(rock)
  return { game, rock }
}

describe('FallenRock markup', () => {
  it('using rescue tools out of order uses only known, balanced tags', () => {
    const { game, rock } = createGameWithRock()

    const bracesUnexamined = rock.useWith(game.state, new ReinforcedBraces())
    rock.examine(game.state)
    const strapsEarly = rock.useWith(game.state, new SupportStraps())
    const wedgesEarly = rock.useWith(game.state, new WedgeBlocks())
    const unhelpful = rock.useWith(game.state, new RustedLockerKey())

    expect(bracesUnexamined).toContain(
      'You do not yet know where the ceiling sags',
    )
    expect(strapsEarly).toContain('The straps have nothing to hold')
    expect(wedgesEarly).toContain('The braces stand loose under the ceiling')
    expect(unhelpful).toContain("won't help")
    for (const answer of [
      bracesUnexamined,
      strapsEarly,
      wedgesEarly,
      unhelpful,
    ]) {
      expectMarkupWellFormed(answer)
    }
  })

  it('using each rescue tool a second time uses only known, balanced tags', () => {
    const { game, rock } = createGameWithRock()
    rock.examine(game.state)
    rock.useWith(game.state, new ReinforcedBraces())
    const bracesAgain = rock.useWith(game.state, new ReinforcedBraces())
    rock.useWith(game.state, new SupportStraps())
    const strapsAgain = rock.useWith(game.state, new SupportStraps())
    rock.useWith(game.state, new WedgeBlocks())

    const wedgesAgain = rock.useWith(game.state, new WedgeBlocks())

    expect(bracesAgain).toContain('already in place')
    expect(strapsAgain).toContain('already securing the braces')
    expect(wedgesAgain).toContain('already securing the passage')
    for (const answer of [bracesAgain, strapsAgain, wedgesAgain]) {
      expectMarkupWellFormed(answer)
    }
  })
})

describe('FallenRock and the men behind it', () => {
  it('lets the player hear tapping, never voices, since the men are silent', () => {
    const { game, rock } = createGameWithRock()

    const examined = rock.examine(game.state)

    expect(rock.description).toContain('someone tapping')
    expect(rock.description).toContain('the way east is gone under it')
    expect(rock.description).not.toContain('calls for help')
    expect(examined).toContain('it needs holding up first')
    expect(examined).not.toContain('voices')
  })

  it('lets the miners out with no exclamation', () => {
    const { game, rock } = createGameWithRock()
    rock.examine(game.state)
    rock.useWith(game.state, new ReinforcedBraces())
    rock.useWith(game.state, new SupportStraps())

    const freed = rock.useWith(game.state, new WedgeBlocks())

    expect(freed).toContain('blinking at your light')
    expect(freed).not.toContain('!')
  })
})
