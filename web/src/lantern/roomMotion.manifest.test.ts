import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { EFFECT_TYPES } from './motionEffects'
import { appliedMotion, madeEffects } from './roomMotion'
import { roomTrackId } from './musicLists'
import type { Act } from '@/engine'

/** The images manifest the studio exported, as the game fetches it. */
const MANIFEST: Record<string, Record<string, unknown>> = JSON.parse(
  readFileSync('public/images/generated/manifest.json', 'utf8'),
)

/** The movement every room had when it was declared in the game's code (rq-m2jr.1): the effect types, in order, of each room image. */
const CARRIED_OVER: Record<string, string> = {
  // The opened shed is a picture variant of AbandonedShed, which moved with its room's effects.
  'act1-abandoned-shed-inside': 'dust,leaves',
  'act1-abandoned-shed': 'dust,leaves',
  'act1-blacksmiths-forge': 'dust,fire,smoke,embers',
  'act1-chicken-coop': 'dust,leaves',
  'act1-eliors-cottage': 'dust,fire',
  'act1-forest-path': 'dust,leaves',
  'act1-general-store': 'dust',
  'act1-hidden-glade': 'dust,leaves',
  'act1-miras-hut': 'dust',
  'act1-old-mill': 'dust',
  'act1-riverbank': 'mist',
  'act1-road-to-greendale': 'dust,leaves',
  'act1-the-dream': 'mist',
  'act1-vegetable-field': 'dust',
  'act1-village-chapel': 'dust,fire',
  'act1-village-square': 'dust,water',
  'act1-village-well': 'dust',
  'act2-ancient-grove': 'dust,leaves',
  'act2-castle-approach': 'dust,leaves',
  'act2-castle-courtyard': 'dust,leaves',
  'act2-forest-entrance': 'dust,leaves,mist',
  'act2-forest-transition': 'dust,mist',
  'act2-great-hall': 'dust',
  'act2-greendale-gates': 'dust',
  'act2-healers-house': 'dust,embers',
  'act2-heart-of-the-forest': 'dust,fireflies',
  'act2-hidden-library': 'dust',
  'act2-inn-rooms': 'dust',
  'act2-main-square': 'dust',
  'act2-market-district': 'dust',
  'act2-merchants-warehouse': 'dust',
  'act2-mountain-path': 'mist',
  'act2-residential-quarter': 'dust,leaves',
  'act2-silver-stag-inn': 'dust',
  'act2-whispering-glade': 'dust,fireflies',
}

describe('the movement the images manifest carries', () => {
  it('is, for every room, what the room moved with when the game declared it', () => {
    const got = Object.fromEntries(
      Object.keys(MANIFEST)
        .filter((id) => 'effects' in MANIFEST[id])
        .map((id) => [
          id,
          madeEffects(MANIFEST, id)
            .map((e) => e.kind)
            .join(','),
        ]),
    )
    expect(got).toEqual(CARRIED_OVER)
    expect(Object.keys(CARRIED_OVER)).toHaveLength(35)
  })

  it("carries the chapel candle's tie and the spots drawn where the old areas were", () => {
    expect(madeEffects(MANIFEST, 'act1-village-chapel')).toContainEqual(
      expect.objectContaining({ kind: 'fire', whilePatch: 'candle-lit' }),
    )
    const box = (id: string, kind: string) =>
      appliedMotion(
        madeEffects(MANIFEST, id).filter((e) => e.kind === kind),
        ['candle-lit'],
      )[0]?.box
    expect(box('act1-village-square', 'water')).toEqual({
      x: 0.413021,
      y: 0.423148,
      width: 0.15625,
      height: 0.35,
    })
    expect(box('act1-blacksmiths-forge', 'smoke')).toEqual({
      x: 0.259375,
      y: 0.006481,
      width: 0.132813,
      height: 0.65463,
    })
    expect(box('act1-blacksmiths-forge', 'fire')?.mark).toEqual({
      x: 0.321354,
      y: 0.719444,
    })
  })

  it('moves the opened shed as the shed moves', () => {
    expect(
      madeEffects(MANIFEST, 'act1-abandoned-shed-inside').map((e) => e.kind),
    ).toEqual(madeEffects(MANIFEST, 'act1-abandoned-shed').map((e) => e.kind))
    expect(madeEffects(MANIFEST, 'act1-abandoned-shed')).toHaveLength(2)
  })

  it('holds only effect types the renderer has, and a drawn spot for each spot type', () => {
    const types = EFFECT_TYPES.map((t) => t.type)
    for (const [id, image] of Object.entries(MANIFEST)) {
      const listed = (image.effects ?? []) as Array<Record<string, unknown>>
      const made = madeEffects(MANIFEST, id)
      expect(made, id).toHaveLength(listed.length)
      for (const e of made) {
        expect(types, id).toContain(e.kind)
        if (EFFECT_TYPES.find((t) => t.type === e.kind)?.spot)
          expect(e.spot, `${id} ${e.kind}`).toBeDefined()
      }
    }
  })

  it('ties an effect only to a patch the room declares', () => {
    const acts: Act[] = [new Act1(), new Act2()]
    for (const act of acts)
      for (const key of Object.keys(act.rooms)) {
        const id = roomTrackId(act.name, key)
        const patches = act.roomPatches(key).map((p) => p.id)
        for (const e of madeEffects(MANIFEST, id))
          for (const patch of [e.whilePatch, e.unlessPatch])
            if (patch) expect(patches, id).toContain(patch)
      }
  })

  it('no longer lists the spots as named areas', () => {
    for (const [id, image] of Object.entries(MANIFEST))
      for (const area of Object.keys((image.areas ?? {}) as object))
        expect(area.startsWith('motion-'), `${id} ${area}`).toBe(false)
  })
})
