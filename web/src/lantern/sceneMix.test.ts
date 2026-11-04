/**
 * The scene mix Content Studio writes (`scenes/act<N>.mix.json`): how the game
 * reads it, scene by scene, and that the committed mixes name only scenes,
 * states and clips the game has.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { roomTrackId } from './musicLists'
import { GAME_EFFECTS } from './effectLists'
import {
  MAX_SCENE_LEVEL,
  readSceneMix,
  SCENE_MIX,
  sceneMixOf,
} from './sceneMix'
import type { SceneDeclaration } from './sceneLists'

const STORE = roomTrackId('Act1', 'GeneralStore')
const DREAM = roomTrackId('Act1', 'TheDream')

/** Reads a JSON file of the repository (relative to its root). */
function readJson(path: string): unknown {
  return JSON.parse(
    readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'),
  )
}

describe('readSceneMix', () => {
  it('reads every way an effect plays, with its state and level', () => {
    const mix = readSceneMix({
      scenes: {
        store: {
          music: { track: 'store', level: 2.5 },
          effects: [
            { id: 'bell', play: { mode: 'once', afterSeconds: 0 }, level: 0.6 },
            {
              id: 'clink',
              play: { mode: 'random', everySeconds: [15, 30] },
              level: 0,
            },
            {
              id: 'purr',
              play: { mode: 'loop' },
              state: 'cat-home',
              level: MAX_SCENE_LEVEL,
            },
            {
              id: 'door',
              play: { mode: 'trigger', trigger: 'door-opens' },
              level: 1,
            },
          ],
        },
      },
    })
    expect(mix).toEqual({
      store: {
        music: { track: 'store', level: 2.5 },
        effects: [
          { id: 'bell', play: { mode: 'once', afterSeconds: 0 }, level: 0.6 },
          {
            id: 'clink',
            play: { mode: 'random', everySeconds: [15, 30] },
            level: 0,
          },
          {
            id: 'purr',
            play: { mode: 'loop' },
            state: 'cat-home',
            level: 3,
          },
          {
            id: 'door',
            play: { mode: 'trigger', trigger: 'door-opens' },
            level: 1,
          },
        ],
      },
    })
  })

  it('reads a random wait from 0 seconds, up to a longest no shorter', () => {
    for (const every of [
      [0, 4],
      [0, 0],
      [5, 5],
    ])
      expect(
        readSceneMix({
          scenes: {
            rain: {
              effects: [
                {
                  id: 'drip',
                  play: { mode: 'random', everySeconds: every },
                  level: 1,
                },
              ],
            },
          },
        }),
        JSON.stringify(every),
      ).toEqual({
        rain: {
          effects: [
            {
              id: 'drip',
              play: { mode: 'random', everySeconds: every },
              level: 1,
            },
          ],
        },
      })
  })

  it('reads a null track as no music, and absent music and effects as none given', () => {
    expect(
      readSceneMix({
        scenes: { quiet: { music: { track: null, level: 1 } }, bare: {} },
      }),
    ).toEqual({
      quiet: { music: { track: null, level: 1 }, effects: [] },
      bare: { effects: [] },
    })
  })

  it('leaves out a scene with a bad entry and reads the others', () => {
    const good = { effects: [{ id: 'rain', play: { mode: 'loop' }, level: 1 }] }
    const bad: unknown[] = [
      'loud',
      { music: { track: 'x', level: 3.5 } },
      { music: { track: 7, level: 1 } },
      { music: { track: 'x' } },
      { effects: 'rain' },
      { effects: [{ id: 'rain', play: { mode: 'loop' } }] },
      { effects: [{ id: 'rain', play: { mode: 'loop' }, level: -0.1 }] },
      { effects: [{ id: 'rain', play: { mode: 'drone' }, level: 1 }] },
      { effects: [{ play: { mode: 'loop' }, level: 1 }] },
      {
        effects: [{ id: 'rain', play: { mode: 'loop' }, state: 3, level: 1 }],
      },
      {
        effects: [
          {
            id: 'rain',
            play: { mode: 'random', everySeconds: [5, 4] },
            level: 1,
          },
        ],
      },
      {
        effects: [
          {
            id: 'rain',
            play: { mode: 'random', everySeconds: [-1, 4] },
            level: 1,
          },
        ],
      },
      {
        effects: [
          {
            id: 'rain',
            play: { mode: 'random', everySeconds: [5] },
            level: 1,
          },
        ],
      },
      {
        effects: [
          { id: 'rain', play: { mode: 'once', afterSeconds: -1 }, level: 1 },
        ],
      },
      {
        effects: [{ id: 'rain', play: { mode: 'trigger' }, level: 1 }],
      },
    ]
    for (const entry of bad)
      expect(
        readSceneMix({ scenes: { good, bad: entry } }),
        JSON.stringify(entry),
      ).toEqual({ good: { effects: good.effects } })
  })

  it('reads a file that is not a mix as an empty one', () => {
    for (const raw of [undefined, null, [], 'mix', { scenes: [] }, {}])
      expect(readSceneMix(raw)).toEqual({})
  })
})

describe('sceneMixOf', () => {
  it('finds a scene of the mix, and nothing for one it has no entry for', () => {
    const mix = readSceneMix({ scenes: { store: {} } })
    expect(sceneMixOf('store', mix)).toEqual({ effects: [] })
    expect(sceneMixOf('market', mix)).toBeUndefined()
    expect(sceneMixOf('toString', mix)).toBeUndefined()
  })

  it('reads the committed mixes of every act', () => {
    expect(sceneMixOf(DREAM)?.effects).toContainEqual({
      id: 'rain',
      play: { mode: 'loop' },
      level: 1,
    })
    expect(sceneMixOf(STORE)?.effects).toContainEqual({
      id: 'cat-purr',
      play: { mode: 'loop' },
      state: 'cat-home',
      level: 1,
    })
  })
})

describe('the committed mixes', () => {
  const declared = ['act1', 'act2', 'act3', 'act4'].flatMap(
    (part) => readJson(`tts/${part}/scenes.json`) as SceneDeclaration[],
  )
  const scenes = new Map(declared.map((scene) => [scene.id, scene]))
  const clips = new Map(GAME_EFFECTS.map((clip) => [clip.id, clip]))

  it('read whole: no scene is left out for a problem', () => {
    const files = readdirSync(new URL('./scenes/', import.meta.url))
    expect(files).toContain('act1.mix.json')
    for (const file of files) {
      const raw = readJson(`web/src/lantern/scenes/${file}`) as {
        scenes: Record<string, unknown>
      }
      expect(Object.keys(readSceneMix(raw))).toEqual(Object.keys(raw.scenes))
    }
  })

  it('name only declared scenes and their states, and only listed clips', () => {
    for (const [id, entry] of Object.entries(SCENE_MIX)) {
      const scene = scenes.get(id)
      expect(scene, id).toBeDefined()
      for (const effect of entry.effects) {
        expect(clips.has(effect.id), `${id}: ${effect.id}`).toBe(true)
        if (effect.state !== undefined)
          expect(scene?.states, `${id}: ${effect.id}`).toContain(effect.state)
        if (effect.play.mode === 'trigger')
          expect(scene?.triggers, `${id}: ${effect.id}`).toContain(
            effect.play.trigger,
          )
      }
    }
  })

  it('loop a clip made to loop, and play a one-shot now and then or once', () => {
    for (const entry of Object.values(SCENE_MIX))
      for (const effect of entry.effects)
        if (effect.play.mode !== 'trigger')
          expect(effect.play.mode === 'loop', effect.id).toBe(
            clips.get(effect.id)?.loops === true,
          )
  })

  it('play every listed clip somewhere', () => {
    const played = new Set(
      Object.values(SCENE_MIX).flatMap((entry) =>
        entry.effects.map((effect) => effect.id),
      ),
    )
    for (const clip of GAME_EFFECTS) expect(played).toContain(clip.id)
  })
})
