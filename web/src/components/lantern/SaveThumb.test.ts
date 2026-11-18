// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SaveThumb from './SaveThumb.vue'
import type { SavePicture, SaveSlot } from '@/types/bridge'
import { setPictureProbe } from '@/lantern/roomPicture'

const PICTURE: SavePicture = {
  actName: 'Act1',
  roomKey: 'Forge',
  variant: '',
  patchIds: [],
}

function save(picture?: SavePicture): SaveSlot {
  return {
    slot: 1,
    act: 'Act 1',
    room: 'The Forge',
    timestamp: null,
    quests: null,
    ...(picture ? { picture } : {}),
  }
}

describe('SaveThumb', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    setPictureProbe(() => Promise.resolve(true))
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    setPictureProbe(null)
  })

  async function mountThumb(card: SaveSlot): Promise<VueWrapper> {
    wrapper = mount(SaveThumb, {
      props: { save: card },
      attrs: { class: 'given' },
    })
    await flushPromises()
    return wrapper
  }

  it("shows the save's room picture, hidden from a screen reader, with the class it is given", async () => {
    const w = await mountThumb(save(PICTURE))
    const thumb = w.get('.lq-save-thumb')
    expect(thumb.classes()).toContain('given')
    expect(thumb.attributes('aria-hidden')).toBe('true')
    expect(thumb.get('img').attributes('src')).toContain('act1-forge')
  })

  it('shows nothing for a save that kept no picture, or whose picture is not made', async () => {
    expect((await mountThumb(save())).find('.lq-save-thumb').exists()).toBe(
      false,
    )
    wrapper?.unmount()
    setPictureProbe(() => Promise.resolve(false))
    expect(
      (await mountThumb(save(PICTURE))).find('.lq-save-thumb').exists(),
    ).toBe(false)
  })

  it('draws the patches over the picture they belong to', async () => {
    const w = await mountThumb(save({ ...PICTURE, patchIds: ['lamp'] }))
    const sources = w.findAll('img').map((img) => img.attributes('src'))
    expect(sources).toHaveLength(2)
    expect(sources[1]).toContain('lamp')
  })

  it('follows a new save given to it', async () => {
    const w = await mountThumb(save())
    await w.setProps({ save: save(PICTURE) })
    await flushPromises()
    expect(w.find('.lq-save-thumb').exists()).toBe(true)
  })
})
