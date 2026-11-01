// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArrivalOnPicture from './ArrivalOnPicture.vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
import type { ArrivalPart } from '@/lantern/stageArrival'

const description: ArrivalPart = {
  kind: 'description',
  lines: [{ unit: 0, markup: 'Cobbles and a [bold]fountain[/bold].' }],
  voiced: false,
}
const events: ArrivalPart = {
  kind: 'events',
  lines: [{ unit: 0, markup: 'A man leaves.' }],
  voiced: false,
}

describe('ArrivalOnPicture', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.useRealTimers())

  it('shows nothing while no arrival is told', () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    expect(w.find('.lq-arrival-card').exists()).toBe(false)
    expect(w.classes()).not.toContain('lq-on')
  })

  it('tells the description with the hint, and a bar when it is read for its time', async () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    useArrivalStore().show(1, [description], false)
    await w.vm.$nextTick()
    expect(w.get('.lq-arrival-line').text()).toBe('Cobbles and a fountain.')
    expect(w.get('.lq-arrival-hint').text()).toBe(
      'Click or press Enter to continue',
    )
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(true)
    expect(w.classes()).toContain('lq-on')
  })

  it('tells what happens in italics, and goes on to the description on a click', async () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    useArrivalStore().show(1, [events, description], false)
    await w.vm.$nextTick()
    expect(w.get('.lq-arrival-line').classes()).toContain('lq-arrival-event')
    await w.trigger('click')
    expect(w.get('.lq-arrival-line').classes()).not.toContain(
      'lq-arrival-event',
    )
    await w.trigger('click')
    expect(w.find('.lq-arrival-card').exists()).toBe(false)
  })

  it('shows no bar when the narrator tells it', async () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    useArrivalStore().show(1, [{ ...description, voiced: true }], true)
    await w.vm.$nextTick()
    expect(w.find('[data-testid="arrival-bar"]').exists()).toBe(false)
  })

  it('is dark ink on the paper when there is no picture', () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: false } })
    expect(w.classes()).toContain('lq-bare')
    const withPicture = mount(ArrivalOnPicture, { props: { pictured: true } })
    expect(withPicture.classes()).not.toContain('lq-bare')
  })

  it('is a polite live region', () => {
    const w = mount(ArrivalOnPicture, { props: { pictured: true } })
    expect(w.attributes('aria-live')).toBe('polite')
  })

  it('says "Tap to continue" on a phone', async () => {
    const w = mount(ArrivalOnPicture, {
      props: { pictured: true, phone: true },
    })
    useArrivalStore().show(1, [description], false)
    await w.vm.$nextTick()
    expect(w.get('.lq-arrival-hint').text()).toBe('Tap to continue')
  })
})
