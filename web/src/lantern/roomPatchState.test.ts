/**
 * Which patches of a room's picture apply to the story as it stands: the
 * rule, checked against every declared patch of every act and against play.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { FLAG_PATCHES_STAYED_WITH_GRANDMOTHER } from '@/act1/Act1StoryFlags'
import { Patches } from '@/act1/characters/Patches'
import { FLAG_PATCHES_RETURNED } from '@/act1/Act1StoryFlags'
import { Key } from '@/act1/items/Key'
import { Lantern } from '@/act1/items/Lantern'
import { WitheredCarrot } from '@/act1/items/WitheredCarrot'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { Game, type Act } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import type { ImagePatch } from '@/engine'
import { appliedPatchIds, layeredIds } from './roomPatchState'
import { listedPatch } from './roomPatches'

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

  describe('the store shutters (rq-n11w)', () => {
    const store = (act: Act1, game: Game): string[] =>
      appliedPatchIds(act, 'GeneralStore', game.state)

    it('raises the shutters only once the store is open', () => {
      const act = new Act1()
      const game = new Game([act])
      expect(store(act, game)).not.toContain('shutters-raised')
      game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
      expect(store(act, game)).toContain('shutters-raised')
      expect(store(act, game)).not.toContain('patches-appears')
    })
  })

  describe('the store opened with Patches home (rq-n11w)', () => {
    it('raises the shutters and shows Patches together', () => {
      const act = new Act1()
      const game = new Game([act])
      game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
      game.state.allRooms.GeneralStore.addCharacter(new Patches())
      expect(appliedPatchIds(act, 'GeneralStore', game.state)).toEqual(
        expect.arrayContaining(['shutters-raised', 'patches-appears']),
      )
    })
  })

  describe('a save made in the shut store (rq-n11w)', () => {
    it('loads onto the one picture and raises the shutters when the store opens', () => {
      const act = new Act1()
      const game = new Game([act])
      const fresh = new Game([act])
      expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
      const store = fresh.state.allRooms.GeneralStore
      expect(store.pictureVariant(fresh.state)).toBe('')
      expect(appliedPatchIds(act, 'GeneralStore', fresh.state)).not.toContain(
        'shutters-raised',
      )
      fresh.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
      expect(appliedPatchIds(act, 'GeneralStore', fresh.state)).toContain(
        'shutters-raised',
      )
    })
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

  it('shows the lit lantern on the table, then the carried picture on top of it while Elior carries it in the cottage', () => {
    const act = new Act1()
    const game = new Game([act])
    const cottage = (): string[] =>
      appliedPatchIds(act, 'EliorsCottage', game.state)
    expect(cottage()).not.toContain('lantern-lit')
    expect(cottage()).not.toContain('lantern-carried')
    executeCommands(game, ['talk to voice', 'use lantern'])
    expect(cottage()).toContain('lantern-lit')
    expect(cottage()).not.toContain('lantern-carried')
    executeCommands(game, ['take lantern'])
    expect(game.state.inventory.some((i) => i instanceof Lantern)).toBe(true)
    expect(cottage()).toEqual(
      expect.arrayContaining(['lantern-lit', 'lantern-carried']),
    )
    expect(cottage().indexOf('lantern-lit')).toBeLessThan(
      cottage().indexOf('lantern-carried'),
    )
    // The game has no drop verb: put the lantern back on the table by hand.
    const lantern = game.state.inventory.find((i) => i instanceof Lantern)
    if (!lantern) throw new Error('Elior should carry the lantern')
    game.state.removeItemFromInventory(lantern.name)
    game.state.allRooms.EliorsCottage.addItem(lantern)
    expect(cottage()).toContain('lantern-lit')
    expect(cottage()).not.toContain('lantern-carried')
  })

  it('shows the carried picture again when a saved game carrying the lit lantern is loaded', () => {
    const act = new Act1()
    const game = new Game([act])
    executeCommands(game, ['talk to voice', 'use lantern', 'take lantern'])
    const loaded = new Game([new Act1()])
    loaded.loadSaveData(game.toSaveData())
    const applied = appliedPatchIds(act, 'EliorsCottage', loaded.state)
    expect(applied).toEqual(
      expect.arrayContaining(['lantern-lit', 'lantern-carried']),
    )
    expect(applied.indexOf('lantern-lit')).toBeLessThan(
      applied.indexOf('lantern-carried'),
    )
  })

  it('darkens the cottage corner once Elior carries the lit lantern out of the cottage', () => {
    const act = new Act1()
    const game = new Game([act])
    executeCommands(game, ['talk to voice', 'use lantern', 'take lantern'])
    game.state.currentRoom = game.state.allRooms.VillageSquare
    const applied = appliedPatchIds(act, 'EliorsCottage', game.state)
    expect(applied).not.toContain('lantern-lit')
    expect(applied).not.toContain('lantern-carried')
  })

  describe("the vegetable field's carrot", () => {
    /** Act I with Elior in the Vegetable Field. */
    function inField(): { act: Act1; game: Game } {
      const act = new Act1()
      const game = new Game([act])
      game.state.currentRoom = game.state.allRooms.VegetableField
      return { act, game }
    }
    const field = (act: Act1, game: Game): string[] =>
      appliedPatchIds(act, 'VegetableField', game.state)

    it('takes the withered carrot off the picture once it is carried', () => {
      const { act, game } = inField()
      expect(field(act, game)).not.toContain('withered-carrot-taken')
      executeCommands(game, ['take carrot'])
      expect(field(act, game)).toContain('withered-carrot-taken')
    })

    it('takes the fresh carrot off the picture once it is carried, and shows it fresh no more', () => {
      const { act, game } = inField()
      const carrot = game.state.currentRoom.items.find(
        (i) => i instanceof WitheredCarrot,
      )
      expect(carrot).toBeInstanceOf(WitheredCarrot)
      ;(carrot as WitheredCarrot).revive()
      expect(field(act, game)).toContain('withered-carrot-fresh')
      executeCommands(game, ['take carrot'])
      expect(field(act, game)).toContain('withered-carrot-taken')
      expect(field(act, game)).not.toContain('withered-carrot-fresh')
    })
  })

  it('answers no patch for a room without any', () => {
    const act = new Act1()
    const game = new Game([act])
    expect(appliedPatchIds(act, 'NoSuchRoom', game.state)).toEqual([])
  })

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s: every patch carries its rule, a thing patch its area, and the id ending agrees with the rule',
    (_name, make) => {
      const act = make()
      const faults: string[] = []
      for (const room of Object.keys(act.rooms)) {
        const variants = ['', ...act.rooms[room].pictureVariants()]
        for (const variant of variants)
          for (const patch of act.roomPatches(room, variant)) {
            const at = `${room} ${patch.id}`
            if (patch.when === undefined) faults.push(`${at}: no rule`)
            else if (typeof patch.when === 'string') {
              if (patch.area === undefined) faults.push(`${at}: no area`)
              const wantsPresent = /-(appears|open)$/.test(patch.id)
              const wantsAbsent = /-(taken|gone|cut|closed)$/.test(patch.id)
              if (patch.when === 'present' && !wantsPresent)
                faults.push(`${at}: 'present' but the id does not say so`)
              if (patch.when === 'absent' && !wantsAbsent)
                faults.push(`${at}: 'absent' but the id does not say so`)
            }
          }
      }
      expect(faults).toEqual([])
    },
  )

  it('lays patches by layer then id, whatever the order of declaration', () => {
    const patch = (id: string, layer?: number): ImagePatch => ({
      id,
      title: id,
      text: id,
      when: 'present',
      ...(layer !== undefined ? { layer } : {}),
    })
    // The id order (a, b) and the layer order (b, a) disagree.
    const declared = [patch('a', 1), patch('b', 0), patch('c', 0)]
    expect(layeredIds(declared)).toEqual(['b', 'c', 'a'])
    expect(layeredIds([...declared].reverse())).toEqual(['b', 'c', 'a'])
  })

  it('lays the chapel locket over the candle light', () => {
    const patches = new Act1().roomPatches('VillageChapel')
    expect(layeredIds([...patches].reverse())).toEqual([
      'candle-lit',
      'locket-appears',
    ])
    expect(patches.find((p) => p.id === 'locket-appears')?.layer).toBe(1)
  })

  it('lists the forest path stick and snare as lying over the cut vines, the cut snare over the snare', () => {
    const patches = new Act1().roomPatches('ForestPath')
    const overOf = (id: string): string | undefined =>
      patches.find((p) => p.id === id)?.over
    expect(overOf('vines-cut')).toBeUndefined()
    expect(overOf('stick-appears')).toBe('vines-cut')
    expect(overOf('snare-appears')).toBe('vines-cut')
    expect(overOf('snare-cut')).toBe('snare-appears')
    const stick = patches.find((p) => p.id === 'stick-appears')
    expect(stick && listedPatch(stick).over).toBe('vines-cut')
  })

  it('lays the ancient grove way south and silver leaves over the tree spirit, the leaves on top', () => {
    const patches = new Act2().roomPatches('AncientGrove')
    const way = patches.find((p) => p.id === 'exit-south-open')
    expect(way && listedPatch(way).over).toBe('ancient-tree-spirit-appears')
    expect(patches.find((p) => p.id === 'silver-leaves-appears')?.over).toBe(
      'ancient-tree-spirit-appears',
    )
    expect(layeredIds(patches)).toEqual([
      'ancient-tree-spirit-appears',
      'exit-south-open',
      'silver-leaves-appears',
    ])
  })

  it('merges the Act 2 patches that always show together and stacks those that follow another', () => {
    const act = new Act2()
    const ids = (room: string): string[] =>
      act.roomPatches(room).map((p) => p.id)
    const overOf = (room: string, id: string): string | undefined =>
      act.roomPatches(room).find((p) => p.id === id)?.over
    // One patch for what changes in the same turn.
    expect(ids('GreendaleGates')).not.toContain('exit-north-open')
    expect(ids('ForestEntrance')).not.toContain('exit-south-open')
    // A patch that always follows another lies over it.
    expect(overOf('GreendaleGates', 'city-map-appears')).toBe(
      'gate-captain-gone',
    )
    expect(overOf('ForestEntrance', 'caravan-appears')).toBe('ravine-appears')
    expect(overOf('SilverStagInn', 'exit-east-open')).toBe('room-key-gone')
    expect(overOf('AncientGrove', 'silver-leaves-appears')).toBe(
      'ancient-tree-spirit-appears',
    )
    expect(overOf('WhisperingGlade', 'crystal-clear-water-appears')).toBe(
      'water-nymphs-appears',
    )
    expect(overOf('WhisperingGlade', 'moonflowers-appears')).toBe(
      'water-nymphs-appears',
    )
  })

  it.each(ACTS.map((make) => [make().name, make] as const))(
    'of %s lays every patch that lies over another on a higher layer',
    (_name, make) => {
      const act = make()
      for (const room of Object.keys(act.rooms)) {
        const patches = act.roomPatches(room)
        for (const patch of patches) {
          if (patch.over === undefined) continue
          const under = patches.find((p) => p.id === patch.over)
          expect(
            under,
            `${room}/${patch.id} lies over a patch of the room`,
          ).toBeDefined()
          expect(patch.layer ?? 0, `${room}/${patch.id}`).toBeGreaterThan(
            under?.layer ?? 0,
          )
        }
      }
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
          const declared = act.roomPatches(room).map((p) => p.id)
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
      // Nor is the fox kit cut free (a mercy the path skips), so its snare-cut patch never applies.
      const otherEndings = new Set([
        'wound-sealed',
        'malakar-kneeling',
        'snare-cut',
      ])
      const never: string[] = []
      for (const room of Object.keys(act.rooms))
        for (const patch of act.roomPatches(room))
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
