import { describe, it, expect } from 'vitest'
import { portraitUrl, roomPictureUrl } from './roomPicture'
import { roomTrackId } from './musicLists'
import { characterImages } from './imageLists'
import { Act1 } from '@/act1/Act1'

describe('roomPictureUrl', () => {
  it("is the generated picture named by the room's image id", () => {
    expect(roomPictureUrl('Act1', 'ElioCottage')).toBe(
      `${import.meta.env.BASE_URL}images/generated/${roomTrackId('Act1', 'ElioCottage')}.png`,
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
    const ids = characterImages(act).map((image) => image.id)
    expect(cast.length).toBe(ids.length)
    expect(
      cast.map((entry) => roomTrackId(act.name, `Portrait ${entry.key}`)),
    ).toEqual(ids)
  })
})
