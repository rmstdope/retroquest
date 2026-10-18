// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import QuestModal from './QuestModal.vue'

describe('QuestModal', () => {
  let wrapper: VueWrapper | undefined

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountModal(visible = true) {
    wrapper = mount(QuestModal, {
      props: {
        visible,
        title: 'Quest Complete',
        body: '<span class="theme-quest_name">Preparing for the road</span>',
      },
    })
    return wrapper
  }

  it('renders the title and the rendered body markup when visible', () => {
    const w = mountModal()

    expect(w.text()).toContain('Quest Complete')
    expect(w.find('.theme-quest_name').text()).toBe('Preparing for the road')
  })

  it('renders nothing when not visible', () => {
    const w = mountModal(false)

    expect(w.find('[data-testid="quest-modal-card"]').exists()).toBe(false)
  })

  it('emits dismiss when Continue is clicked', async () => {
    const w = mountModal()

    await w.get('button').trigger('click')

    expect(w.emitted('dismiss')).toHaveLength(1)
  })

  it('emits dismiss when the backdrop is clicked but not the card', async () => {
    const w = mountModal()

    await w.get('[data-testid="quest-modal-card"]').trigger('click')
    expect(w.emitted('dismiss')).toBeUndefined()

    await w.get('[data-testid="quest-modal-backdrop"]').trigger('click')
    expect(w.emitted('dismiss')).toHaveLength(1)
  })

  it('stops listening for Escape after unmount', () => {
    const w = mountModal()
    w.unmount()
    wrapper = undefined

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(w.emitted('dismiss')).toBeUndefined()
  })

  it('emits dismiss on Escape only while visible', async () => {
    const w = mountModal()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(w.emitted('dismiss')).toHaveLength(1)

    await w.setProps({ visible: false })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(w.emitted('dismiss')).toHaveLength(1)
  })
})
