// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
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
})
