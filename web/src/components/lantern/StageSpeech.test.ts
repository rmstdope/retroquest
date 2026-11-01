// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StageSpeech from './StageSpeech.vue'
import type { Turn } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'

let nextId = 1

function turn(
  text: string,
  addressed: string | null,
  command = 'talk to someone',
): Turn {
  return {
    id: nextId++,
    command,
    text,
    room: 'Cottage',
    description: null,
    gained: [],
    lost: [],
    arrival: null,
    ...(addressed ? { addressed } : {}),
  }
}

const say = (name: string, words: string): string =>
  `[character_name]${name}[/character_name]\n[dialogue]${words}[/dialogue]`

function mounted() {
  const speech = useStageSpeechStore()
  const w = mount(StageSpeech, { attachTo: document.body })
  return { speech, w }
}

describe('StageSpeech', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('shows nothing, not even the button, without a conversation', () => {
    const { w } = mounted()
    expect(w.findAll('[data-testid="portrait"]')).toHaveLength(0)
    expect(w.find('button').exists()).toBe(false)
  })

  it('shows the one spoken to on the right, with the left empty', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Grandmother', 'There you are.'), 'Grandmother'))
    await w.vm.$nextTick()
    expect(w.findAll('[data-testid="portrait"]')).toHaveLength(1)
    expect(w.get('.lq-sp-right .lq-foot').text()).toBe('Grandmother')
    expect(w.find('.lq-sp-left').exists()).toBe(false)
    const line = w.get('[data-testid="speech-line"]')
    expect(line.classes()).toContain('lq-line-right')
    expect(line.get('.lq-line-name').text()).toBe('Grandmother')
    expect(line.text()).toContain('There you are.')
  })

  it('brings Elior in on the left once he speaks, and dims the side that is quiet', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Grandmother', 'One.'), 'Grandmother'))
    speech.observe(turn('', 'Grandmother', 'say why to grandmother'))
    await w.vm.$nextTick()
    expect(w.get('.lq-sp-left .lq-foot').text()).toBe('Elior')
    expect(w.get('.lq-sp-right').classes()).toContain('lq-dim')
    expect(w.get('.lq-sp-left').classes()).not.toContain('lq-dim')
    speech.observe(turn(say('Grandmother', 'Because.'), 'Grandmother'))
    await w.vm.$nextTick()
    expect(w.get('.lq-sp-left').classes()).toContain('lq-dim')
    expect(w.get('.lq-sp-right').classes()).not.toContain('lq-dim')
  })

  it('changes the right portrait to a second speaker and keeps the earlier names', async () => {
    const { speech, w } = mounted()
    speech.observe(
      turn(
        say('Grandmother', 'One.') + '\n' + say('Villager', 'Two.'),
        'Grandmother',
      ),
    )
    vi.runAllTimers()
    await w.vm.$nextTick()
    expect(w.get('.lq-sp-right .lq-foot').text()).toBe('Villager')
    expect(w.findAll('.lq-line-name').map((name) => name.text())).toEqual([
      'Grandmother',
      'Villager',
    ])
  })

  it('fades the lines by how long ago they were said', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'A.\n\nB.\n\nC.\n\nD.'), 'Mira'))
    speech.revealAll()
    await w.vm.$nextTick()
    expect(
      w
        .findAll('[data-testid="speech-line"]')
        .map((line) =>
          line.classes().find((name) => name.startsWith('lq-age-')),
        ),
    ).toEqual(['lq-age-old', 'lq-age-old', 'lq-age-prev', 'lq-age-new'])
  })

  it('makes each paragraph of a long speech its own line', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'First.\n\nSecond.'), 'Mira'))
    speech.revealAll()
    await w.vm.$nextTick()
    expect(w.findAll('[data-testid="speech-line"]')).toHaveLength(2)
  })

  it('has one control, named for what it does, and nothing else to focus', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    await w.vm.$nextTick()
    const buttons = w.findAll('button, a, input, [tabindex]')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].text()).toBe('✕')
    expect(buttons[0].attributes('aria-label')).toBe('Clear the conversation')
    expect(buttons[0].attributes('title')).toBe('Clear the conversation')
    expect(w.get('.lq-thread').attributes('aria-hidden')).toBe('true')
  })

  it('clears with the button, which hands focus to the story band', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    await w.vm.$nextTick()
    await w.get('button').trigger('click')
    expect(speech.conversation).toBeNull()
    expect(w.emitted('focus-story')).toHaveLength(1)
    expect(w.find('[data-testid="portrait"]').exists()).toBe(false)
  })

  it('shows no button until a line is shown', async () => {
    const { speech, w } = mounted()
    speech.observe(turn('Nothing to say.', 'Mira', 'give bread to mira'))
    await w.vm.$nextTick()
    expect(speech.conversation).not.toBeNull()
    expect(w.find('button').exists()).toBe(false)
  })

  it('shows the rest of the turn at once when the picture is pressed', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'A.\n\nB.\n\nC.'), 'Mira'))
    await w.vm.$nextTick()
    expect(w.findAll('[data-testid="speech-line"]')).toHaveLength(1)
    await w.get('[data-testid="speech-zone"]').trigger('click')
    expect(w.findAll('[data-testid="speech-line"]')).toHaveLength(3)
  })

  it('takes the phone arrangement when asked', () => {
    const w = mount(StageSpeech, { props: { phone: true } })
    expect(w.get('[data-testid="speech-zone"]').classes()).toContain(
      'lq-phone-speech',
    )
  })
})
