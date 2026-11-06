/**
 * The music briefs written for single rooms, by the room's music track id
 * (`roomTrackId`): a prompt for Content Studio's music model naming the style,
 * the instruments, the atmosphere and the feeling of the room, with a tempo and
 * a key to suit it. A room without a brief here is briefed from its own
 * description (`roomLoops` in `musicLists.ts`), with no tempo or key.
 */
import type { MusicTrack } from './musicLists'

/** What a room's own brief sets: its prompt, tempo and key. */
export type RoomMusicBrief = Required<Pick<MusicTrack, 'text' | 'bpm' | 'key'>>

/** The briefs of the rooms of Acts 2 and 3, in the order the acts list their rooms. */
export const ROOM_MUSIC_BRIEFS: Readonly<Record<string, RoomMusicBrief>> = {
  'act2-mountain-path': {
    text:
      'medieval folk travelling tune, wooden flute, fingerpicked lute, ' +
      'soft frame drum, open mountain air and pine, bright and spacious, ' +
      'a journey begun with quiet hope, instrumental, no vocals',
    bpm: 92,
    key: 'D major',
  },
  'act2-greendale-gates': {
    text:
      'medieval processional march, brass horns, snare and timpani, ' +
      'steady stately pulse, a great stone archway with banners in the ' +
      'breeze, proud and welcoming, the first sight of a great city, ' +
      'instrumental, no vocals',
    bpm: 100,
    key: 'D major',
  },
  'act2-main-square': {
    text:
      'bustling medieval town square, lute, fiddle, hand drums and ' +
      'tambourine, a splashing fountain and bright awnings, busy and ' +
      'sunny, cheerful civic pride, instrumental, no vocals',
    bpm: 80,
    key: 'A major',
  },
  'act2-market-district': {
    text:
      'lively medieval bazaar, hammered dulcimer, oud, darbuka and shaker, ' +
      'a winding melody through crowded narrow streets, spice and leather, ' +
      'energetic and curious, a little mischievous, instrumental, no vocals',
    bpm: 112,
    key: 'E minor',
  },
  'act2-silver-stag-inn': {
    text:
      'warm tavern jig, flute and acoustic guitar, fiddle and bodhrán, ' +
      'firelight and the warm bustle of a busy taproom, lively but ' +
      'easy, friendly and welcoming, instrumental, no vocals',
    bpm: 108,
    key: 'G major',
  },
  'act2-inn-rooms': {
    text:
      'quiet medieval lullaby, solo classical guitar, soft harp, gentle ' +
      'sustained strings, candlelight in a small private room, restful ' +
      'and safe, calm after a long day, instrumental, no vocals',
    bpm: 66,
    key: 'F major',
  },
  'act2-merchants-warehouse': {
    text:
      'hushed medieval mystery, pizzicato strings, low clarinet, soft ' +
      'bodhrán, sparse and creeping, cool still air between tall crates, ' +
      'curious and watchful, instrumental, no vocals',
    bpm: 84,
    key: 'D minor',
  },
  'act2-castle-approach': {
    text:
      'grand church-like processional, pipe organ, brass, long reverb, ' +
      'a wide avenue of statues to a castle of white stone and tall ' +
      'spires, majestic and solemn, awe and reverence, ' +
      'instrumental, no vocals',
    bpm: 70,
    key: 'C major',
  },
  'act2-castle-courtyard': {
    text:
      'martial medieval training music, snare and taiko drums, brass ' +
      'stabs, driving low strings, clashing rhythm of sword practice, ' +
      'disciplined and energetic, instrumental, no vocals',
    bpm: 120,
    key: 'D minor',
  },
  'act2-great-hall': {
    text:
      'regal medieval court music, harpsichord, recorder consort, warm ' +
      'strings, a vast hall of stone columns, stately and ceremonial, ' +
      'dignified grandeur, instrumental, no vocals',
    bpm: 76,
    key: 'Bb major',
  },
  'act2-residential-quarter': {
    text:
      'gentle medieval folk, lute, recorder, soft cello, quiet lanes and ' +
      'craftsmen at their benches, gardens gone grey, homely but ' +
      'wistful, warmth with a trace of sorrow, instrumental, no vocals',
    bpm: 78,
    key: 'A minor',
  },
  'act2-healers-house': {
    text:
      'slow tender medieval lament, solo cello, harp, faint chimes, ' +
      'sparse and hushed, dried herbs and empty bottles, worry and ' +
      'quiet care, instrumental, no vocals',
    bpm: 50,
    key: 'F minor',
  },
  'act2-hidden-library': {
    text:
      'mystical ambient, celesta, glass harmonica, soft strings over a ' +
      'humming drone, long reverb, glowing crystals in an ancient vault, ' +
      'wonder and secret knowledge, instrumental, no vocals',
    bpm: 60,
    key: 'E minor',
  },
  'act2-forest-transition': {
    text:
      'dark folk ambient, low drone, frame drum like a slow heartbeat, ' +
      'bowed psaltery, mossy standing stones at the edge of a dark wood, ' +
      'an eerie threshold, apprehensive and ancient, ' +
      'instrumental, no vocals',
    bpm: 64,
    key: 'D minor',
  },
  'act2-forest-entrance': {
    text:
      'enchanted forest, harp, flute, soft strings and wind chimes, ' +
      'dappled sunlight under a cathedral of trees, magical and green, ' +
      'gentle awe, instrumental, no vocals',
    bpm: 72,
    key: 'G major',
  },
  'act2-ancient-grove': {
    text:
      'ancient sacred grove, wooden flute, deep drone, bowed strings, slow ' +
      'hand drum, trees older than any letters, timeless and still, ' +
      'reverent mystery, instrumental, no vocals',
    bpm: 56,
    key: 'A minor',
  },
  'act2-whispering-glade': {
    text:
      'pastoral meadow, harp, recorder, light pizzicato strings, a ' +
      'babbling brook among wildflowers, bright and airy, peaceful and ' +
      'tender, instrumental, no vocals',
    bpm: 84,
    key: 'F major',
  },
  'act2-heart-of-the-forest': {
    text:
      'ethereal fantasy, shimmering strings, harp glissandi, celesta, a ' +
      'warm french horn, green and gold light from nowhere, magical and ' +
      'sacred, quiet awe and hope, instrumental, no vocals',
    bpm: 60,
    key: 'E major',
  },
  'act3-miras-hut': {
    text:
      "mysterious herbalist's hut, hammered dulcimer, low flute, soft " +
      'frame drum, bundles of herbs and labelled bottles, dark and ' +
      'secretive yet safe, a last refuge before the storm, ' +
      'instrumental, no vocals',
    bpm: 75,
    key: 'F minor',
  },
  'act3-tidal-causeway': {
    text:
      'haunting seascape, low strings, bowed glass, a distant horn, slow ' +
      'swell like breaking waves, moonlight on black water and ' +
      'salt wind, lonely and eerie, instrumental, no vocals',
    bpm: 70,
    key: 'D minor',
  },
  'act3-shoreline-markers': {
    text:
      'bleak coastal ambient, solo cello, low drone, sparse harp, cold ' +
      'wind over sand and weathered stones, desolate and ' +
      'contemplative, instrumental, no vocals',
    bpm: 58,
    key: 'A minor',
  },
  'act3-outer-wards': {
    text:
      'drowned ruins, low brass, tremolo strings, timpani swells, ancient ' +
      'pillars rising from black water, the sea reclaiming the stone, ' +
      'ominous and solemn, instrumental, no vocals',
    bpm: 66,
    key: 'C minor',
  },
  'act3-collapsed-pier': {
    text:
      'dark nautical lament, creaking low strings, bass clarinet, a slow ' +
      'tolling bell, a patient counting rhythm, rotting timbers and ' +
      'black water, decay and loss, melancholy dread, ' +
      'instrumental, no vocals',
    bpm: 54,
    key: 'G minor',
  },
  'act3-submerged-antechamber': {
    text:
      'underwater ambient, glassy pads, celesta, bowed vibraphone, deep ' +
      'reverb, cold glowing carvings under salt-smoothed arches, ' +
      'mysterious and hushed, instrumental, no vocals',
    bpm: 62,
    key: 'B minor',
  },
  'act3-sanctum-of-the-tide': {
    text:
      'sacred and eerie ritual, pipe organ drone, deep strings, ' +
      'shimmering harp, slow breathing swells, still water like a dark ' +
      'mirror etched with sigils, awe and foreboding, ' +
      'instrumental, no vocals',
    bpm: 52,
    key: 'C# minor',
  },
  'act3-lower-switchbacks': {
    text:
      'volcanic trek, low taiko, cello ostinato, rough wind drone, ash ' +
      'and iron on the wind across black rock, harsh and determined, ' +
      'a hard climb, instrumental, no vocals',
    bpm: 92,
    key: 'E minor',
  },
  'act3-obsidian-outcrops': {
    text:
      'jagged tension, staccato strings, metallic percussion, dissonant ' +
      'brass hits, black glass towers like teeth, sharp and dangerous, ' +
      'wary and on edge, instrumental, no vocals',
    bpm: 100,
    key: 'F minor',
  },
  'act3-mirror-terraces': {
    text:
      'glinting puzzle music, celesta, harp arpeggios, plucked strings, ' +
      'brass bells, circling patterns like rings of mirrors, light ' +
      'caught and reflected, curious and focused, instrumental, no vocals',
    bpm: 84,
    key: 'D major',
  },
  'act3-fumarole-passages': {
    text:
      'breathing ambient, a low pulse like slow breath, hand drum, deep ' +
      'bass drone, hissing textures, narrow hot tunnels of a sleeping ' +
      'mountain, close and uneasy, instrumental, no vocals',
    bpm: 68,
    key: 'D minor',
  },
  'act3-ember-gallery': {
    text:
      'smouldering orchestral, low strings, warm brass, soft timpani ' +
      'rolls, glowing cinders in a cavern of cooling lava, charcoal and ' +
      'iron, heavy and brooding, instrumental, no vocals',
    bpm: 76,
    key: 'A minor',
  },
  'act3-phoenix-crater': {
    text:
      'soaring orchestral, rising strings, french horns, harp and ' +
      'timpani, cinders dancing in spirals in a luminous crater, ' +
      'radiant and triumphant, rebirth and hope, instrumental, no vocals',
    bpm: 96,
    key: 'Eb major',
  },
  'act3-cavern-mouth': {
    text:
      'foreboding cave ambient, low drone, sparse plucked harp, distant ' +
      'dripping, cold mist where the lantern light fades, old worn ' +
      'signs, apprehensive, instrumental, no vocals',
    bpm: 62,
    key: 'E minor',
  },
  'act3-tool-cache': {
    text:
      "miner's work theme, anvil and metal percussion, bowed bass, low " +
      'whistle, a steady practical rhythm, timbers, rope and iron in ' +
      'wet earth, resourceful but tense, instrumental, no vocals',
    bpm: 88,
    key: 'G minor',
  },
  'act3-collapsed-galleries': {
    text:
      'heavy ambient, deep rumbling percussion, low strings, sparse ' +
      'piano, dust hanging over fallen stone and snapped timbers, ' +
      'crushing weight, oppressive and cautious, instrumental, no vocals',
    bpm: 58,
    key: 'B minor',
  },
  'act3-echo-chambers': {
    text:
      'echoing minimalism, kalimba and harp with long delay, every phrase ' +
      'answered a breath late, bare stone reverb, uncanny and watchful, ' +
      'the sense of being copied, instrumental, no vocals',
    bpm: 70,
    key: 'F# minor',
  },
  'act3-stillness-vestibule': {
    text:
      'near-silent ambient, soft sustained strings, faint glass tones, ' +
      'very sparse, dark pools so still they seem frozen, hushed and ' +
      'suspended, a held breath, instrumental, no vocals',
    bpm: 44,
    key: 'C minor',
  },
  'act3-dragons-hall': {
    text:
      'vast ancient orchestral, deep brass, low drone, slow heartbeat ' +
      'timpani, dripping water, cavernous reverb, embers pulsing in the ' +
      'dark, awe and fear before a dragon, instrumental, no vocals',
    bpm: 60,
    key: 'D minor',
  },
  'act3-fortress-entrance': {
    text:
      'dark menacing orchestral, low brass, pounding taiko, tremolo ' +
      'strings, iron gates and slowly glowing sigils in a cold wind, ' +
      'dread and resolve before the final confrontation, ' +
      'instrumental, no vocals',
    bpm: 80,
    key: 'C minor',
  },
}
