// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import LanternLoading from './LanternLoading.vue'

describe('LanternLoading', () => {
  it('shows the full status, file count included', () => {
    const w = mount(LanternLoading, {
      props: { status: 'Loading game files... (10/363)' },
    })

    expect(w.get('.lq-loading-status').text()).toBe(
      'Loading game files... (10/363)',
    )
  })

  it('announces each loading step once, not every file count', async () => {
    const w = mount(LanternLoading, {
      props: { status: 'Loading game files... (10/363)' },
    })
    expect(w.get('[role="status"]').text()).toBe('Loading game files...')

    await w.setProps({ status: 'Loading game files... (20/363)' })
    expect(w.get('[role="status"]').text()).toBe('Loading game files...')

    await w.setProps({ status: 'Error: Network error' })
    expect(w.get('[role="status"]').text()).toBe('Error: Network error')
  })

  it('offers to try again when loading failed', async () => {
    const w = mount(LanternLoading, {
      props: { status: 'Error: Network error', failed: true },
      attachTo: document.body,
    })
    await nextTick()

    expect(w.find('.lq-loading-spinner').exists()).toBe(false)
    expect(w.get('[role="alert"]').text()).toBe(
      'RetroQuest could not start. Try again, or open Details to see what went wrong.',
    )
    const details = w.get('details')
    expect(details.attributes('open')).toBeUndefined()
    expect(details.get('summary').text()).toBe('Details')
    expect(details.text()).toContain('Error: Network error')
    const retry = w.get('button')
    expect(retry.text()).toBe('Try again')
    expect(document.activeElement).toBe(retry.element)

    await retry.trigger('click')
    expect(w.emitted('retry')).toHaveLength(1)
    w.unmount()
  })
})
