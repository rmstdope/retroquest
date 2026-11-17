/**
 * The draw order of the Lantern stage's parts (rq-zu51): `layers.css` is the one
 * list, and nothing else states a layer's number.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const LAYERS = readFileSync(join(__dirname, 'layers.css'), 'utf8')
const COMPONENTS = join(__dirname, '..', 'components', 'lantern')

interface Layer {
  group: string
  name: string
  value: number
}

/** The layers declared in `layers.css`, in the order they are written. */
function declaredLayers(): Layer[] {
  return [
    ...LAYERS.matchAll(/--lq-z-(stage|page)-([a-z0-9-]+):\s*(-?\d+);/g),
  ].map((m) => ({ group: m[1], name: m[2], value: Number(m[3]) }))
}

/** The non-test Vue sources of the Lantern components, by file name. */
function sources(): Record<string, string> {
  const found: Record<string, string> = {}
  for (const file of readdirSync(COMPONENTS))
    if (file.endsWith('.vue'))
      found[file] = readFileSync(join(COMPONENTS, file), 'utf8')
  return found
}

describe('layers.css', () => {
  it('declares both groups, each strictly ascending, so the order reads top to bottom', () => {
    const layers = declaredLayers()
    for (const group of ['stage', 'page']) {
      const values = layers.filter((l) => l.group === group).map((l) => l.value)
      expect(values.length).toBeGreaterThan(3)
      expect(values).toEqual([...new Set(values)].sort((a, b) => a - b))
    }
  })

  it('keeps the drawers in the page group, above the words and the belt caption', () => {
    const page = Object.fromEntries(
      declaredLayers()
        .filter((l) => l.group === 'page')
        .map((l) => [l.name, l.value]),
    )
    expect(page['drawers']).toBeGreaterThan(page['belt-caption'])
    expect(page['drawers']).toBeGreaterThan(page['words'])
    expect(page['drawers']).toBeGreaterThan(page['press-ring-layer'])
  })
})

describe('the Lantern components', () => {
  it('state a layer only by name (or mark it local to the component)', () => {
    const declared = new Set(
      declaredLayers().map((l) => `${l.group}-${l.name}`),
    )
    const stray: string[] = []
    for (const [file, text] of Object.entries(sources()))
      for (const line of text.split('\n')) {
        if (/zIndex/.test(line) && !line.includes('/* local'))
          stray.push(`${file}: ${line.trim()}`)
        if (!/^\s*z-index:/.test(line)) continue
        const used = line.match(/var\(--lq-z-([a-z0-9-]+)\)/)
        if (used ? !declared.has(used[1]) : !line.includes('/* local')) {
          stray.push(`${file}: ${line.trim()}`)
        }
      }
    expect(stray).toEqual([])
  })

  it('use every declared layer', () => {
    const all = Object.values(sources()).join('\n')
    const unused = declaredLayers().filter(
      (l) => !all.includes(`var(--lq-z-${l.group}-${l.name})`),
    )
    expect(unused).toEqual([])
  })

  it('never quote another component’s layer number in a comment', () => {
    const quoted: string[] = []
    for (const [file, text] of Object.entries(sources()))
      for (const line of text.split('\n'))
        if (/z-index\s*:?\s*\(?-?\d/.test(line) && !/^\s*z-index:/.test(line))
          quoted.push(`${file}: ${line.trim()}`)
    expect(quoted).toEqual([])
  })
})

describe('LanternLayout.vue markup', () => {
  it('draws what must cover the whole stage beside the isolated `.lq-stage`, never inside it', () => {
    const lines = readFileSync(
      join(COMPONENTS, 'LanternLayout.vue'),
      'utf8',
    ).split('\n')
    const start = lines.findIndex((l) => l.includes('class="lq-stage"'))
    // The stage's own `<div>` opens a line or two above its class and closes where the nesting of divs returns to zero.
    const open = lines
      .slice(0, start + 1)
      .map((l) => /<div\b/.test(l))
      .lastIndexOf(true)
    let depth = 0
    let end = open
    for (let i = open; i < lines.length; i++) {
      depth += (lines[i].match(/<div\b/g) ?? []).length
      depth -= (lines[i].match(/<\/div>/g) ?? []).length
      if (depth === 0) {
        end = i
        break
      }
    }
    expect(end).toBeGreaterThan(start)
    const inside = lines.slice(open, end + 1).join('\n')
    const covers = [
      'lq-belt-caption',
      'lq-ring-layer',
      'lq-story-wrap',
      '<JournalDrawer',
      '<StoryDrawer',
      '<RoomTitle',
      '<SceneInterlude',
    ]
    expect(inside).toContain('<BeltOfPictures')
    for (const part of covers) expect(inside).not.toContain(part)
    for (const part of covers) expect(lines.join('\n')).toContain(part)
  })
})
