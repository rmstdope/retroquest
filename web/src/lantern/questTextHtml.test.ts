import { describe, it, expect } from 'vitest'
import { questTextHtml } from './questTextHtml'
import { wrapWords } from './wrapWords'
import { questTextBlocks } from './narrationScript'
import { narrationWords } from './narrationManifest'

const CHECKLIST =
  '[character_name]Mira[/character_name] has tasked you. She says you will need: \n' +
  '[success] * Warm clothing[/success]\n' +
  '[pending] * Sturdy footwear[/pending]'

describe('questTextHtml', () => {
  it('shows a checklist as a list of done and pending items, without bullets', () => {
    expect(questTextHtml(CHECKLIST)).toBe(
      '<p class="lq-quest-para"><span class="theme-character_name">Mira</span>' +
        ' has tasked you. She says you will need:</p>\n' +
        '<ul class="lq-quest-checklist">\n' +
        '<li class="lq-check-done">Warm clothing</li>\n' +
        '<li class="lq-check-pending">Sturdy footwear</li>\n' +
        '</ul>',
    )
  })

  it('holds exactly the words the narration reads, so the read-along can mark them', () => {
    const spoken = questTextBlocks(CHECKLIST).flatMap((block) =>
      narrationWords(block.markup),
    )
    expect(wrapWords(questTextHtml(CHECKLIST)).count).toBe(spoken.length)
  })

  it('renders text without a checklist as before', () => {
    expect(questTextHtml('A [item_name]key[/item_name].\nOld door.')).toBe(
      'A <span class="theme-item_name">key</span>.<br>Old door.',
    )
  })
})
