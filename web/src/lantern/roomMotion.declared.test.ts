import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import type { Act } from '@/engine'
import { allImages } from './imageLists'
import { roomTrackId } from './musicLists'
import { declaredMotion, isSpotKind, spotAreaId, spotAreas } from './roomMotion'

import { ACT1_ROOM_MOTION } from './roomMotion/act1RoomMotion'
import { ACT2_ROOM_MOTION } from './roomMotion/act2RoomMotion'

const ACTS: Array<() => Act> = [() => new Act1(), () => new Act2()]

/** Whether the studio has made a painting of the room. */
function painted(act: Act, key: string): boolean {
  return existsSync(`public/images/generated/${roomTrackId(act.name, key)}.png`)
}

describe('the declared movement of the rooms', () => {
  it('belongs to real rooms', () => {
    const declared: Array<[Act, Record<string, unknown>]> = [
      [new Act1(), ACT1_ROOM_MOTION],
      [new Act2(), ACT2_ROOM_MOTION],
    ]
    for (const [act, lists] of declared)
      for (const key of Object.keys(lists))
        expect(Object.keys(act.rooms), `${act.name} ${key}`).toContain(key)
  })

  it('has an entry, possibly empty, for every room that had a painting when it was made', () => {
    let covered = 0
    const declared: Array<[Act, Record<string, unknown>]> = [
      [new Act1(), ACT1_ROOM_MOTION],
      [new Act2(), ACT2_ROOM_MOTION],
    ]
    for (const [act, lists] of declared)
      for (const key of Object.keys(act.rooms)) {
        if (!painted(act, key)) continue
        covered++
        expect(Object.keys(lists), `${act.name} ${key}`).toContain(key)
      }
    expect(covered).toBe(34)
  })

  it('ties an effect only to a patch the room declares', () => {
    for (const make of ACTS) {
      const act = make()
      for (const key of Object.keys(act.rooms)) {
        const patches = act.roomPatches(key).map((p) => p.id)
        for (const e of declaredMotion(act.name, key))
          for (const id of [e.whilePatch, e.unlessPatch])
            if (id) expect(patches, `${act.name} ${key}`).toContain(id)
      }
    }
  })

  it('asks the studio for the spot of every kind a room runs, once, with the rooms areas', () => {
    for (const make of ACTS) {
      const act = make()
      const images = allImages(act)
      for (const key of Object.keys(act.rooms)) {
        const kinds = declaredMotion(act.name, key)
          .map((e) => e.kind)
          .filter(isSpotKind)
        const ids = spotAreas(act.name, key).map((a) => a.id)
        expect(ids).toEqual(
          [...new Set(kinds)]
            .sort(
              (a, b) => ids.indexOf(spotAreaId(a)) - ids.indexOf(spotAreaId(b)),
            )
            .map(spotAreaId),
        )
        const image = images.find((i) => i.id === roomTrackId(act.name, key))
        const listed = (image?.areas ?? []).map((a) => a.id)
        for (const id of ids) expect(listed).toContain(id)
        expect(new Set(listed).size).toBe(listed.length)
      }
    }
  })

  it('moves at least one room of each kind', () => {
    const kinds = new Set(
      ACTS.flatMap((make) => {
        const act = make()
        return Object.keys(act.rooms).flatMap((k) =>
          declaredMotion(act.name, k).map((e) => e.kind),
        )
      }),
    )
    expect([...kinds].sort()).toEqual([
      'dust',
      'embers',
      'fire',
      'fireflies',
      'leaves',
      'mist',
      'smoke',
      'water',
    ])
  })
})
