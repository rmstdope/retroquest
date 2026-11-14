import { describe, it, expect } from 'vitest'
import { decidePointerPress, quietPress, type PressKind } from './pointerPress'

const press = quietPress

/** The kinds that bring a change of scene up before anything else. */
const SCENE_KINDS: PressKind[] = ['picture', 'belt', 'exit-dot']

describe('decidePointerPress', () => {
  describe('during a change of scene', () => {
    it.each(SCENE_KINDS)('a press on the %s continues the scene', (kind) => {
      expect(decidePointerPress(press(kind, { scene: true })).action).toBe(
        'continue-scene',
      )
    })

    it('a thing does nothing, as the game takes no move', () => {
      expect(
        decidePointerPress(press('thing', { scene: true, sceneBusy: true }))
          .action,
      ).toBe('none')
    })
  })

  describe('with a talk still to change the scene', () => {
    it.each(SCENE_KINDS)('a press on the %s brings the new room up', (kind) => {
      expect(
        decidePointerPress(press(kind, { sceneChange: true, way: true }))
          .action,
      ).toBe('scene-now')
    })
  })

  describe('a narrated turn with speech', () => {
    it('hurries from the picture, the belt, the speech and the story', () => {
      for (const kind of ['picture', 'belt', 'speech'] as const)
        expect(decidePointerPress(press(kind, { telling: true })).action).toBe(
          'hurry',
        )
      expect(decidePointerPress(press('story', { telling: true })).action).toBe(
        'tap',
      )
    })

    it('leaves a thing and a way dot to do nothing', () => {
      expect(decidePointerPress(press('thing', { telling: true })).action).toBe(
        'none',
      )
      expect(
        decidePointerPress(press('exit-dot', { telling: true })).action,
      ).toBe('none')
    })
  })

  describe('a narrated turn without speech', () => {
    it('a press on the picture still hurries the narrator', () => {
      expect(
        decidePointerPress(press('picture', { telling: true })).action,
      ).toBe('hurry')
    })
  })

  describe('an unnarrated arrival (nothing told)', () => {
    it('the picture hurries whatever is left, harmlessly', () => {
      expect(decidePointerPress(press('picture')).action).toBe('hurry')
    })

    it('a thing opens its ring, or takes what is in hand', () => {
      expect(decidePointerPress(press('thing')).action).toBe('open-ring')
      expect(decidePointerPress(press('thing', { hand: true })).action).toBe(
        'send-hand',
      )
    })

    it('the belt opens its ring, or takes what is in hand', () => {
      expect(decidePointerPress(press('belt')).action).toBe('open-ring')
      expect(decidePointerPress(press('belt', { hand: true })).action).toBe(
        'send-hand',
      )
    })

    it('a way goes at once when the game takes input', () => {
      expect(decidePointerPress(press('picture', { way: true })).action).toBe(
        'go-way',
      )
      expect(decidePointerPress(press('exit-dot', { way: true })).action).toBe(
        'go-way',
      )
    })

    it('a closed way on the picture hurries instead; on a dot it does nothing', () => {
      const closed = { way: true, acceptInput: false }
      expect(decidePointerPress(press('picture', closed)).action).toBe('hurry')
      expect(decidePointerPress(press('exit-dot', closed)).action).toBe('none')
    })
  })

  describe('a thing', () => {
    it('gives way to a way out lying under the press', () => {
      expect(decidePointerPress(press('thing', { way: true })).action).toBe(
        'none',
      )
    })

    it.each([
      ['no input', { acceptInput: false }],
      ['a scene running', { sceneBusy: true }],
      ['a dialog, drawer or sheet', { blocked: true }],
    ])('does nothing with %s', (_name, over) => {
      expect(decidePointerPress(press('thing', over)).action).toBe('none')
      expect(decidePointerPress(press('belt', over)).action).toBe('none')
    })
  })

  describe('the speech and the story text', () => {
    it('the speech always hurries', () => {
      expect(decidePointerPress(press('speech')).action).toBe('hurry')
    })

    it('the story taps, but a control in it keeps its press', () => {
      expect(decidePointerPress(press('story')).action).toBe('tap')
      expect(
        decidePointerPress(press('story', { onControl: true })).action,
      ).toBe('none')
    })
  })
})
