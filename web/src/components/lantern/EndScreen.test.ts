// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import EndScreen from './EndScreen.vue'

describe('EndScreen', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountEnd(text: string, saved: boolean): VueWrapper {
    wrapper = mount(EndScreen, {
      props: { text, saved },
      attachTo: document.body,
    })
    return wrapper
  }

  it('thanks the player and shows the final text', () => {
    const w = mountEnd(
      'The [character_name]realm[/character_name] breathes again.',
      true,
    )

    expect(w.get('.lq-end-kicker').text()).toBe('The end')
    expect(w.get('h1').text()).toBe('Thank you for playing RetroQuest')
    expect(w.find('.lq-ornament').exists()).toBe(true)
    expect(w.get('.lq-end-body').text()).toBe('The realm breathes again.')
    expect(w.get('.lq-end-body .theme-character_name').text()).toBe('realm')
  })

  it('says the game is saved in the quick slot', () => {
    const w = mountEnd('Done.', true)

    expect(w.get('.lq-end-foot').text()).toBe(
      'Your game is saved in the quick slot.',
    )
  })

  it('says the game was not saved', () => {
    const w = mountEnd('Done.', false)

    expect(w.get('.lq-end-foot').text()).toBe('This game was not saved.')
  })

  it('leaves the prose out when the final text is empty', () => {
    const w = mountEnd('  \n', false)

    expect(w.find('.lq-end-body').exists()).toBe(false)
    expect(w.get('h1').text()).toBe('Thank you for playing RetroQuest')
    expect(w.find('.lq-ornament').exists()).toBe(true)
    expect(w.get('.lq-end-foot').text()).toBe('This game was not saved.')
  })

  it('puts focus on the title and has nothing to press', async () => {
    const w = mountEnd('Done.', true)
    await nextTick()

    expect(document.activeElement).toBe(w.get('h1').element)
    expect(w.findAll('button, a, input, textarea, select')).toHaveLength(0)
  })
})
