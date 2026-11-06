// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { MapPlace } from '@/engine'
import { useGameStore } from '@/stores/useGameStore'
import BiggerMapDialog from './BiggerMapDialog.vue'

function place(
  name: string,
  visited: boolean,
  exits: Record<string, string> = {},
  current = false,
): MapPlace {
  return {
    key: name,
    name,
    visited,
    current,
    exits: Object.fromEntries(
      Object.entries(exits).map(([dir, to]) => [dir, { to, label: to }]),
    ),
  }
}

describe('BiggerMapDialog', () => {
  let wrapper: VueWrapper | undefined
  let travel: ReturnType<typeof vi.fn<(key: string) => void>>

  beforeEach(() => {
    setActivePinia(createPinia())
    const game = useGameStore()
    game.acceptInput = true
    game.questProgress = {
      completed: 0,
      total: 3,
      actNumber: 2,
      mainQuest: null,
    }
    game.mapPlaces = [
      place('Village Well', true, { east: 'Forge', up: 'Bell Tower' }, true),
      place('Forge', true, { west: 'Village Well', south: 'Forest Path' }),
      place('Bell Tower', false),
      place('Forest Path', false),
    ]
    travel = vi.fn<(key: string) => void>()
    vi.spyOn(game, 'travelTo').mockImplementation(travel)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountMap(): VueWrapper {
    wrapper = mount(BiggerMapDialog, { attachTo: document.body })
    return wrapper
  }

  it('has the act above the title Map', () => {
    const w = mountMap()
    expect(w.get('.lq-dialog-eyebrow').text()).toBe('Act II')
    expect(w.get('.lq-dialog-title').text()).toBe('Map')
  })

  it('names the current place with You are here, and it is not a button', () => {
    const w = mountMap()
    const here = w.get('[data-current="true"]')
    expect(here.text()).toContain('You are here')
    expect(here.text()).toContain('Village Well')
    expect(here.element.tagName).not.toBe('BUTTON')
  })

  it('shows every visited place and every seen place as a box to go to', () => {
    const w = mountMap()
    const labels = w
      .findAll('button[data-place]')
      .map((b) => b.attributes('aria-label'))
    expect(labels).toEqual([
      'Go to Forge',
      'Go to Bell Tower',
      'Go to Forest Path',
    ])
  })

  it('draws a place not visited dashed, with its name in italics', () => {
    const w = mountMap()
    expect(w.get('[data-place="Forest Path"]').classes()).toContain(
      'lq-unvisited',
    )
    expect(w.get('[data-place="Forge"]').classes()).not.toContain(
      'lq-unvisited',
    )
  })

  it('draws a path dashed only toward an unvisited place, with a tag for up', () => {
    const w = mountMap()
    const path = (to: string) => w.get(`[data-path-to="${to}"]`)
    expect(path('Forge').classes()).not.toContain('lq-dashed')
    expect(path('Forest Path').classes()).toContain('lq-dashed')
    expect(w.get('[data-tag]').text()).toBe('↑ Up')
  })

  it('travels and closes when a place is pressed', async () => {
    const w = mountMap()
    await w.get('[data-place="Forest Path"]').trigger('click')
    expect(travel).toHaveBeenCalledWith('Forest Path')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('closes without travelling on × and on Escape', async () => {
    const w = mountMap()
    await w.get('.lq-dialog-close').trigger('click')
    await w.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('close')).toHaveLength(2)
    expect(travel).not.toHaveBeenCalled()
  })

  it('dims the places while the game is busy', async () => {
    const game = useGameStore()
    game.acceptInput = false
    const w = mountMap()
    const box = w.get('[data-place="Forge"]')
    expect(box.attributes('disabled')).toBeDefined()
    await box.trigger('click')
    expect(travel).not.toHaveBeenCalled()
  })

  it('draws a visited place that no open way leads to, but does not let it be pressed', async () => {
    const game = useGameStore()
    game.mapPlaces = [...game.mapPlaces, place("Mira's Hut", true)]
    const w = mountMap()
    const hut = w.get('[data-place="Mira\'s Hut"]')
    expect(hut.attributes('disabled')).toBeDefined()
    await hut.trigger('click')
    expect(travel).not.toHaveBeenCalled()
    expect(w.get('[data-place="Forge"]').attributes('disabled')).toBeUndefined()
  })

  it('gives each pressable place a focusable button that travels when pressed', async () => {
    const w = mountMap()
    const forge = w.get('[data-place="Forge"]').element as HTMLButtonElement
    forge.focus()
    expect(document.activeElement).toBe(forge)
    await w.get('[data-place="Forge"]').trigger('click')
    expect(travel).toHaveBeenCalledWith('Forge')
  })

  it('lets a long name wrap inside its box', () => {
    const game = useGameStore()
    game.mapPlaces = [
      place(
        'Village Well',
        true,
        { east: 'The Very Long Name of a Place' },
        true,
      ),
      place('The Very Long Name of a Place', false),
    ]
    const w = mountMap()
    expect(w.get('[data-place^="The Very"] .lq-name').text()).toBe(
      'The Very Long Name of a Place',
    )
  })

  it('shows a lone place alone', () => {
    const game = useGameStore()
    game.mapPlaces = [place('Village Well', true, {}, true)]
    const w = mountMap()
    expect(w.findAll('[data-place]')).toHaveLength(1)
    expect(w.findAll('button[data-place]')).toHaveLength(0)
  })
})
