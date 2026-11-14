/**
 * The belt's entries on the image list: one picture for every thing that can
 * be carried and every spell of the four acts, named by what the belt shows.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import {
  ACT1_COMPLETING_COMMANDS,
  ACT1_GOLDEN_PATH,
} from '@/act1/Act1GoldenPath'
import { Act2 } from '@/act2/Act2'
import {
  ACT2_COMPLETING_COMMANDS,
  ACT2_GOLDEN_PATH,
} from '@/act2/Act2GoldenPath'
import { Act3 } from '@/act3/Act3'
import {
  ACT3_COMPLETING_COMMANDS,
  ACT3_GOLDEN_PATH,
} from '@/act3/Act3GoldenPath'
import { Act4 } from '@/act4/Act4'
import { ACT4_GOLDEN_PATH } from '@/act4/Act4GoldenPath'
import { Game, type Act } from '@/engine'
import { executeCommands } from '@/testing/gameHelpers'
import { BELT_STYLE, SPELL_PROMPTS, THING_PROMPTS } from './beltPrompts'
import { BELT_SIZE, allImages, beltImageId, beltImages } from './imageLists'

const ACTS: Act[] = [new Act1(), new Act2(), new Act3(), new Act4()]
const SLUG = /^(item|spell)-[a-z0-9]+(-[a-z0-9]+)*$/

describe('beltImageId', () => {
  it('names a thing or a spell by its kind and its name, without act', () => {
    expect(beltImageId('item', 'horseshoe')).toBe('item-horseshoe')
    expect(beltImageId('item', "mother's letter")).toBe('item-mothers-letter')
    expect(beltImageId('item', 'Crystal-clear Water')).toBe(
      'item-crystal-clear-water',
    )
    expect(beltImageId('spell', 'greater heal')).toBe('spell-greater-heal')
  })
})

describe('beltImages', () => {
  it.each(ACTS.map((act) => [act.name, act] as const))(
    'lists %s once each, square, with the shared style after a prompt',
    (_name, act) => {
      const images = beltImages(act)
      expect(images.length).toBeGreaterThan(0)
      expect(new Set(images.map((i) => i.id)).size).toBe(images.length)
      for (const image of images) {
        expect(image.id).toMatch(SLUG)
        expect([image.width, image.height]).toEqual([BELT_SIZE, BELT_SIZE])
        expect(image.text.endsWith(` ${BELT_STYLE}`)).toBe(true)
        expect(image.text.length).toBeGreaterThan(BELT_STYLE.length + 10)
      }
    },
  )

  it('gives a spell that returns in a later act one identical entry', () => {
    const entries = [ACTS[0], ACTS[2], ACTS[3]].map((act) =>
      beltImages(act).find((i) => i.id === 'spell-light'),
    )
    expect(entries.every((e) => e !== undefined)).toBe(true)
    expect(
      entries.every((e) => JSON.stringify(e) === JSON.stringify(entries[0])),
    ).toBe(true)
    expect(entries[0]?.text).toContain('cupped hands')
  })

  it('uses the agreed lines for the horseshoe', () => {
    expect(THING_PROMPTS['item-horseshoe']).toBe(
      'A heavy iron horseshoe, bent a little at one heel.',
    )
  })

  it('has a prompt for each entry and no prompt without an entry', () => {
    const ids = new Set(ACTS.flatMap((act) => beltImages(act).map((i) => i.id)))
    const prompts = Object.keys({ ...THING_PROMPTS, ...SPELL_PROMPTS })
    expect([...ids].filter((id) => !prompts.includes(id))).toEqual([])
    expect(prompts.filter((id) => !ids.has(id))).toEqual([])
  })

  it('puts the belt entries after the rooms and portraits in the act list', () => {
    const act = new Act1()
    const all = allImages(act)
    const belt = beltImages(act)
    expect(all.slice(-belt.length).map((i) => i.id)).toEqual(
      belt.map((i) => i.id),
    )
  })

  it('writes each prompt as one plain sentence', () => {
    for (const text of [
      ...Object.values(THING_PROMPTS),
      ...Object.values(SPELL_PROMPTS),
    ]) {
      expect(text).toMatch(/^[A-Z].*[.]$/)
      expect(text).not.toMatch(/[[\]]/)
      expect(text.match(/[.!?]/g)).toHaveLength(1)
    }
  })
})

describe('the belt in play', () => {
  const PATHS: [Act, string[]][] = [
    [new Act1(), [...ACT1_GOLDEN_PATH, ...ACT1_COMPLETING_COMMANDS]],
    [new Act2(), [...ACT2_GOLDEN_PATH, ...ACT2_COMPLETING_COMMANDS]],
    [new Act3(), [...ACT3_GOLDEN_PATH, ...ACT3_COMPLETING_COMMANDS]],
    [new Act4(), ACT4_GOLDEN_PATH],
  ]
  it.each(PATHS.map(([act, path]) => [act.name, act, path] as const))(
    'has a listed picture for everything %s ever puts on the belt',
    (_name, act, path) => {
      const listed = new Set(beltImages(act).map((i) => i.id))
      const game = new Game([act])
      const seen = new Set<string>()
      for (const command of path) {
        executeCommands(game, [command])
        for (const item of game.state.inventory)
          seen.add(beltImageId('item', item.name))
        for (const spell of game.state.knownSpells)
          seen.add(beltImageId('spell', spell.name))
      }
      expect([...seen].filter((id) => !listed.has(id))).toEqual([])
    },
    120_000,
  )
})
