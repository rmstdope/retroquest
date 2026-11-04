/** Which chosen effect clips play in a scene, as the scene mix gives them. */
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ChosenManifest } from './chosenMusic'
import { loadChosenEffects, sceneClips } from './chosenEffects'

const effects: ChosenManifest = {
  rain: { file: 'rain.mp3', duration: 20 },
  lightning: { file: 'lightning.mp3', duration: 4.2 },
}

describe('sceneClips', () => {
  const generated = '/audio/soundeffects/generated/'

  it('plays each row of the scene with its chosen take, as it plays, in its state and at its level', () => {
    expect(
      sceneClips(
        {
          effects: [
            { id: 'rain', play: { mode: 'loop' }, state: 'storm', level: 1 },
            {
              id: 'lightning',
              play: { mode: 'random', everySeconds: [3, 8] },
              level: 2.5,
            },
            {
              id: 'lightning',
              play: { mode: 'once', afterSeconds: 0 },
              level: 0.5,
            },
          ],
        },
        effects,
      ),
    ).toEqual([
      {
        url: generated + effects.rain.file,
        play: { mode: 'loop' },
        state: 'storm',
        volume: 1,
      },
      {
        url: generated + effects.lightning.file,
        play: { mode: 'random', everySeconds: [3, 8] },
        volume: 2.5,
      },
      {
        url: generated + effects.lightning.file,
        play: { mode: 'once', afterSeconds: 0 },
        volume: 0.5,
      },
    ])
  })

  it('leaves out a row with no chosen take, and one the game fires', () => {
    expect(
      sceneClips(
        {
          effects: [
            { id: 'hearth-fire', play: { mode: 'loop' }, level: 1 },
            {
              id: 'rain',
              play: { mode: 'trigger', trigger: 'door-opens' },
              level: 1,
            },
            { id: 'toString', play: { mode: 'loop' }, level: 1 },
          ],
        },
        effects,
      ),
    ).toEqual([])
  })

  it('plays nothing in a scene the mix has no entry for', () => {
    expect(sceneClips(undefined, effects)).toEqual([])
  })
})

describe('loadChosenEffects', () => {
  afterEach(() => vi.unstubAllGlobals())

  it("reads the effects' manifest", async () => {
    const fetched = vi.fn((_url: string) =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(effects) }),
    )
    vi.stubGlobal('fetch', fetched)
    expect(await loadChosenEffects()).toEqual(effects)
    expect(fetched.mock.calls[0][0]).toBe(
      '/audio/soundeffects/generated/manifest.json',
    )
  })

  it('takes a manifest that cannot be read as none', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    expect(await loadChosenEffects()).toEqual({})
  })
})
