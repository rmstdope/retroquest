import { describe, it, expect } from 'vitest'
import { decideHurryKey, type HurryKeyPress } from './hurryKeys'

/** A plain press on nothing in particular, with nothing going on. */
function press(over: Partial<HurryKeyPress>): HurryKeyPress {
  return {
    key: 'Enter',
    repeat: false,
    modified: false,
    handled: false,
    emptyBoxEnter: false,
    dialogOpen: false,
    inField: false,
    onControl: false,
    onFoldedActions: false,
    onActionButton: false,
    onPaperTab: false,
    inOpenList: false,
    settling: false,
    scene: false,
    arrival: false,
    narrating: false,
    canHide: false,
    canShow: false,
    ...over,
  }
}

const SPACE = ' '

describe('decideHurryKey during a change of scene', () => {
  const scene = { scene: true }

  it('skips the scene on Enter, Space or Escape aimed at nothing', () => {
    expect(decideHurryKey(press({ ...scene, key: 'Enter' }))).toEqual({
      action: 'skip-scene',
      consume: true,
      swallowSpaceUp: false,
    })
    expect(decideHurryKey(press({ ...scene, key: SPACE }))).toEqual({
      action: 'skip-scene',
      consume: true,
      swallowSpaceUp: true,
    })
    expect(decideHurryKey(press({ ...scene, key: 'Escape' }))).toEqual({
      action: 'skip-scene',
      consume: true,
      swallowSpaceUp: false,
    })
  })

  it('takes Enter and Space from the folded Actions, swallowing only the Space release', () => {
    const folded = { ...scene, onControl: true, onFoldedActions: true }
    expect(decideHurryKey(press({ ...folded, key: 'Enter' }))).toEqual({
      action: 'skip-scene',
      consume: true,
      swallowSpaceUp: false,
    })
    expect(decideHurryKey(press({ ...folded, key: SPACE }))).toEqual({
      action: 'skip-scene',
      consume: true,
      swallowSpaceUp: true,
    })
  })

  it('takes Enter from an empty command box, even though the box handled it', () => {
    expect(
      decideHurryKey(
        press({ ...scene, inField: true, handled: true, emptyBoxEnter: true }),
      ),
    ).toMatchObject({ action: 'skip-scene', consume: true })
  })

  it('leaves Enter and Space to a field or a control, but takes Escape', () => {
    expect(decideHurryKey(press({ ...scene, inField: true }))).toBeNull()
    expect(
      decideHurryKey(press({ ...scene, onControl: true, key: SPACE })),
    ).toBeNull()
    expect(
      decideHurryKey(press({ ...scene, onControl: true, key: 'Escape' })),
    ).toMatchObject({ action: 'skip-scene' })
  })

  it('takes Enter and Space from a button in the actions panel, swallowing only the Space release', () => {
    const verb = { ...scene, onControl: true, onActionButton: true }
    expect(decideHurryKey(press({ ...verb, key: 'Enter' }))).toEqual({
      action: 'skip-scene',
      consume: true,
      swallowSpaceUp: false,
    })
    expect(decideHurryKey(press({ ...verb, key: SPACE }))).toEqual({
      action: 'skip-scene',
      consume: true,
      swallowSpaceUp: true,
    })
  })

  it('leaves the key alone under a dialog, a modifier or a handled press', () => {
    expect(decideHurryKey(press({ ...scene, dialogOpen: true }))).toBeNull()
    expect(decideHurryKey(press({ ...scene, modified: true }))).toBeNull()
    expect(decideHurryKey(press({ ...scene, handled: true }))).toBeNull()
  })

  it('ignores other keys', () => {
    expect(decideHurryKey(press({ ...scene, key: 'a' }))).toBeNull()
  })
})

describe('decideHurryKey with nothing narrated', () => {
  it('hides the words on Escape when they may be hidden, without consuming it', () => {
    expect(decideHurryKey(press({ key: 'Escape', canHide: true }))).toEqual({
      action: 'hide-words',
      consume: false,
      swallowSpaceUp: false,
    })
    expect(
      decideHurryKey(press({ key: 'Escape', canHide: true, modified: true })),
    ).toMatchObject({ action: 'hide-words' })
  })

  it('does not hide when it may not, or when something else took Escape', () => {
    expect(decideHurryKey(press({ key: 'Escape' }))).toBeNull()
    expect(
      decideHurryKey(press({ key: 'Escape', canHide: true, handled: true })),
    ).toBeNull()
    expect(
      decideHurryKey(press({ key: 'Escape', canHide: true, dialogOpen: true })),
    ).toBeNull()
  })

  it('shows the hidden words again on a second Escape, mirroring Show', () => {
    expect(decideHurryKey(press({ key: 'Escape', canShow: true }))).toEqual({
      action: 'show-words',
      consume: false,
      swallowSpaceUp: false,
    })
    expect(
      decideHurryKey(press({ key: 'Escape', canShow: true, onControl: true })),
    ).toMatchObject({ action: 'show-words' })
  })

  it('leaves the Escape that would show the words to a field, a dialog or whoever took it', () => {
    expect(
      decideHurryKey(press({ key: 'Escape', canShow: true, inField: true })),
    ).toBeNull()
    expect(
      decideHurryKey(press({ key: 'Escape', canShow: true, handled: true })),
    ).toBeNull()
    expect(
      decideHurryKey(press({ key: 'Escape', canShow: true, dialogOpen: true })),
    ).toBeNull()
    // A held key does not flip the words back and forth.
    expect(
      decideHurryKey(press({ key: 'Escape', canShow: true, repeat: true })),
    ).toBeNull()
  })

  it('leaves Enter and Space alone', () => {
    expect(decideHurryKey(press({ key: 'Enter' }))).toBeNull()
    expect(decideHurryKey(press({ key: SPACE }))).toBeNull()
  })
})

describe('decideHurryKey just after a telling', () => {
  const settling = { settling: true }
  const verb = { ...settling, onControl: true, onActionButton: true }

  it('swallows Enter and Space on a button in the actions panel', () => {
    expect(decideHurryKey(press(verb))).toEqual({
      action: 'swallow',
      consume: true,
      swallowSpaceUp: false,
    })
    expect(decideHurryKey(press({ ...verb, key: SPACE }))).toEqual({
      action: 'swallow',
      consume: true,
      swallowSpaceUp: true,
    })
  })

  it('leaves everything else alone', () => {
    expect(decideHurryKey(press(settling))).toBeNull()
    expect(decideHurryKey(press({ ...settling, onControl: true }))).toBeNull()
    expect(decideHurryKey(press({ ...verb, key: 'a' }))).toBeNull()
    expect(decideHurryKey(press({ ...verb, modified: true }))).toBeNull()
    expect(decideHurryKey(press({ ...verb, dialogOpen: true }))).toBeNull()
    expect(decideHurryKey(press({ ...verb, handled: true }))).toBeNull()
  })

  it('leaves the key to a new arrival or change of scene', () => {
    expect(decideHurryKey(press({ ...verb, arrival: true }))).toMatchObject({
      action: 'arrival-next',
    })
    expect(decideHurryKey(press({ ...verb, scene: true }))).toMatchObject({
      action: 'skip-scene',
    })
  })
})

describe('decideHurryKey during an arrival', () => {
  const arrival = { arrival: true, narrating: true, canHide: true }

  it('goes on a part on Enter or Space, even from a focused button', () => {
    expect(
      decideHurryKey(press({ ...arrival, onControl: true, key: 'Enter' })),
    ).toEqual({ action: 'arrival-next', consume: true, swallowSpaceUp: false })
    expect(
      decideHurryKey(press({ ...arrival, onControl: true, key: SPACE })),
    ).toEqual({ action: 'arrival-next', consume: true, swallowSpaceUp: true })
  })

  it('leaves a field its keys, but an empty command box goes on', () => {
    expect(decideHurryKey(press({ ...arrival, inField: true }))).toBeNull()
    expect(
      decideHurryKey(
        press({
          ...arrival,
          inField: true,
          handled: true,
          emptyBoxEnter: true,
        }),
      ),
    ).toMatchObject({ action: 'arrival-next', consume: true })
  })

  it('lets the paper tab press itself, and goes on once for a held key', () => {
    expect(decideHurryKey(press({ ...arrival, onPaperTab: true }))).toBeNull()
    expect(decideHurryKey(press({ ...arrival, repeat: true }))).toBeNull()
    expect(
      decideHurryKey(press({ ...arrival, repeat: true, onControl: true })),
    ).toEqual({ action: 'swallow', consume: true, swallowSpaceUp: false })
  })

  it('clears on Escape', () => {
    expect(decideHurryKey(press({ ...arrival, key: 'Escape' }))).toEqual({
      action: 'arrival-clear',
      consume: true,
      swallowSpaceUp: false,
    })
  })
})

describe('decideHurryKey while the story is narrated', () => {
  const narrating = { narrating: true, canHide: true }

  it('hurries on Enter or Space aimed at nothing, swallowing no release', () => {
    expect(decideHurryKey(press({ ...narrating, key: 'Enter' }))).toEqual({
      action: 'hurry',
      consume: true,
      swallowSpaceUp: false,
    })
    expect(decideHurryKey(press({ ...narrating, key: SPACE }))).toEqual({
      action: 'hurry',
      consume: true,
      swallowSpaceUp: false,
    })
  })

  it('hurries on Space from the folded Actions and swallows its release', () => {
    expect(
      decideHurryKey(
        press({
          ...narrating,
          onControl: true,
          onFoldedActions: true,
          key: SPACE,
        }),
      ),
    ).toEqual({ action: 'hurry', consume: true, swallowSpaceUp: true })
  })

  it('hurries on Space from an action button and swallows its release, leaving Enter to it', () => {
    const verb = { ...narrating, onControl: true, onActionButton: true }
    expect(decideHurryKey(press({ ...verb, key: SPACE }))).toEqual({
      action: 'hurry',
      consume: true,
      swallowSpaceUp: true,
    })
    expect(decideHurryKey(press(verb))).toBeNull()
  })

  it('leaves Enter on the folded Actions to the button, unlike a scene', () => {
    expect(
      decideHurryKey(
        press({ ...narrating, onControl: true, onFoldedActions: true }),
      ),
    ).toBeNull()
  })

  it('leaves Enter and Space to other controls and fields', () => {
    expect(
      decideHurryKey(press({ ...narrating, onControl: true, key: SPACE })),
    ).toBeNull()
    expect(decideHurryKey(press({ ...narrating, inField: true }))).toBeNull()
  })

  it('leaves an empty command box Enter alone once the box handled it', () => {
    expect(
      decideHurryKey(
        press({
          ...narrating,
          inField: true,
          handled: true,
          emptyBoxEnter: true,
        }),
      ),
    ).toBeNull()
  })

  it('lets an open word list close on Escape, and skips on any other Escape', () => {
    expect(
      decideHurryKey(
        press({ ...narrating, inField: true, inOpenList: true, key: 'Escape' }),
      ),
    ).toBeNull()
    expect(
      decideHurryKey(press({ ...narrating, inField: true, key: 'Escape' })),
    ).toEqual({ action: 'skip-all', consume: true, swallowSpaceUp: false })
    expect(
      decideHurryKey(press({ ...narrating, onControl: true, key: 'Escape' })),
    ).toMatchObject({ action: 'skip-all' })
  })

  it('leaves the key alone under a dialog, a modifier or other keys', () => {
    expect(decideHurryKey(press({ ...narrating, dialogOpen: true }))).toBeNull()
    expect(decideHurryKey(press({ ...narrating, modified: true }))).toBeNull()
    expect(decideHurryKey(press({ ...narrating, key: 'a' }))).toBeNull()
  })
})
