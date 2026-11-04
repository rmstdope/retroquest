// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StageSpeech from './StageSpeech.vue'
import type { Turn } from '@/stores/useGameStore'
import { useStageSpeechStore } from '@/stores/useStageSpeechStore'
import { useNarrationStore } from '@/stores/useNarrationStore'
import type { NarrationUnit } from '@/lantern/narrationUnits'

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

  it("heads a new turn's first line with its speaker, though they also spoke last (rq-h7xh)", async () => {
    const { speech, w } = mounted()
    speech.observe(turn(say('Mira', 'Welcome.'), 'Mira'))
    speech.observe(turn(say('Mira', 'Elior. Come in, mind the sage.'), 'Mira'))
    vi.runAllTimers()
    await w.vm.$nextTick()
    const rows = w.findAll('[data-testid="speech-line"]')
    expect(rows).toHaveLength(2)
    expect(rows[1].get('.lq-line-name').text()).toBe('Mira')
    expect(rows[1].find('[data-testid="portrait"]').exists()).toBe(true)
    expect(rows[0].find('[data-testid="portrait"]').exists()).toBe(true)
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

  it('hurries a narrated turn one block when the speech is pressed, and reads on (rq-cynd)', async () => {
    const { speech, w } = mounted()
    const narration = useNarrationStore()
    // A voice that plays until it is stopped.
    narration.setAudioFactory(() => ({
      play: () => Promise.resolve(),
      pause: () => undefined,
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
    }))
    const voiced = (markup: string): NarrationUnit => ({
      kind: 'block',
      parts: [
        {
          markup,
          clip: { file: 'x.mp3', speaker: 'elior', duration: 5, words: [] },
        },
      ],
    })
    const journal = turn(
      say('Elior', 'The storm.') + '\n\n' + say('Elior', 'I dreamed.'),
      null,
      'use journal',
    )
    narration.begin(
      journal.id,
      [voiced('The storm.'), voiced('I dreamed.')],
      'act1',
    )
    speech.observe(journal)
    await w.vm.$nextTick()
    expect(narration.speaking(journal.id)?.unit).toBe(0)
    await w.get('[data-testid="speech-zone"]').trigger('click')
    await vi.advanceTimersByTimeAsync(100)
    // The next block is read, not the rest of the turn passed over.
    expect(narration.speaking(journal.id)?.unit).toBe(1)
  })

  it('lights the word being read in a narrated line, counted across its paragraphs (rq-v66a)', async () => {
    const { speech, w } = mounted()
    const narration = useNarrationStore()
    const audio = {
      play: () => Promise.resolve(),
      pause: () => undefined,
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
    }
    narration.setAudioFactory(() => audio)
    const quote = 'The storm came.\nI dreamed of fire.'
    const words = quote.split(/\s+/)
    const said = turn(say('Mira', quote), 'Mira')
    narration.begin(
      said.id,
      [
        {
          kind: 'block',
          parts: [
            {
              markup: quote,
              clip: {
                file: 'x.mp3',
                speaker: 'mira',
                duration: 9,
                words: words.map((word, i) => ({ word, start: i, end: i + 1 })),
              },
            },
          ],
        },
      ],
      'act1',
    )
    speech.observe(said)
    audio.currentTime = 1.5
    await vi.advanceTimersByTimeAsync(60)
    expect(w.findAll('.lq-w-now').map((el) => el.text())).toEqual(['storm'])
    // The fifth word of the quote is the second word of its second paragraph.
    audio.currentTime = 4.5
    await vi.advanceTimersByTimeAsync(60)
    const lines = w.findAll('[data-testid="speech-line"]')
    expect(lines[1].findAll('.lq-w-now').map((el) => el.text())).toEqual([
      'dreamed',
    ])
    expect(lines[0].findAll('.lq-w-now')).toHaveLength(0)
  })
})
