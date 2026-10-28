import { describe, it, expect } from 'vitest'
import type { Quest } from '@/engine'
import { HintOfMagicQuest } from './HintOfMagic'
import { MagicForRealQuest } from './MagicForReal'
import { FishingExpeditionQuest } from './FishingExpedition'
import { LetThereBeLightQuest } from './LetThereBeLight'
import { OhDeerOhDeerQuest } from './OhDeerOhDeer'
import { MagnetFishingExpeditionQuest } from './MagnetFishingExpedition'

/** A log text with its `[character_name]` markup removed. */
function plain(text: string): string {
  return text.replace(/\[\/?character_name\]/g, '')
}

const LOGS: Array<[string, Quest, string, string]> = [
  [
    'Hint of Magic',
    new HintOfMagicQuest(),
    'You woke with three words written down and a tune still going in the house. ' +
      'Grandmother is at the hearth, and she will want to hear about the dream.',
    "Grandmother told you of your father's journal, and his word for calling a thing back. " +
      'It came to you as she spoke, and it stayed.',
  ],
  [
    'Magic for real',
    new MagicForRealQuest(),
    'You know a spell now, but when you reach for it the warmth comes and nothing answers. ' +
      'Grandmother says Mira has a way with herbs, and with other things.',
    'The flower opened for you, and Mira showed you where the door is. Your spells answer now.',
  ],
  [
    'Fishing expedition',
    new FishingExpeditionQuest(),
    "The fisherman at the bend can't fish with his stiff arm, and he would give a good deal for a fresh fish.",
    "You brought the fisherman a fish, and he gave you back something of your mother's: " +
      'the spell she taught him at the bend.',
  ],
  [
    'Let there be light',
    new LetThereBeLightQuest(),
    'The priest is out of matches and his candle is cold. Hemlock at the General Store keeps a box for him.',
    'The candle is lit, and in the dark corner by the altar its light found a locket.',
  ],
  [
    'Oh deer, oh deer',
    new OhDeerOhDeerQuest(),
    "Borin's grandfather swore by a deer in the Hidden Glade that comes to folk who keep still. " +
      'Not to hunters. Not to talkers.',
    'The deer came to you in the glade, and where it stood a rare flower opened.',
  ],
  [
    'Magnet fishing expedition',
    new MagnetFishingExpeditionQuest(),
    'Something shiny lies at the bottom of the well, too deep for hands. ' +
      'The magnet might reach it, on a long enough rod.',
    'The well gave up a silver ring, and something else besides.',
  ],
]

describe('Act I side quest logs', () => {
  it.each(LOGS)(
    '%s reads as agreed',
    (name, quest, description, completion) => {
      expect(quest.name).toBe(name)
      expect(plain(quest.description)).toBe(description)
      expect(plain(quest.completion)).toBe(completion)
    },
  )
})
