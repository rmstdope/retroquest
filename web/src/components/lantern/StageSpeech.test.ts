// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  afterEach(() => vi.unstubAllGlobals())

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

  it('shows the one spoken to at the right edge, named once, with a portrait', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Grandmother', 'There you are.'), 'Grandmother'))
    await w.vm.$nextTick()
    expect(w.findAll('[data-testid="portrait"]')).toHaveLength(1)
    const line = w.get('[data-testid="speech-line"]')
    expect(line.classes()).toContain('lq-line-right')
    expect(line.get('.lq-line-name').text()).toBe('Grandmother')
    expect(line.text()).toContain('There you are.')
    expect(w.get('[data-testid="portrait"]').text()).toBe('G')
  })

  it('puts Elior at the left of the column, named, with his own portrait', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Grandmother', 'One.'), 'Grandmother'))
    speech.observe(turn('', 'Grandmother', 'say why to grandmother'))
    await w.vm.$nextTick()
    const rows = w.findAll('[data-testid="speech-line"]')
    expect(rows.map((row) => row.classes().includes('lq-line-left'))).toEqual([
      false,
      true,
    ])
    expect(rows[1].get('.lq-line-name').text()).toBe('Elior')
    expect(rows[1].get('[data-testid="portrait"]').text()).toBe('E')
  })

  it('names a run once and shows one portrait beside its first line', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'A.\n\nB.\n\nC.'), 'Mira'))
    speech.revealAll()
    await w.vm.$nextTick()
    expect(w.findAll('.lq-line-name')).toHaveLength(1)
    expect(w.findAll('[data-testid="portrait"]')).toHaveLength(1)
    const rows = w.findAll('[data-testid="speech-line"]')
    expect(rows[0].find('[data-testid="portrait"]').exists()).toBe(true)
    expect(rows[1].find('[data-testid="portrait"]').exists()).toBe(false)
  })

  it('gives each of three speakers a run of their own', async () => {
    const { speech, w } = mounted()
    speech.observe(
      turn(
        say('Grandmother', 'One.') +
          '\n' +
          say('Villager', 'Two.') +
          '\n' +
          say('Mira', 'Three.'),
        'Grandmother',
      ),
    )
    vi.runAllTimers()
    await w.vm.$nextTick()
    expect(w.findAll('.lq-line-name').map((name) => name.text())).toEqual([
      'Grandmother',
      'Villager',
      'Mira',
    ])
    expect(w.findAll('[data-testid="portrait"]')).toHaveLength(3)
  })

  it('fades the lines by how long ago they were said', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'A.\n\nB.\n\nC.\n\nD.'), 'Mira'))
    speech.revealAll()
    await w.vm.$nextTick()
    expect(
      w
        .findAll('.lq-line')
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

  it('has no control of its own on the laptop: the one Hide clears both sides', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    await w.vm.$nextTick()
    expect(w.findAll('button, a, input, [tabindex]')).toHaveLength(0)
    expect(w.get('.lq-thread').attributes('aria-hidden')).toBe('true')
  })

  it('has one control on the phone, named for what it does, and nothing else to focus', async () => {
    const speech = useStageSpeechStore()
    const w = mount(StageSpeech, {
      props: { phone: true },
      attachTo: document.body,
    })
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    await w.vm.$nextTick()
    const buttons = w.findAll('button, a, input, [tabindex]')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].text()).toBe('✕')
    expect(buttons[0].attributes('aria-label')).toBe('Clear the conversation')
    expect(buttons[0].attributes('title')).toBe('Clear the conversation')
  })

  it('is cleared away, and unreachable, while the words are hidden', async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'Hello.'), 'Mira'))
    await w.vm.$nextTick()
    expect(w.classes()).not.toContain('lq-speech-away')
    await w.setProps({ away: true })
    expect(w.classes()).toContain('lq-speech-away')
    expect(w.attributes('inert')).toBeDefined()
    // The lines are kept: hiding loses nothing.
    expect(w.findAll('[data-testid="speech-line"]')).toHaveLength(1)
  })

  it('clears with the phone button, which hands focus to the story band', async () => {
    const speech = useStageSpeechStore()
    const w = mount(StageSpeech, {
      props: { phone: true },
      attachTo: document.body,
    })
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

  it('says how tall its room is, and again when the room changes', async () => {
    const callbacks: Array<() => void> = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          callbacks.push(callback)
        }
        observe(): void {}
        disconnect(): void {}
      },
    )
    const { w } = mounted()
    await w.vm.$nextTick()
    const zone = w.get('.lq-speech-zone').element
    let height = 58
    Object.defineProperty(zone, 'clientHeight', { get: () => height })
    callbacks.forEach((callback) => callback())
    height = 140
    callbacks.forEach((callback) => callback())
    expect(w.emitted('room')).toEqual([[58], [140]])
  })

  it('marks its zone when the plate above it is folded', async () => {
    const { w } = mounted()
    expect(w.get('.lq-speech-zone').classes()).not.toContain('lq-speech-folded')
    await w.setProps({ folded: true })
    expect(w.get('.lq-speech-zone').classes()).toContain('lq-speech-folded')
  })
})
