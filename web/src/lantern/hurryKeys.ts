/**
 * Who owns a key that may hurry the story.
 *
 * Enter, Space and Escape can hurry a change of scene, go on an arrival on the
 * picture, hurry the narration, or hide the words on the stage, and the same
 * keys also belong to the command box, buttons, word lists and dialogs. This
 * module is the one place that decides, from the game's mode, the key and
 * what it is aimed at, which of them gets the press, and whether the release
 * of a Space that was taken must be swallowed so it does not press the
 * focused button. The layout only describes the press and carries out the
 * answer.
 *
 * The modes keep deliberately different rules. On a phone the sheet folds as
 * a command is sent and focus lands on the folded bar's Actions: a change of
 * scene takes both Enter and Space from that button, but ordinary narration
 * takes only Space (the hurry the hint invites) and leaves Enter as the
 * button's own press. The same holds for a button in the actions panel, where
 * focus stays after a verb is sent on a laptop.
 */

/** A key press as the layout hears it: what it is, where it lands, and what is going on. */
export interface HurryKeyPress {
  /** `KeyboardEvent.key`. */
  key: string
  /** The key is held down and repeating. */
  repeat: boolean
  /** Ctrl, Meta or Alt is held. */
  modified: boolean
  /** Something before the layout already handled the press (`defaultPrevented`). */
  handled: boolean
  /** Enter pressed in a command box with nothing typed. */
  emptyBoxEnter: boolean
  /** A pop-up, menu or dialog is open (it has its own keys). */
  dialogOpen: boolean
  /** The target is in an input, textarea, select or editable text. */
  inField: boolean
  /** The target is in a button, link, `[role="button"]` or summary. */
  onControl: boolean
  /** The target is in the folded bar's Actions button. */
  onFoldedActions: boolean
  /** The target is a button in the actions panel (a verb, an exit, a target). */
  onActionButton: boolean
  /** The target is in the paper's tab. */
  onPaperTab: boolean
  /** The target is in an open word list (`[aria-expanded="true"]`). */
  inOpenList: boolean
  /** A change of scene is under way. */
  scene: boolean
  /** An arrival is shown on the picture, or its news is held for the lines before it to be read. */
  arrival: boolean
  /** The narrator is reading. */
  narrating: boolean
  /** The stage's words are shown and may be hidden. */
  canHide: boolean
}

/** What a taken key does. */
export type HurryKeyAction =
  | 'skip-scene'
  | 'hide-words'
  | 'arrival-next'
  | 'arrival-clear'
  | 'hurry'
  | 'skip-all'

/** The answer for a key the story takes. */
export interface HurryKeyDecision {
  /** What the key does. */
  action: HurryKeyAction
  /** Whether the press is consumed (`preventDefault`), so nothing else acts on it. */
  consume: boolean
  /**
   * For a consumed press: whether the matching Space key-up must be swallowed,
   * so it does not press the focused button. Every consumed press sets the
   * guard to this value; an unconsumed one leaves it as it was.
   */
  swallowSpaceUp: boolean
}

/** Whether the key is Enter or Space, the keys that go on. */
function goesOn(key: string): boolean {
  return key === 'Enter' || key === ' '
}

/** A consumed press doing `action`. */
function take(
  action: HurryKeyAction,
  swallowSpaceUp: boolean,
): HurryKeyDecision {
  return { action, consume: true, swallowSpaceUp }
}

/**
 * During a change of scene, Enter, Space or Escape brings the new room up at
 * once. Fields and controls keep their own Enter and Space, except an empty
 * command box and the folded bar's Actions (which stays folded).
 */
function sceneKey(press: HurryKeyPress): HurryKeyDecision | null {
  if (
    !press.scene ||
    (press.handled && !press.emptyBoxEnter) ||
    press.modified ||
    !(goesOn(press.key) || press.key === 'Escape') ||
    press.dialogOpen
  )
    return null
  if (
    press.key === 'Escape' ||
    press.emptyBoxEnter ||
    press.onFoldedActions ||
    !(press.inField || press.onControl)
  )
    return take('skip-scene', press.key === ' ')
  return null
}

/**
 * Escape (unless a drawer, the map or a menu took it first) does what Hide
 * does on the stage, when nothing is being narrated (while it is, Escape only
 * skips). The key is not consumed.
 */
function hideKey(press: HurryKeyPress): HurryKeyDecision | null {
  if (
    press.key === 'Escape' &&
    !press.handled &&
    press.canHide &&
    !press.narrating &&
    !press.arrival &&
    !press.dialogOpen
  )
    return { action: 'hide-words', consume: false, swallowSpaceUp: false }
  return null
}

/**
 * An arrival on the picture takes Enter and Space even from a focused button
 * (focus stays where it was, the button is not pressed). A field keeps them,
 * but an empty command box goes on; the paper's tab is pressed as a button
 * (it ends the arrival and takes focus on); a held key goes on once, not
 * through the parts.
 */
function arrivalKey(press: HurryKeyPress): HurryKeyDecision | null {
  if (press.onPaperTab || press.repeat) return null
  if (press.inField && !press.emptyBoxEnter) return null
  return take('arrival-next', press.key === ' ')
}

/**
 * While the narrator reads (and for Escape on an arrival): a field keeps
 * Space and Enter, and an open word list takes Escape to close itself; any
 * other Escape skips, text kept. A button, link or summary presses on Space
 * or Enter, so building a command goes on while the voice reads, except Space
 * on the folded bar's Actions or on a button in the actions panel: that is
 * the hurry the hint invites, so the sheet stays folded, the verb is not sent
 * again and the release is swallowed. Enter there stays the button's own
 * press.
 */
function narrationKey(press: HurryKeyPress): HurryKeyDecision | null {
  const hurries = goesOn(press.key)
  if (press.inField && (hurries || press.inOpenList)) return null
  const actionsSpace =
    press.key === ' ' && (press.onFoldedActions || press.onActionButton)
  if (hurries && !actionsSpace && press.onControl) return null
  if (press.arrival) return take('arrival-clear', actionsSpace)
  return take(hurries ? 'hurry' : 'skip-all', actionsSpace)
}

/**
 * Decide who owns a key that may hurry the story: the decision when the
 * story takes it, or `null` when it is left to whatever it is aimed at.
 */
export function decideHurryKey(press: HurryKeyPress): HurryKeyDecision | null {
  const scene = sceneKey(press)
  if (scene) return scene
  const hide = hideKey(press)
  if (hide) return hide
  if (!(press.narrating || press.arrival)) return null
  // The command box handles its own Enter (and marks it handled); on an
  // arrival an empty box still lets that Enter go on.
  if (press.handled && !(press.arrival && press.emptyBoxEnter)) return null
  if (press.modified) return null
  if (!goesOn(press.key) && press.key !== 'Escape') return null
  if (press.dialogOpen) return null
  if (press.arrival && goesOn(press.key)) return arrivalKey(press)
  return narrationKey(press)
}
