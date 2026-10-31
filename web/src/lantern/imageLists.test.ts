/**
 * The game's image lists for Content Studio: one image per room of an act, with
 * its dimensions and its description free of markup.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import type { Act } from '@/engine'
import { IMAGE_HEIGHT, IMAGE_WIDTH, roomImages } from './imageLists'

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ACTS: Act[] = [new Act1(), new Act2(), new Act3(), new Act4()]

describe('roomImages', () => {
  it.each(ACTS.map((act) => [act.name, act] as const))(
    'lists every room of %s once, with slug ids',
    (_name, act) => {
      const images = roomImages(act)
      expect(images).toHaveLength(Object.keys(act.rooms).length)
      expect(new Set(images.map((i) => i.id)).size).toBe(images.length)
      for (const image of images) expect(image.id).toMatch(SLUG)
    },
  )

  it('gives each image the shared dimensions and the room name as title', () => {
    for (const act of ACTS) {
      const rooms = Object.values(act.rooms)
      roomImages(act).forEach((image, i) => {
        expect(image.width).toBe(IMAGE_WIDTH)
        expect(image.height).toBe(IMAGE_HEIGHT)
        expect(image.title).toBe(rooms[i].name)
      })
    }
  })

  it('describes each room without markup', () => {
    for (const act of ACTS)
      for (const image of roomImages(act)) {
        expect(image.description).not.toMatch(/\[[^\]]*\]/)
        expect(image.description.length).toBeGreaterThan(0)
      }
  })
})
