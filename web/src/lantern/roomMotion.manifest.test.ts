import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { EFFECT_TYPES } from './motionEffects'
import { madeEffects } from './roomMotion'
import { roomTrackId } from './musicLists'
import type { Act } from '@/engine'

/** One effect as Content Studio keeps it in its images edits. */
interface StudioEffect {
  on: boolean
  settings: Record<string, number>
  patch?: string
  spot?: [number, number][][]
}

/** The images manifest the studio exported, as the game fetches it. */
const MANIFEST: Record<string, Record<string, unknown>> = JSON.parse(
  readFileSync('public/images/generated/manifest.json', 'utf8'),
)

/**
 * What is wrong with the effect settings `manifest` lists: a setting its
 * effect type does not take, or one outside the range the studio's slider
 * allows. Empty when every setting is one the renderer can play.
 */
function badSettings(
  manifest: Record<string, Record<string, unknown>>,
): string[] {
  const bad: string[] = []
  for (const id of Object.keys(manifest))
    for (const e of madeEffects(manifest, id)) {
      const known = EFFECT_TYPES.find((t) => t.type === e.kind)?.settings ?? []
      for (const [key, value] of Object.entries(e.settings ?? {})) {
        const setting = known.find((s) => s.id === key)
        if (!setting) bad.push(`${id} ${e.kind}: ${key} is not a setting`)
        else if (value < setting.min || value > setting.max)
          bad.push(
            `${id} ${e.kind}: ${key} ${value} is outside ${setting.min}..${setting.max}`,
          )
      }
    }
  return bad
}

describe('the movement the images manifest carries', () => {
  it('holds only settings its effect types take, each within its range', () => {
    expect(badSettings(MANIFEST)).toEqual([])
  })

  it('would be caught holding an unknown or out-of-range setting', () => {
    const broken = {
      'a-room': {
        effects: [
          { kind: 'dust', settings: { amount: 99, speed: 1 } },
          { kind: 'mist', settings: { glow: 1 } },
        ],
      },
    }
    expect(badSettings(broken)).toEqual([
      expect.stringMatching(/^a-room dust: amount 99 is outside /),
      'a-room mist: glow is not a setting',
    ])
  })

  it('is exactly what Content Studio exports from its edits, so a studio save keeps it', () => {
    const edits = JSON.parse(
      readFileSync('../content-studio/images/edits.json', 'utf8'),
    ) as { images: Record<string, { effects?: Record<string, StudioEffect> }> }
    for (const id of Object.keys(MANIFEST)) {
      const saved = edits.images[id]?.effects ?? {}
      const exported = Object.keys(saved)
        .sort()
        .filter((kind) => saved[kind].on)
        .map((kind) => {
          const { settings, patch, spot } = saved[kind]
          return {
            kind,
            settings,
            ...(patch !== undefined && { patch }),
            ...(spot && { spot }),
          }
        })
      // Compared as text: a studio save writes the keys in this order too, so any other order is a diff.
      expect(JSON.stringify(MANIFEST[id].effects ?? []), id).toBe(
        JSON.stringify(exported),
      )
    }
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
