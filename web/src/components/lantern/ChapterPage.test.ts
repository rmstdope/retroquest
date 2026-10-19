// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChapterPage from './ChapterPage.vue'
import type { Chapter } from '@/lantern/chapter'

const INTRO: Chapter = {
  kind: 'intro',
  act: 'Act I',
  title: 'The Call to Adventure',
  body: 'You are [character_name]Elior[/character_name].',
}

const COMPLETE: Chapter = {
  kind: 'complete',
  act: 'Act I',
  title: 'The Call to Adventure',
  body: 'Congratulations — you have completed Act 1!',
  stats: { questsCompleted: 10, questsTotal: 11, spells: 4, places: 15 },
  nextAct: 'Act II',
}

describe('ChapterPage', () => {
  it('opens an act with its title, text and Begin', async () => {
    const w = mount(ChapterPage, { props: { chapter: INTRO, titleId: 't' } })

    expect(w.get('.lq-chapter-kicker').text()).toBe('Act I')
    expect(w.get('h2').text()).toBe('The Call to Adventure')
    expect(w.get('h2').attributes('id')).toBe('t')
    expect(w.get('.lq-chapter-body .theme-character_name').text()).toBe('Elior')
    await w.get('button').trigger('click')
    expect(w.get('button').text()).toBe('Begin')
    expect(w.emitted('continue')).toHaveLength(1)
  })

  it('closes an act with its numbers and the way on', () => {
    const w = mount(ChapterPage, { props: { chapter: COMPLETE, titleId: 't' } })

    expect(w.get('.lq-chapter-kicker').text()).toBe('Act I complete')
    const stats = w.findAll('.lq-stat').map((s) => s.text())
    expect(stats).toEqual([
      '10 / 11Quests completed',
      '4Spells known',
      '15Places visited',
    ])
    expect(w.get('button').text()).toBe('Continue to Act II')
  })

  it('ends the game without a next act', () => {
    const w = mount(ChapterPage, {
      props: { chapter: { ...COMPLETE, nextAct: undefined }, titleId: 't' },
    })

    expect(w.get('button').text()).toBe('Continue')
  })

  it('can put focus on its button', () => {
    const w = mount(ChapterPage, {
      props: { chapter: INTRO, titleId: 't' },
      attachTo: document.body,
    })

    ;(w.vm as unknown as { focus: () => void }).focus()

    expect(document.activeElement).toBe(w.get('button').element)
    w.unmount()
  })

  it('keeps the page at its title when focusing the button', () => {
    const w = mount(ChapterPage, { props: { chapter: INTRO, titleId: 't' } })
    const focus = vi.spyOn(w.get('button').element, 'focus')

    ;(w.vm as unknown as { focus: () => void }).focus()

    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })
})
