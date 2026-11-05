/**
 * The scenes the game declares for Content Studio (`tts/act<N>/scenes.json`):
 * one per room, under its music track's id, with the room's sound states.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { roomTrackId } from './musicLists'
import { actScenes, PLAIN_SOUND_STATE, sceneStateOf } from './sceneLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Reads a JSON file of the repository (relative to its root). */
function readJson<T>(path: string): T {
  return JSON.parse(
    readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'),
  ) as T
}

describe('actScenes', () => {
  const scenes = actScenes(new Act1())
  const byId = new Map(scenes.map((scene) => [scene.id, scene]))

  it("declares each room as a scene under its track's id, titled as the room", () => {
    const act = new Act1()
    expect(scenes.map((scene) => scene.id)).toEqual(
      Object.keys(act.rooms).map((key) => roomTrackId(act.name, key)),
    )
    expect(byId.get('act1-general-store')?.title).toBe('General Store')
    expect(byId.get('act1-general-store')).not.toHaveProperty('name')
  })

  it("names a room's default '' state plain, first", () => {
    expect(byId.get('act1-general-store')?.states).toEqual([
      PLAIN_SOUND_STATE,
      'cat-home',
    ])
  })

  it('lists named states only where every state is named, the default first', () => {
    expect(byId.get('act1-vegetable-field')?.states).toEqual([
      'withered',
      'green',
    ])
    expect(byId.get('act1-old-mill')?.states).toEqual(['whirring', 'jammed'])
  })

  it('declares no states for a room that always sounds the same, and no triggers where none are fired', () => {
    expect(byId.get('act1-the-dream')).toMatchObject({
      states: [],
      triggers: [],
    })
  })

  it('lists the triggers a room declares', () => {
    expect(byId.get('act1-general-store')?.triggers).toEqual([
      'patches-returns',
    ])
  })

  it('gives every scene, state and trigger a slug, unique across the game', () => {
    const all = [new Act1(), new Act2(), new Act3(), new Act4()].flatMap(
      actScenes,
    )
    const ids = all.map((scene) => scene.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const scene of all) {
      expect(scene.id).toMatch(SLUG)
      for (const name of [...scene.states, ...scene.triggers])
        expect(name).toMatch(SLUG)
      expect(new Set(scene.states).size).toBe(scene.states.length)
    }
  })

  it('declares the state every room is in at the start of its act, and its default first', () => {
    for (const make of [
      () => new Act1(),
      () => new Act2(),
      () => new Act3(),
      () => new Act4(),
    ]) {
      const act = make()
      const game = new Game([act])
      const declared = new Map(actScenes(act).map((s) => [s.id, s.states]))
      for (const [key, room] of Object.entries(act.rooms)) {
        const states = declared.get(roomTrackId(act.name, key)) ?? []
        const now = sceneStateOf(room.soundState(game.state))
        if (states.length === 0) expect(now).toBe(PLAIN_SOUND_STATE)
        else expect(states[0]).toBe(now)
      }
    }
  })
})

describe('sceneStateOf', () => {
  it("reads the game's '' as plain, and a named state as itself", () => {
    expect(sceneStateOf('')).toBe(PLAIN_SOUND_STATE)
    expect(sceneStateOf('lit')).toBe('lit')
  })
})

describe('content-studio.json', () => {
  it('declares where the scenes and their mix live', () => {
    const project = readJson<{ scenes: { from: unknown; mix: unknown } }>(
      'content-studio.json',
    )
    expect(project.scenes.from).toEqual({ part: 'tts/{part}/scenes.json' })
    expect(project.scenes.mix).toBe('web/src/lantern/scenes/{part}.mix.json')
  })
})
