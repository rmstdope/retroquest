// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SpeechPortrait from './SpeechPortrait.vue'
import { speakerColor } from '@/lantern/stageSpeech'

function portrait(props: { name: string; src?: string; dim?: boolean }) {
  return mount(SpeechPortrait, {
    props: { name: props.name, src: props.src ?? '', dim: props.dim ?? false },
  })
}

describe('SpeechPortrait', () => {
  it("shows the character's initial on a card in their own colour when there is no portrait", () => {
    const w = portrait({ name: 'Grandmother' })
    expect(w.get('.lq-initial').text()).toBe('G')
    expect(w.get('.lq-foot').text()).toBe('Grandmother')
    const hex = speakerColor('Grandmother')
    const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16))
    expect(
      w.get('[data-testid="portrait-card"]').attributes('style'),
    ).toContain(`rgb(${r}, ${g}, ${b})`)
    expect(w.find('img').exists()).toBe(false)
  })

  it('lays the portrait over the card once it has loaded', async () => {
    const w = portrait({ name: 'Mira', src: '/mira.png' })
    const img = w.get('img')
    expect(img.attributes('alt')).toBe('')
    expect(img.classes()).not.toContain('lq-face-loaded')
    await img.trigger('load')
    expect(w.get('img').classes()).toContain('lq-face-loaded')
  })

  it('falls back to the card when the portrait fails to load', async () => {
    const w = portrait({ name: 'Mira', src: '/missing.png' })
    await w.get('img').trigger('error')
    expect(w.find('img').exists()).toBe(false)
    expect(w.get('.lq-initial').text()).toBe('M')
  })

  it('tries a new portrait after a failed one', async () => {
    const w = portrait({ name: 'Mira', src: '/missing.png' })
    await w.get('img').trigger('error')
    await w.setProps({ src: '/other.png' })
    expect(w.get('img').attributes('src')).toBe('/other.png')
  })

  it('dims the side that is not speaking', () => {
    expect(portrait({ name: 'Elior', dim: true }).classes()).toContain('lq-dim')
    expect(portrait({ name: 'Elior' }).classes()).not.toContain('lq-dim')
  })
})
