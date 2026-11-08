import { describe, it, expect } from 'vitest'
import { Game, GameController, type MapPlace } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from '../act1/Act1'
import { ACT1_GOLDEN_PATH } from '../act1/Act1GoldenPath'
import { Act4 } from '../act4/Act4'
import { ACT4_GOLDEN_PATH } from '../act4/Act4GoldenPath'
import { layoutMap } from './mapLayout'

function place(
  key: string,
  visited: boolean,
  exits: Record<string, string> = {},
  current = false,
): MapPlace {
  return {
    key,
    name: key,
    visited,
    current,
    exits: Object.fromEntries(
      Object.entries(exits).map(([dir, to]) => [dir, { to, label: to }]),
    ),
  }
}

function at(
  layout: ReturnType<typeof layoutMap>,
  key: string,
): [number, number] {
  const box = layout.boxes.find((b) => b.key === key)
  if (!box) throw new Error(`no box ${key}`)
  return [box.col, box.row]
}

describe('layoutMap of the village lane (rq-un37)', () => {
  it('lays the chapel and the road east of the store on its row, and the glade alone', () => {
    const game = new Game([new Act1()])
    const upToChapel = ACT1_GOLDEN_PATH.indexOf('use candle with matches')
    executeCommands(game, ACT1_GOLDEN_PATH.slice(0, upToChapel))
    const layout = layoutMap(new GameController(game).getMapPlaces())
    const [storeCol, storeRow] = at(layout, 'GeneralStore')
    expect(at(layout, 'VillageChapel')).toEqual([storeCol + 1, storeRow])
    expect(at(layout, 'RoadToGreendale')).toEqual([storeCol + 2, storeRow])
    const gladePaths = layout.paths.filter(
      (path) => path.from === 'HiddenGlade' || path.to === 'HiddenGlade',
    )
    expect(gladePaths).toHaveLength(1)
  })
})

describe('layoutMap of the Act IV fortress (rq-pxuj)', () => {
  it("lays the Mirror Labyrinth north of the Outer Courtyard and joins them, seen from the Parents' Vault", () => {
    const game = new Game([new Act4()])
    const intoParentsVault = ACT4_GOLDEN_PATH.indexOf('examine memories')
    executeCommands(game, ACT4_GOLDEN_PATH.slice(0, intoParentsVault))
    const layout = layoutMap(new GameController(game).getMapPlaces())
    const [yardCol, yardRow] = at(layout, 'OuterCourtyard')
    expect(at(layout, 'MirrorLabyrinth')).toEqual([yardCol, yardRow - 1])
    expect(
      layout.paths.some(
        (path) =>
          [path.from, path.to].sort().join() ===
          'MirrorLabyrinth,OuterCourtyard',
      ),
    ).toBe(true)
  })
})

describe('layoutMap', () => {
  it('shows a lone place by itself', () => {
    const layout = layoutMap([place('a', true, {}, true)])
    expect(layout.boxes).toHaveLength(1)
    expect(layout.paths).toEqual([])
    expect(at(layout, 'a')).toEqual([0, 0])
  })

  it('lays the compass ways out north, east, south and west', () => {
    const layout = layoutMap([
      place('c', true, { north: 'n', east: 'e', south: 's', west: 'w' }, true),
      place('n', false),
      place('e', false),
      place('s', false),
      place('w', false),
    ])
    expect(at(layout, 'n')).toEqual([0, -1])
    expect(at(layout, 'e')).toEqual([1, 0])
    expect(at(layout, 's')).toEqual([0, 1])
    expect(at(layout, 'w')).toEqual([-1, 0])
  })

  it('puts up and down diagonally to the right, tagged', () => {
    const layout = layoutMap([
      place('c', true, { up: 'u', down: 'd', secret_passage: 'p' }, true),
      place('u', true),
      place('d', true),
      place('p', true),
    ])
    expect(at(layout, 'u')).toEqual([1, -1])
    expect(at(layout, 'd')).toEqual([1, 1])
    const tags = layout.paths.map((p) => p.tag)
    expect(tags).toEqual(['↑ Up', '↓ Down', 'Secret Passage'])
  })

  it('dashes a path only when one end is not visited, and tags no compass path', () => {
    const layout = layoutMap([
      place('a', true, { east: 'b', south: 'c' }, true),
      place('b', true, { west: 'a' }),
      place('c', false),
    ])
    expect(layout.paths).toHaveLength(2)
    const ab = layout.paths.find((p) => p.to === 'b')
    const ac = layout.paths.find((p) => p.to === 'c')
    expect(ab).toMatchObject({ dashed: false, tag: null })
    expect(ac).toMatchObject({ dashed: true, tag: null })
  })

  it('joins two visited places solidly even when one way was never walked', () => {
    const layout = layoutMap([
      place('a', true, { east: 'b' }, true),
      place('b', true),
    ])
    expect(layout.paths[0].dashed).toBe(false)
  })

  it('opens a column so that no two boxes overlap and the way is still drawn', () => {
    // Up from c lands on (1,-1), where east of n would also land.
    const layout = layoutMap([
      place('c', true, { north: 'n', up: 'u' }, true),
      place('n', true, { east: 'x' }),
      place('u', true),
      place('x', true),
    ])
    const cells = layout.boxes.map((b) => `${b.col},${b.row}`)
    expect(new Set(cells).size).toBe(cells.length)
    const [nCol, nRow] = at(layout, 'n')
    expect(at(layout, 'x')).toEqual([nCol + 1, nRow])
    expect(layout.paths.map((p) => [p.from, p.to])).toContainEqual(['n', 'x'])
  })

  it('marks the current place', () => {
    const layout = layoutMap([
      place('a', true, { east: 'b' }),
      place('b', true, {}, true),
    ])
    expect(layout.boxes.filter((b) => b.current).map((b) => b.key)).toEqual([
      'b',
    ])
  })
})

describe('layoutMap: places the current place cannot walk to', () => {
  it('draws a visited place with no open way to it, below the rest', () => {
    const layout = layoutMap([
      place('hut', true, {}),
      place('a', true, { east: 'b' }, true),
      place('b', true),
    ])
    expect(layout.boxes.map((b) => b.key).sort()).toEqual(['a', 'b', 'hut'])
    const [, hutRow] = at(layout, 'hut')
    expect(hutRow).toBeGreaterThan(0)
  })

  it('lays the cut-off group out from its first place, seen places included', () => {
    const layout = layoutMap([
      place('a', true, {}, true),
      place('x', true, { south: 'y' }),
      place('y', false),
    ])
    expect(layout.boxes).toHaveLength(3)
    expect(layout.paths.map((p) => [p.from, p.to, p.dashed])).toEqual([
      ['x', 'y', true],
    ])
  })
})

describe('layoutMap: paths and boxes', () => {
  it('keeps a lengthened path from running through a box', () => {
    // East of a is taken by b; going up from a needs (1,-1), free; but
    // north-then-east of c collides: x must not hide behind u.
    const layout = layoutMap([
      place('a', true, { east: 'b', north: 'n' }, true),
      place('b', true),
      place('n', true, { east: 'x', south: 'a' }),
      place('x', true),
    ])
    for (const path of layout.paths) {
      const from = layout.boxes.find((b) => b.key === path.from)!
      const to = layout.boxes.find((b) => b.key === path.to)!
      for (const box of layout.boxes) {
        if (box === from || box === to) continue
        const onRow = box.row === from.row && from.row === to.row
        const between =
          box.col > Math.min(from.col, to.col) &&
          box.col < Math.max(from.col, to.col)
        expect(onRow && between).toBe(false)
      }
    }
  })

  it('leaves out a way between two placed boxes that would cross a third', () => {
    const layout = layoutMap([
      place('a', true, { east: 'b' }, true),
      place('b', true, { east: 'c' }),
      place('c', true, { west: 'a' }),
    ])
    expect(layout.paths.map((p) => [p.from, p.to])).toEqual([
      ['a', 'b'],
      ['b', 'c'],
    ])
  })
})

describe('layoutMap: cut-off groups', () => {
  it('never draws a compass way against its heading', () => {
    // x is cut off from a; its west way back to a would be drawn crooked.
    const layout = layoutMap([
      place('a', true, {}, true),
      place('x', true, { west: 'a', south: 'y' }),
      place('y', true, { north: 'x' }),
    ])
    expect(layout.paths.map((p) => [p.from, p.to])).toEqual([['x', 'y']])
  })

  it('keeps two cut-off groups clear of each other and of the main map', () => {
    const layout = layoutMap([
      place('a', true, { north: 'b' }, true),
      place('b', true),
      place('x', true, { north: 'x2' }),
      place('x2', true),
      place('y', true, { north: 'y2' }),
      place('y2', true),
    ])
    const cells = layout.boxes.map((b) => `${b.col},${b.row}`)
    expect(new Set(cells).size).toBe(cells.length)
    expect(layout.paths).toHaveLength(3)
  })
})
