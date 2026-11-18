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

  it('keeps its picture, asking nothing again, when given a new card for the same save', async () => {
    const w = await mountThumb(save(PICTURE))
    setPictureProbe(() => new Promise<boolean>(() => {}))
    await w.setProps({ save: { ...save(PICTURE), timestamp: 'later' } })
    await flushPromises()
    expect(w.find('.lq-save-thumb').exists()).toBe(true)
  })

  it('shows the latest save given, even when an earlier one answers last', async () => {
    const arrivals: Record<string, (found: boolean) => void> = {}
    setPictureProbe(
      (url) => new Promise<boolean>((resolve) => (arrivals[url] = resolve)),
    )
    wrapper = mount(SaveThumb, { props: { save: save(PICTURE) } })
    await flushPromises()
    const other = { ...PICTURE, roomKey: 'Mill' }
    await wrapper.setProps({ save: save(other) })
    await flushPromises()
    for (const [url, arrive] of Object.entries(arrivals))
      if (url.includes('mill')) arrive(true)
    await flushPromises()
    for (const [url, arrive] of Object.entries(arrivals))
      if (url.includes('forge')) arrive(true)
    await flushPromises()
    expect(wrapper.get('img').attributes('src')).toContain('mill')
  })

  it('loads its picture lazily, so a list of saves does not hold up the window', async () => {
    const w = await mountThumb(save(PICTURE))
    const img = w.get('img')
    expect(img.attributes('loading')).toBe('lazy')
    expect(img.attributes('decoding')).toBe('async')
  })

  it('follows a new save given to it', async () => {
    const w = await mountThumb(save())
    await w.setProps({ save: save(PICTURE) })
    await flushPromises()
    expect(w.find('.lq-save-thumb').exists()).toBe(true)
  })

  it('shows the small copy of the picture and of its patches when they exist', async () => {
    const w = await mountThumb(save({ ...PICTURE, patchIds: ['lamp'] }))
    const sources = w.findAll('img').map((img) => img.attributes('src'))
    expect(sources).toHaveLength(2)
    for (const src of sources) expect(src).toMatch(/thumbs\/.*\.webp$/)
  })

  it('falls back to the full picture where there is no small copy', async () => {
    setPictureProbe((url) => Promise.resolve(!url.includes('/thumbs/')))
    const w = await mountThumb(save({ ...PICTURE, patchIds: ['lamp'] }))
    const sources = w.findAll('img').map((img) => img.attributes('src'))
    expect(sources).toHaveLength(2)
    for (const src of sources) expect(src).toMatch(/generated\/[^/]+\.png$/)
  })

  it('asks for the small copy first and never loads the full one when the small one exists', async () => {
    const asked: string[] = []
    setPictureProbe((url) => {
      asked.push(url)
      return Promise.resolve(true)
    })
    await mountThumb(save(PICTURE))
    expect(asked).toHaveLength(1)
    expect(asked[0]).toContain('/thumbs/')
  })
})
