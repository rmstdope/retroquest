import { describe, it, expect, vi } from 'vitest'
import {
  eliorPortraitUrl,
  pictureExists,
  portraitUrl,
  roomPictureUrl,
  setPictureProbe,
} from './roomPicture'
import { roomTrackId } from './musicLists'
import { ELIOR_PORTRAIT_ID, characterImages, portraitId } from './imageLists'
import { Act1 } from '@/act1/Act1'

describe('roomPictureUrl', () => {
  it("is the generated picture named by the room's image id", () => {
    expect(roomPictureUrl('Act1', 'ElioCottage')).toBe(
      `${import.meta.env.BASE_URL}images/generated/${roomTrackId('Act1', 'ElioCottage')}.png`,
    )
  })

  it("names another picture of the room by the room's id and its variant", () => {
    expect(roomPictureUrl('Act1', 'AbandonedShed', 'inside')).toBe(
      `${import.meta.env.BASE_URL}images/generated/${roomTrackId('Act1', 'AbandonedShed')}-inside.png`,
    )
    expect(roomPictureUrl('Act1', 'AbandonedShed', '')).toBe(
      roomPictureUrl('Act1', 'AbandonedShed'),
    )
  })

  it('is empty while no room is known', () => {
    expect(roomPictureUrl('', '')).toBe('')
    expect(roomPictureUrl('Act1', '')).toBe('')
  })
})

describe('portraitUrl', () => {
  it("is the file named by the character's id in the act's image list", () => {
    const act = new Act1()
    const mira = characterImages(act).find((image) => image.title === 'Mira')
    expect(mira).toBeDefined()
    expect(portraitUrl(act.name, 'Mira')).toBe(
      `${import.meta.env.BASE_URL}images/generated/${mira?.id}.png`,
    )
  })

  it('is the same file in every act for a character who appears in several', () => {
    const url = (act: string) => portraitUrl(act, 'Mira')
    expect(url('Act3')).toBe(url('Act1'))
    expect(url('Act4')).toBe(url('Act1'))
    expect(url('Act1')).toMatch(/images\/generated\/portrait-mira\.png$/)
  })

  it('keeps the act in the file of a character of one act', () => {
    expect(portraitUrl('Act1', 'Deer')).toMatch(/act1-portrait-deer\.png$/)
  })

  it('is empty without an act or a class', () => {
    expect(portraitUrl('', 'Mira')).toBe('')
    expect(portraitUrl('Act1', '')).toBe('')
  })
})

describe('the characters of each act and their portraits', () => {
  it('lists the same portraits as the act image list', async () => {
    const { Game } = await import('@/engine')
    const { GameController } = await import('@/engine/GameController')
    const act = new Act1()
    const cast = new GameController(new Game([act])).getActCharacters()
    // Elior is no character of the cast; his portrait is listed after theirs.
    const ids = characterImages(act)
      .map((image) => image.id)
      .filter((id) => id !== ELIOR_PORTRAIT_ID)
    expect(cast.length).toBe(ids.length)
    expect(cast.map((entry) => portraitId(act.name, entry.key))).toEqual(ids)
  })
})

describe('eliorPortraitUrl', () => {
  it('names the one shared Elior portrait file', () => {
    expect(eliorPortraitUrl()).toMatch(
      /images\/generated\/portrait-elior\.png$/,
    )
  })
})

describe('pictureExists', () => {
  it('asks the probe once per file and remembers the answer', async () => {
    const probe = vi.fn((url: string) => Promise.resolve(url.endsWith('a.png')))
    setPictureProbe(probe)
    expect(await pictureExists('/x/a.png')).toBe(true)
    expect(await pictureExists('/x/a.png')).toBe(true)
    expect(await pictureExists('/x/b.png')).toBe(false)
    expect(probe).toHaveBeenCalledTimes(2)
    setPictureProbe(null)
  })
})
