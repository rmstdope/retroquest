/**
 * Coverage of the recorded narration: the script of each act (`tts/act<N>/script.json`)
 * holds the lines a player reaches only through an optional moment, and each
 * optional line is voiced by its speaker once recorded. A line with no recording
 * yet is not a defect: the navigator records new lines by hand after the merge.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { NarrationManifest } from './narrationManifest'
import type { ScriptLine } from './narrationScript'

/** Reads a JSON file of the repository relative to `web/`. */
function readJson<T>(path: string): T {
  return JSON.parse(
    readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'),
  ) as T
}

/** Optional lines per act: each is spoken by `speaker` and begins with `opening`. */
const OPTIONAL_LINES: Record<number, { speaker: string; opening: string }[]> = {
  /** Act I: the authored replies to what the golden path does not try (take, use, cast, give). */
  1: [
    { speaker: 'narrator', opening: "You'd rather light the lantern" },
    { speaker: 'narrator', opening: 'The bucket is no use with that.' },
    { speaker: 'narrator', opening: 'You could force the magnet onto the rod' },
    {
      speaker: 'narrator',
      opening: 'The rod is too short to reach the water.',
    },
    { speaker: 'narrator', opening: 'Mira gently but firmly stops you.' },
    { speaker: 'mira', opening: 'Those herbs are part of my stores' },
    {
      speaker: 'narrator',
      opening: 'Mira places a protective hand over the amulet',
    },
    { speaker: 'mira', opening: 'This is not yet yours to claim' },
    {
      speaker: 'shopkeeper',
      opening: 'Hold on there, friend! That sword is merchandise',
    },
    { speaker: 'narrator', opening: 'You lift the smooth stone a little' },
    { speaker: 'narrator', opening: 'The wire is pulled tight around the kit' },
    { speaker: 'narrator', opening: 'A soft glow fills the shed.' },
    { speaker: 'narrator', opening: 'The mysterious box is now empty.' },
    { speaker: 'narrator', opening: 'The spell finds nothing to turn.' },
    {
      speaker: 'fisherman',
      opening: 'Well, would you look at that! Not a twinge.',
    },
    { speaker: 'narrator', opening: 'The light runs out over the water' },
    { speaker: 'narrator', opening: 'The warmth reaches the kit' },
    { speaker: 'narrator', opening: 'The bush greens under your hand' },
    { speaker: 'narrator', opening: 'The herb crowds its pot' },
    { speaker: 'mira', opening: 'That was dear, that herb.' },
    { speaker: 'grandmother', opening: 'Look at you: wild berries' },
    { speaker: 'fisherman', opening: 'Under the smooth stone, lad' },
    { speaker: 'grandmother', opening: 'The three of you.' },
    { speaker: 'grandmother', opening: "I'll make a pie." },
    { speaker: 'shopkeeper', opening: 'Hold on there, friend! That armor' },
    { speaker: 'shopkeeper', opening: 'I sell things, lad.' },
    { speaker: 'merchant', opening: "That's kind, friend" },
    { speaker: 'mira', opening: 'I have told you what I know of it' },
    { speaker: 'narrator', opening: 'The old water splashes out' },
    { speaker: 'narrator', opening: 'The mysterious box is locked' },
    { speaker: 'narrator', opening: 'A small nose twitches' },
    { speaker: 'narrator', opening: "You have a rod, but you're not quite" },
    { speaker: 'narrator', opening: 'The nearby plants seem to respond' },
    /** Act I's stock replies (rq-bio): one fixed line per person, never naming the item. */
    {
      speaker: 'narrator',
      opening: 'Tilda looks it over with interest and gives it back.',
    },
    { speaker: 'tilda', opening: "Don't go giving your things away" },
    {
      speaker: 'narrator',
      opening: 'The priest shakes his head and folds your fingers',
    },
    { speaker: 'priest', opening: 'Keep it, child. The road will want it' },
    {
      speaker: 'narrator',
      opening: 'The deer sniffs at it and turns its head away.',
    },
    {
      speaker: 'narrator',
      opening: 'Grandmother turns it over in her hands and gives it back.',
    },
    { speaker: 'grandmother', opening: 'Keep it, love. My shelves' },
    {
      speaker: 'narrator',
      opening: 'Mira regards it, then shakes her head gently.',
    },
    {
      speaker: 'narrator',
      opening: 'The blacksmith gives it a glance and hands it back.',
    },
    {
      speaker: 'narrator',
      opening: 'The fisherman eyes it, then shrugs.',
    },
    { speaker: 'fisherman', opening: "Won't catch anything with that, lad." },
    {
      speaker: 'narrator',
      opening: 'The merchant weighs it in his palm and hands it back.',
    },
    {
      speaker: 'narrator',
      opening: 'Patches sniffs at your offering from the shadows',
    },
    { speaker: 'narrator', opening: 'Tilda has nothing to sell you.' },
    { speaker: 'narrator', opening: 'Patches has nothing to sell you.' },
    {
      speaker: 'shopkeeper',
      opening: 'Not something I carry, lad.',
    },
    { speaker: 'narrator', opening: "You don't see that here." },
    { speaker: 'narrator', opening: 'A divine light surrounds Tilda' },
    { speaker: 'narrator', opening: 'A warm light envelops Tilda' },
    { speaker: 'narrator', opening: 'A cleansing energy flows around Tilda' },
    /** The `hint` answer: its opening line, the quiet line and each quest's line under its name. */
    { speaker: 'narrator', opening: 'You stop and think over what you know.' },
    { speaker: 'narrator', opening: 'You think it over. Nothing presses' },
    {
      speaker: 'narrator',
      opening: 'Shadows Over Willowbrook: Villagers speak',
    },
    { speaker: 'narrator', opening: 'Curiosity killed the cat: Patches was' },
    { speaker: 'narrator', opening: 'Preparing for the road: Mira has tasked' },
  ],
  2: [{ speaker: 'families', opening: "She's smiling. First time in a week." }],
  3: [
    { speaker: 'phoenix', opening: 'You gave him back his place' },
    { speaker: 'lead miner', opening: 'Thank you, Elior.' },
    { speaker: 'mira', opening: 'Thank you. I did not dare ask for that' },
    { speaker: 'mira', opening: 'I should have. I chose the seal' },
    { speaker: 'pier warden', opening: 'Keep it. Toll for the crossing' },
    { speaker: 'pier warden', opening: 'I said keep it, lad.' },
    { speaker: 'pier warden', opening: '… Aye. I think I knew it' },
    {
      speaker: 'ancient dragon',
      opening: 'You said you would give back',
    },
    { speaker: 'ancient dragon', opening: 'Go with my blessing, young one' },
  ],
  4: [
    { speaker: 'king alden', opening: 'You came for me. Whoever you are' },
    { speaker: 'lysa', opening: 'We saw you at the workbench with us' },
    { speaker: 'malakar', opening: 'You saw. Then you know I was not lying' },
    { speaker: 'sir cedric', opening: 'If they can be let go, so can this' },
    {
      speaker: 'captain of the guard',
      opening: "'Then I will tell them at home",
    },
    { speaker: 'true self', opening: 'Remember what you told me' },
    {
      speaker: 'malakar',
      opening: 'And not for the first time, I think. You have shown mercy',
    },
  ],
}

describe.each([1, 2, 3, 4])('narration coverage of Act %i', (act) => {
  const script = readJson<ScriptLine[]>(`tts/act${act}/script.json`)
  const manifest = readJson<NarrationManifest>(
    `web/public/audio/narration/act${act}/manifest.json`,
  )

  it.each(OPTIONAL_LINES[act].map((line) => [line.opening, line] as const))(
    'voices the optional line "%s" in its speaker\'s voice',
    (_opening, expected) => {
      const line = script.find((entry) =>
        entry.text.startsWith(expected.opening),
      )
      expect(line?.speaker).toBe(expected.speaker)
      const clip = manifest[line?.key ?? '']
      // A line with no recording yet is not a defect; a recorded one has its speaker's voice.
      if (clip) expect(clip.speaker).toBe(expected.speaker)
    },
  )
})

describe('Act I stock replies in the script (rq-bio)', () => {
  const script = readJson<ScriptLine[]>('tts/act1/script.json')

  it('holds each give refusal once, whatever item was offered', () => {
    for (const opening of [
      'Tilda looks it over',
      'The priest shakes his head and',
      'The deer sniffs at it',
      'Grandmother turns it over',
      'Mira regards it',
      'The blacksmith gives it a glance',
      'The fisherman eyes it',
      'The merchant weighs it',
      'Patches sniffs at your offering',
    ]) {
      expect(
        script.filter((line) => line.text.startsWith(opening)),
        opening,
      ).toHaveLength(1)
    }
  })

  it('no longer holds a stock reply that names the item or the typed word', () => {
    const echoes = script.filter((line) =>
      /doesn't seem interested in the|to sell right now|You don't see any|looks at the (bread|faded|rusty)|examines the|curiously but/.test(
        line.text,
      ),
    )
    expect(echoes).toEqual([])
  })
})

/** The replies to resting that are read aloud: the everyday one in every act, and the special ones where a room gives them. */
const REST_LINES: Record<number, string[]> = {
  1: [
    'You rest for a moment, gathering your strength.',
    'You are asleep already. The voice says your name again, nearer.',
    'You rest for a while, but the glade remains quiet. Perhaps something more needs to happen for its magic to awaken.',
    'You take a moment to rest in the tranquil glade. The Deer continues to graze peacefully.',
  ],
  2: ['You rest for a moment, gathering your strength.'],
  3: [
    'You rest for a moment, gathering your strength.',
    'The heat of the crater soaks into you, and the ache goes out of your legs.',
    'The vents exhale. A scalding gust roars up out of the southern tunnel.',
    'The vents fall still, holding their breath. The heat hangs heavy and unmoving.',
    'The vents draw in. A cool draught tugs past you toward the south.',
  ],
  4: [
    'You rest for a moment, gathering your strength.',
    'You sit down among the orbs and wait, and say nothing at all. The Shadow watches you do it for a long time.',
  ],
}

describe.each([1, 2, 3, 4])('narration of resting in Act %i', (act) => {
  const script = readJson<ScriptLine[]>(`tts/act${act}/script.json`)

  it.each(REST_LINES[act])('has the narrator read "%s"', (words) => {
    expect(script.find((entry) => entry.text === words)?.speaker).toBe(
      'narrator',
    )
  })
})

describe.each([1, 2, 3, 4])(
  'the pickup sentence in the script of Act %i (rq-do7s)',
  (act) => {
    it('is voiced by the narrator', () => {
      const script = readJson<ScriptLine[]>(`tts/act${act}/script.json`)
      const line = script.find(
        (entry) =>
          entry.text ===
          'This might come in handy, so you decide to pick it up.',
      )
      expect(line?.speaker).toBe('narrator')
    })
  },
)
