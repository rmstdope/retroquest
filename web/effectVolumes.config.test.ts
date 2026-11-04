import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { HmrContext, ModuleNode } from 'vite'
import { effectVolumesPlugin, writeEffectVolumes } from './effectVolumes.config'

/** A fresh volumes file holding `{}`. */
function freshFile(): string {
  const file = join(mkdtempSync(join(tmpdir(), 'effect-volumes-')), 'v.json')
  writeFileSync(file, '{}\n')
  return file
}

describe('writeEffectVolumes', () => {
  it('writes well-formed volumes, rooms and effects in order', () => {
    const file = freshFile()
    expect(
      writeEffectVolumes(file, {
        'act1-the-dream': { rain: 0.8, lightning: 2.5 },
        'act1-old-mill': { 'wind-gusts': 0.5 },
      }),
    ).toBe(true)
    expect(readFileSync(file, 'utf8')).toBe(
      '{\n' +
        '  "act1-old-mill": {\n    "wind-gusts": 0.5\n  },\n' +
        '  "act1-the-dream": {\n    "lightning": 2.5,\n    "rain": 0.8\n  }\n' +
        '}\n',
    )
  })

  it.each([null, [], { t: { rain: 9 } }, { '../x': { rain: 1 } }])(
    'refuses %j and leaves the file',
    (body) => {
      const file = freshFile()
      expect(writeEffectVolumes(file, body)).toBe(false)
      expect(readFileSync(file, 'utf8')).toBe('{}\n')
    },
  )
})

describe('effectVolumesPlugin', () => {
  it('only exists under the dev server', () => {
    expect(effectVolumesPlugin(freshFile()).apply).toBe('serve')
  })

  it('does not reload the game when it writes the file, but serves it fresh next time', () => {
    const file = freshFile()
    const plugin = effectVolumesPlugin(file)
    const invalidated: ModuleNode[] = []
    const module = {} as ModuleNode
    const context = {
      file,
      modules: [module],
      server: {
        moduleGraph: {
          invalidateModule: (node: ModuleNode) => invalidated.push(node),
        },
      },
    } as unknown as HmrContext
    const hook = plugin.handleHotUpdate
    const handler = typeof hook === 'function' ? hook : hook?.handler
    expect(handler?.call(undefined as never, context)).toEqual([])
    expect(invalidated).toEqual([module])
  })

  it('leaves the updates of other files alone', () => {
    const plugin = effectVolumesPlugin(freshFile())
    const hook = plugin.handleHotUpdate
    const handler = typeof hook === 'function' ? hook : hook?.handler
    const context = { file: '/other.ts', modules: [] } as unknown as HmrContext
    expect(handler?.call(undefined as never, context)).toBeUndefined()
  })
})
