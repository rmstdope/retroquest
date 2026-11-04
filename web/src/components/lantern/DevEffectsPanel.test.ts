// @vitest-environment jsdom
/** The dev build's room effects panel: a slider per effect of the room the music plays in. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DevEffectsPanel from './DevEffectsPanel.vue'
import { useGameStore } from '@/stores/useGameStore'
import { useEffectMixStore } from '@/stores/useEffectMixStore'

describe('DevEffectsPanel', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true })),
    )
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.unstubAllGlobals()
  })

  /** The panel in Act I's room `roomKey`, in `soundState`. */
  function panelIn(roomKey: string, soundState = ''): VueWrapper {
    const game = useGameStore()
    game.musicActName = 'Act1'
    game.musicRoomKey = roomKey
    game.musicSoundState = soundState
    wrapper = mount(DevEffectsPanel)
    return wrapper
  }

  /** The panel's row for effect `id`. */
  function row(w: VueWrapper, id: string) {
    const found = w.findAll('.lq-fx-row').find((r) => r.text().includes(id))
    if (!found) throw new Error(`no row for ${id}`)
    return found
  }

  it("lists the room's effects with how each plays", () => {
    const w = panelIn('TheDream')
    expect(w.text()).toContain('act1-the-dream')
    expect(row(w, 'rain').text()).toContain('Loops round and round')
    expect(row(w, 'lightning').text()).toContain('every 3–8 s')
  })

  it('names the effects of the other states as not playing now', () => {
    const w = panelIn('OldMill', 'jammed')
    expect(row(w, 'mechanism-whir').text()).toContain('Only while whirring')
    expect(row(w, 'wind-gusts').text()).not.toContain('Only while')
  })

  it('says which effects other rooms share', () => {
    const w = panelIn('OldMill', 'whirring')
    expect(row(w, 'wood-creak').text()).toContain('Also in 2 other rooms')
    expect(row(w, 'mechanism-whir').text()).toContain('Only in this room')
  })

  it("sets the effect's volume in this room as the slider moves", async () => {
    const w = panelIn('TheDream')
    const slider = row(w, 'lightning').find('input[type="range"]')
    await slider.setValue('250')
    expect(useEffectMixStore().volumeOf('act1-the-dream', 'lightning')).toBe(
      2.5,
    )
    expect(row(w, 'lightning').text()).toContain('250%')
    expect(row(w, 'lightning').text()).toContain('+8.0 dB')
  })

  it('sets an effect back to 100 %', async () => {
    const w = panelIn('TheDream')
    useEffectMixStore().setVolume('act1-the-dream', 'rain', 0.5)
    await w.vm.$nextTick()
    await row(w, 'rain')
      .get('button[aria-label="Reset rain to 100%"]')
      .trigger('click')
    expect(useEffectMixStore().volumeOf('act1-the-dream', 'rain')).toBe(1)
  })

  it('plays a one-shot now, and solos a loop', async () => {
    const w = panelIn('TheDream')
    const mix = useEffectMixStore()
    await row(w, 'lightning').get('button.lq-fx-play').trigger('click')
    expect(mix.request).toMatchObject({
      track: 'act1-the-dream',
      id: 'lightning',
    })
    const solo = row(w, 'rain').get('button.lq-fx-play')
    expect(solo.text()).toBe('Solo')
    await solo.trigger('click')
    expect(mix.soloed).toEqual({ track: 'act1-the-dream', id: 'rain' })
    expect(solo.attributes('aria-pressed')).toBe('true')
  })

  it('shows whether the levels are saved, and where', async () => {
    const w = panelIn('TheDream')
    expect(w.text()).toContain('Saved')
    expect(w.text()).toContain('web/src/lantern/effectVolumes.json')
    useEffectMixStore().setVolume('act1-the-dream', 'rain', 0.5)
    await w.vm.$nextTick()
    expect(w.text()).toContain('Saving')
  })

  it('says so in a room with no effects', () => {
    const w = panelIn('NoSuchRoom')
    expect(w.text()).toContain('No effects in this room')
  })

  it('lets go of a solo when it closes, so the room is heard whole again', () => {
    const w = panelIn('TheDream')
    useEffectMixStore().toggleSolo('act1-the-dream', 'rain')
    w.unmount()
    wrapper = undefined
    expect(useEffectMixStore().soloed).toBeNull()
  })

  it('names each control after its effect, and reads the level out', async () => {
    const w = panelIn('TheDream')
    useEffectMixStore().setVolume('act1-the-dream', 'lightning', 2.5)
    await w.vm.$nextTick()
    const slider = w.get('input[aria-label="lightning volume"]')
    expect(slider.attributes('aria-valuetext')).toBe('250% (+8.0 dB)')
    expect(w.find('button[aria-label="Play lightning now"]').exists()).toBe(
      true,
    )
    expect(w.find('button[aria-label="Solo rain"]').exists()).toBe(true)
    expect(w.get('[role="status"]').text()).toContain('Saving')
  })

  it('closes', async () => {
    const w = panelIn('TheDream')
    await w.get('button[aria-label="Close room effects"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })
})
