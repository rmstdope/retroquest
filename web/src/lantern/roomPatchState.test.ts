/**
 * Which patches of a room's picture apply to the story as it stands: the
 * rule, checked against every declared patch of every act and against play.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
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

  it('shows a lit lantern only once it is lit', () => {
    const act = new Act1()
    const game = new Game([act])
    expect(appliedPatchIds(act, 'EliorsCottage', game.state)).not.toContain(
      'lantern-lit',
    )
    executeCommands(game, ['talk to voice', 'use lantern'])
    expect(appliedPatchIds(act, 'EliorsCottage', game.state)).toContain(
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
    },
  )
})
