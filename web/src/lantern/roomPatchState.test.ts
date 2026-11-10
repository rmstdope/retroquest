/**
 * Which patches of a room's picture apply to the story as it stands: the
 * rule, checked against every declared patch of every act and against play.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Key } from '@/act1/items/Key'
import { Lantern } from '@/act1/items/Lantern'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { Game, type Act } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { declaredPatches } from './roomPatches'
import { appliedPatchIds, patchIsKnown } from './roomPatchState'

const ACTS: Array<() => Act> = [
  () => new Act1(),
  () => new Act2(),
  () => new Act3(),
  () => new Act4(),
]

describe('appliedPatchIds', () => {
  it('shows a taken patch only once the thing has left the room', () => {
    const act = new Act1()
    const game = new Game([act])
    executeCommands(game, ['look'])
    const walk = act.goldenPath.slice(0, act.goldenPath.indexOf('take bucket'))
    executeCommands(game, walk)
    const before = appliedPatchIds(act, 'VillageSquare', game.state)
    expect(before).not.toContain('bucket-taken')
    executeCommands(game, ['take bucket'])
    expect(appliedPatchIds(act, 'VillageSquare', game.state)).toContain(
      'bucket-taken',
    )
  })

  it('shows an appears patch only once the thing is in the room', () => {
    const act = new Act1()
    const game = new Game([act])
    expect(appliedPatchIds(act, 'AbandonedShed', game.state)).not.toContain(
      'fishing-rod-appears',
    )
  })

  describe("the shed's inside picture", () => {
    /** Act I with Elior in the shed, its door just opened with the key. */
    function openedShed(): { act: Act1; game: Game } {
      const act = new Act1()
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.AbandonedShed
      game.state.addItemToInventory(new Key())
      executeCommands(game, ['use key with door'])
      return { act, game }
    }
    const inside = (act: Act1, game: Game): string[] =>
      appliedPatchIds(act, 'AbandonedShed', game.state, 'inside')

    it('has no patch while the box, the shovel and Patches are all as painted', () => {
      const { act, game } = openedShed()
      expect(inside(act, game)).toEqual([])
    })

    it('takes the shovel off the picture once it is carried', () => {
      const { act, game } = openedShed()
      executeCommands(game, ['take broken shovel'])
      expect(inside(act, game)).toContain('broken-shovel-taken')
    })

    it('adds the rod and the magnet once searched by a light', () => {
      const { act, game } = openedShed()
      game.state.addItemToInventory(new Lantern())
      executeCommands(game, ['use lantern', 'search', 'search'])
      expect(inside(act, game)).toEqual(
        expect.arrayContaining(['fishing-rod-appears', 'magnet-appears']),
      )
    })
  })

  it('shows a lit lantern only once it is lit, and the dark corner again once it is taken', () => {
    const act = new Act1()
    const game = new Game([act])
    expect(appliedPatchIds(act, 'EliorsCottage', game.state)).not.toContain(
      'lantern-lit',
    )
    executeCommands(game, ['talk to voice', 'use lantern'])
    expect(appliedPatchIds(act, 'EliorsCottage', game.state)).toContain(
      'lantern-lit',
    )
    executeCommands(game, ['take lantern'])
    expect(appliedPatchIds(act, 'EliorsCottage', game.state)).not.toContain(
      'lantern-lit',
    )
  })

  it('answers no patch for a room without any', () => {
    const act = new Act1()
    const game = new Game([act])
    expect(appliedPatchIds(act, 'NoSuchRoom', game.state)).toEqual([])
  })

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'can judge every declared patch of %s',
    (_name, make) => {
      const act = make()
      const unknown: string[] = []
      for (const room of Object.keys(act.rooms))
        for (const patch of declaredPatches(act.name, room))
          if (!patchIsKnown(act.name, room, patch))
            unknown.push(`${room} ${patch.id}`)
      expect(unknown).toEqual([])
    },
  )

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s changes during the golden path and only names declared patches',
    (_name, make) => {
      const act = make()
      const game = new Game([act])
      const seen = new Set<string>()
      const atStart = new Game([make()])
      for (const room of Object.keys(act.rooms)) {
        const early = appliedPatchIds(act, room, atStart.state)
        // A patch about the start of the story is a fault: only a thing taken or gone later may show.
        expect(early.filter((id) => /-appears$|-open$/.test(id))).toEqual([])
      }
      for (const command of act.goldenPath) {
        game.commandParser.parse(command)
        game.state.settleQuests()
        for (const room of Object.keys(act.rooms)) {
          const declared = declaredPatches(act.name, room).map((p) => p.id)
          for (const id of appliedPatchIds(act, room, game.state)) {
            expect(declared, `${room} ${id}`).toContain(id)
            seen.add(id)
          }
        }
      }
      expect(seen.size).toBeGreaterThan(0)
      // The golden path skips optional pickups and ways, so those patches may never apply;
      // every other patch (a thing gone, arriving, changed) is judged true at some step.
      // The Justice and Sacrifice endings are not on the golden path (Redemption), so their patches never apply there.
      const otherEndings = new Set(['wound-sealed', 'malakar-kneeling'])
      const never: string[] = []
      for (const room of Object.keys(act.rooms))
        for (const patch of declaredPatches(act.name, room))
          if (
            !seen.has(patch.id) &&
            !otherEndings.has(patch.id) &&
            !/-(taken|open)$/.test(patch.id)
          )
            never.push(`${room} ${patch.id}`)
      expect(never).toEqual([])
    },
  )
})
