/** The elements that lie over the room picture carry their `data-lq-obstacle` kind in their templates. */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/** What each element over the picture is declared as, in the file that draws it. */
const DECLARED: Array<[file: string, cls: string, kind: string]> = [
  ['LanternLayout.vue', 'lq-float-menu', 'keep-clear'],
  ['LanternLayout.vue', 'lq-stage-plate', 'panel'],
  ['LanternLayout.vue', 'lq-phone-plate', 'panel'],
  ['LanternLayout.vue', 'lq-narration-hint', 'words'],
  ['LanternLayout.vue', 'lq-more-below', 'words'],
  ['LanternLayout.vue', 'lq-words-hide', 'panel'],
  ['LanternLayout.vue', 'lq-paper-tab', 'panel'],
  ['LanternLayout.vue', 'lq-show-names', 'panel'],
  ['LanternLayout.vue', 'lq-composer', 'keep-clear'],
  ['StageButtons.vue', 'lq-stage-btn', 'panel'],
  ['StageButtons.vue', 'lq-map-pop', 'panel'],
  ['ArrivalOnPicture.vue', 'lq-arrival-card', 'words'],
  ['StageSpeech.vue', 'lq-ln', 'words'],
  ['StageSpeech.vue', 'lq-line-name', 'words'],
  ['ColumnTurn.vue', 'lq-cl', 'card'],
  ['SpeechPortrait.vue', 'lq-card', 'card'],
]

/** The opening tags in `source` that carry the class `cls`. */
function tagsWith(source: string, cls: string): string[] {
  return (source.match(/<[a-zA-Z][^<>]*?>/gs) ?? []).filter((tag) =>
    new RegExp(`class="${cls}"`).test(tag),
  )
}

describe('obstacle markers in the templates (rq-rmg7)', () => {
  it.each(DECLARED)('%s: .%s is a %s', (file, cls, kind) => {
    const tags = tagsWith(readFileSync(resolve(__dirname, file), 'utf8'), cls)
    expect(tags.length).toBeGreaterThan(0)
    for (const tag of tags) expect(tag).toContain(`data-lq-obstacle="${kind}"`)
  })

  it('marks the story that clips the cards, and the card of a story turn', () => {
    const layout = readFileSync(resolve(__dirname, 'LanternLayout.vue'), 'utf8')
    expect(tagsWith(layout, 'lq-story')[0]).toContain('data-lq-clip')
    const turn = readFileSync(resolve(__dirname, 'StoryTurn.vue'), 'utf8')
    expect(turn).toContain(`:data-lq-obstacle="card ? 'card' : undefined"`)
  })
})
