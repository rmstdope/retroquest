// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import StoryNameMenu from './StoryNameMenu.vue'

const ACTIONS = [
  { label: 'Take', command: 'take bread' },
  { label: 'Examine', command: 'examine bread' },
]

describe('StoryNameMenu', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => wrapper?.unmount())

  function menuAt(name: { x: number; top: number; bottom: number }) {
    wrapper = mount(StoryNameMenu, {
      props: { actions: ACTIONS, ...name },
      attachTo: document.body,
    })
    const style = (wrapper.get('[role="menu"]').element as HTMLElement).style
    return { left: parseFloat(style.left), top: parseFloat(style.top) }
  }

  it('opens just below the name when there is room', () => {
    window.innerHeight = 800
    expect(menuAt({ x: 100, top: 200, bottom: 218 }).top).toBe(222)
  })

  it('opens above a name near the bottom instead of covering it', () => {
    window.innerHeight = 390
    const { top } = menuAt({ x: 100, top: 280, bottom: 298 })
    // Two 44px actions plus padding end above the name.
    expect(top + 2 * 44 + 10).toBeLessThanOrEqual(280)
  })

  it('closes when the story scrolls under it', async () => {
    menuAt({ x: 100, top: 200, bottom: 218 })

    document.body.dispatchEvent(new Event('scroll'))

    expect(wrapper!.emitted('close')).toHaveLength(1)
  })

  it('stays inside a short window when the choices are many, and scrolls', async () => {
    window.innerHeight = 390
    const bag = Array.from({ length: 16 }, (_, i) => ({
      label: `Thing ${i}`,
      command: `give thing ${i} to elena`,
    }))
    wrapper = mount(StoryNameMenu, {
      props: {
        actions: [{ label: 'Give…', choices: bag }],
        x: 100,
        top: 180,
        bottom: 198,
      },
      attachTo: document.body,
    })
    await wrapper.get('[role="menuitem"]').trigger('click')
    await nextTick()

    const style = (wrapper.get('[role="menu"]').element as HTMLElement).style
    const top = parseFloat(style.top)
    expect(top).toBeGreaterThanOrEqual(8)
    expect(top + parseFloat(style.maxHeight)).toBeLessThanOrEqual(390 - 8)
  })

  it('stays open while its own list scrolls', () => {
    menuAt({ x: 100, top: 200, bottom: 218 })

    wrapper!.get('[role="menu"]').element.dispatchEvent(new Event('scroll'))

    expect(wrapper!.emitted('close')).toBeUndefined()
  })

  it('opens the choices of an action that has them, and picks one', async () => {
    wrapper = mount(StoryNameMenu, {
      props: {
        actions: [
          {
            label: 'Give…',
            choices: [
              { label: 'Bread', command: 'give bread to grandmother' },
              { label: 'Map', command: 'give map to grandmother' },
            ],
          },
          { label: 'Examine', command: 'examine grandmother' },
        ],
        x: 100,
        top: 200,
        bottom: 218,
      },
      attachTo: document.body,
    })

    await wrapper.get('[role="menuitem"]').trigger('click')
    await nextTick()

    expect(wrapper.emitted('pick')).toBeUndefined()
    const menu = wrapper.get('[role="menu"]')
    expect(menu.attributes('aria-label')).toBe('Give')
    expect(menu.findAll('[role="menuitem"]').map((m) => m.text())).toEqual([
      'Bread',
      'Map',
    ])
    expect(document.activeElement?.textContent?.trim()).toBe('Bread')

    await menu.findAll('[role="menuitem"]')[1].trigger('click')
    expect(wrapper.emitted('pick')).toEqual([['give map to grandmother']])
  })
})
