// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import TitlePage from './TitlePage.vue'

const LOGO =
  'Welcome to\n[bold yellow]\n#####\n##  ##\n[/bold yellow]\n' +
  '[bold]Music track:[/bold] Market by Conquest\nSource: https://freetouse.com/music'

describe('TitlePage', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountTitle(musicInfo?: string): VueWrapper {
    wrapper = mount(TitlePage, {
      props: { text: LOGO, musicInfo },
      attachTo: document.body,
    })
    return wrapper
  }

  it('is a page named RetroQuest with the art hidden from screen readers', () => {
    const w = mountTitle()
    const dialog = w.get('[role="dialog"]')

    expect(dialog.get(`#${dialog.attributes('aria-labelledby')}`).text()).toBe(
      'RetroQuest',
    )
    expect(w.get('pre').attributes('aria-hidden')).toBe('true')
    expect(w.get('pre').text()).toContain('#####')
  })

  it('names the music with a link to its source', () => {
    const w = mountTitle()

    expect(w.get('.lq-credits').text()).toContain('Market by Conquest')
    expect(w.get('.lq-credits a').attributes('href')).toBe(
      'https://freetouse.com/music',
    )
  })

  it('credits the music playing, when the player gives its credit', () => {
    const w = mountTitle(
      'Original music for RetroQuest, made with Audio Studio',
    )

    expect(w.get('.lq-credits').text()).toContain(
      'Original music for RetroQuest, made with Audio Studio',
    )
    expect(w.get('.lq-credits').text()).not.toContain('Conquest')
    expect(w.find('.lq-credits a').exists()).toBe(false)
  })

  it('starts with the Start button, Enter or Escape', async () => {
    const w = mountTitle()
    await flushPromises()
    expect(document.activeElement?.textContent?.trim()).toBe('Start')

    await w.get('button').trigger('click')
    await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })

    expect(w.emitted('start')).toHaveLength(2)
  })
})
