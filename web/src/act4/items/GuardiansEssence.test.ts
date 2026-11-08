import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import { FLAG_ACT4_SERVANTS_TRUST_EARNED } from '../Act4StoryFlags'
import { TrappedServants } from '../characters/TrappedServants'
import { GuardiansEssence } from './GuardiansEssence'
import { executeCommands, expectMarkupWellFormed } from '@/testing/gameHelpers'

describe('GuardiansEssence', () => {
  it('uses known tags when used in each room and again on the servants', () => {
    const act = new Act4()
    act.musicFile = ''
    const game = new Game([act])
    const essence = new GuardiansEssence()
    const elsewhere = essence.use(game.state)
    game.state.currentRoom = game.state.allRooms.HallOfEchoes
    const hall = essence.use(game.state)
    game.state.currentRoom = game.state.allRooms.OuterCourtyard
    essence.useOnCharacter(game.state, new TrappedServants())

    const again = essence.useOnCharacter(game.state, new TrappedServants())

    expect(elsewhere).toContain('waiting for someone to show it to')
    expect(hall).toContain('steadies in the old hall')
    expect(again).toContain('The servants already know you')
    for (const answer of [elsewhere, hall, again]) {
      expectMarkupWellFormed(answer)
    }
  })

  describe('held up in the courtyard, without naming the servants', () => {
    /** An Act IV game in the Outer Courtyard, the essence in hand. */
    function gameInCourtyardWithEssence(): Game {
      const act = new Act4()
      act.musicFile = ''
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.OuterCourtyard
      game.state.inventory.push(new GuardiansEssence())
      return game
    }

    it('earns the trust of the servants, so a blessing frees them', () => {
      const game = gameInCourtyardWithEssence()

      const held = executeCommands(game, ["use guardian's essence"])
      const blessing = executeCommands(game, ['cast bless on servants'])

      expect(held).toContain('For the first time, they look at you')
      expect(game.state.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)).toBe(
        true,
      )
      expect(blessing).toContain('The chains do not break')
    })

    it('says they already know you the second time', () => {
      const game = gameInCourtyardWithEssence()
      executeCommands(game, ["use guardian's essence"])

      const again = executeCommands(game, ["use guardian's essence"])

      expect(again).toContain('The servants already know you')
    })

    it('asks nothing of the servants once they are free', () => {
      const game = gameInCourtyardWithEssence()
      executeCommands(game, [
        "use guardian's essence",
        'cast bless on servants',
      ])

      const after = executeCommands(game, ["use guardian's essence"])

      expect(after).toContain('where the chains were')
      expect(after).not.toContain('wait')
    })
  })

  describe('used away from the courtyard, once the servants have seen it', () => {
    /** An Act IV game in the Outer Courtyard, the essence just shown. */
    function gameAfterShowing(): Game {
      const act = new Act4()
      act.musicFile = ''
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.OuterCourtyard
      game.state.inventory.push(new GuardiansEssence())
      executeCommands(game, ["use guardian's essence"])
      return game
    }

    it('no longer waits for someone to show it to', () => {
      const game = gameAfterShowing()
      game.state.currentRoom = game.state.allRooms.FortressGates

      const after = executeCommands(game, ["use guardian's essence"])

      expect(after).toContain('The ones who needed to see it have seen it.')
      expect(after).not.toContain('waiting')
    })

    it('no longer waits once the servants are free either', () => {
      const game = gameAfterShowing()
      executeCommands(game, ['cast bless on servants'])
      game.state.currentRoom = game.state.allRooms.ThroneChamber

      const after = executeCommands(game, ["use guardian's essence"])

      expect(after).toContain('The ones who needed to see it have seen it.')
      expect(after).not.toContain('waiting')
    })
  })
})
