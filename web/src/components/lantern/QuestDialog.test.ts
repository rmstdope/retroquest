// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import QuestDialog from './QuestDialog.vue'

describe('QuestDialog', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  function mountQuest(quest: {
    name: string
    main: boolean
    done: boolean
    description: string
  }) {
    wrapper = mount(QuestDialog, { props: { quest }, attachTo: document.body })
    return wrapper
  }

  const JOURNAL = {
    name: 'Shadows Over Willowbrook',
    main: true,
    done: false,
    description:
      '[dim]Elior dreams.[/dim][dim]\nThe crops wilt.[/dim]\nVillagers whisper of [character_name]Mira[/character_name].',
  }

  it('names the quest and tells what kind it is', () => {
    const w = mountQuest(JOURNAL)

    expect(w.get('[role="dialog"] h2').text()).toBe('Shadows Over Willowbrook')
    const tags = w.findAll('.lq-tag').map((t) => t.text())
    expect(tags).toEqual(['Main quest', '3 entries'])
  })

  it('shows the latest entry and folds the earlier ones', async () => {
    const w = mountQuest(JOURNAL)
    expect(w.get('.lq-latest .theme-character_name').text()).toBe('Mira')
    const toggle = w.get('button.lq-earlier-toggle')
    expect(toggle.text()).toContain('Earlier entries (2)')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(w.find('.lq-timeline').exists()).toBe(false)

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(toggle.text()).toContain('Hide earlier entries')
    expect(w.findAll('.lq-timeline li').map((li) => li.text())).toEqual([
      'Entry 1Elior dreams.',
      'Entry 2The crops wilt.',
    ])
  })

  it('has nothing to unfold for a one-entry quest', () => {
    const w = mountQuest({ ...JOURNAL, description: 'Explore Willowbrook.' })

    expect(w.find('button.lq-earlier-toggle').exists()).toBe(false)
    expect(w.findAll('.lq-tag').map((t) => t.text())).toEqual(['Main quest'])
  })

  it('shows a checklist with what is done and what is not yet', () => {
    const w = mountQuest({
      name: 'Preparing for the Road',
      main: false,
      done: false,
      description:
        'Mira says you will need:\n[success] * Warm clothing[/success]\n[pending] * A map[/pending]',
    })

    expect(w.get('.lq-intro').text()).toBe('Mira says you will need:')
    expect(w.get('.lq-check-count').text()).toBe('1 of 2 done')
    const rows = w.findAll('.lq-check')
    expect(rows.map((r) => r.text())).toEqual([
      '✓Warm clothing (done)',
      '○A map (not yet)',
    ])
    expect(rows[0].get('.lq-check-mark').attributes('aria-hidden')).toBe('true')
  })

  it('marks a completed quest', () => {
    const w = mountQuest({ ...JOURNAL, done: true, description: 'You did it.' })

    expect(w.findAll('.lq-tag').map((t) => t.text())).toEqual([
      'Main quest',
      'Done',
    ])
  })

  it("calls a completed quest's text its outcome", () => {
    const w = mountQuest({ ...JOURNAL, done: true, description: 'You did it.' })

    expect(w.get('.lq-label').text()).toBe('Outcome')
  })

  it('closes', async () => {
    const w = mountQuest(JOURNAL)

    await w.get('button[aria-label="Close"]').trigger('click')

    expect(w.emitted('close')).toHaveLength(1)
  })
})
