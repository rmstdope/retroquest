/**
 * Who owns a key that may hurry the story.
 *
 * Enter, Space and Escape can hurry a change of scene, go on an arrival on the
 * picture, hurry the narration, or hide or show the words on the stage, and the same
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
 * button's own press. A button in the actions panel, where focus stays after
 * a verb is sent on a laptop, gives up Space, and one that sends a command
 * gives up Enter too, so a player hurrying the answer does not send it again.
 *
 * Focus stays on a verb through an arrival too, and when the last line has
 * been hurried, so a player still going on when either ends would press that
 * verb. For `AFTER_TELLING_PAUSE_MS` after keys went on an arrival or hurried
 * the narration, Enter and Space on a button in the actions panel do nothing,
 * and each further press starts the pause again.
 */

/** How long after a key went on an arrival or hurried the narration a button in the actions panel ignores Enter and Space. */
export const AFTER_TELLING_PAUSE_MS = 1000

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
  /** The target is a button in the actions panel. */
  onActionButton: boolean
  /** The target is a button in the actions panel that sends a command or builds one (a verb, an exit, a target, the hint). */
  onCommandButton: boolean
  /** The target is in the paper's tab. */
  onPaperTab: boolean
  /** The target is in an open word list (`[aria-expanded="true"]`). */
  inOpenList: boolean
  /** A key went on an arrival, hurried the narration, or was swallowed just after, within the last `AFTER_TELLING_PAUSE_MS`. */
  settling: boolean
  /** A change of scene is under way. */
  scene: boolean
  /** An arrival is shown on the picture, or its news is held for the lines before it to be read. */
  arrival: boolean
  /** The narrator is reading. */
  narrating: boolean
  /** The stage's words are shown and may be hidden. */
  canHide: boolean
  /** The stage's words are hidden and may be shown again. */
  canShow: boolean
}

/** What a taken key does. */
export type HurryKeyAction =
  | 'skip-scene'
  | 'hide-words'
  | 'show-words'
  | 'arrival-next'
  | 'arrival-clear'
  | 'hurry'
  | 'skip-all'
  | 'swallow'

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
 * command box, the folded bar's Actions (which stays folded) and a button in
 * the actions panel, where focus sits on its own (after Begin, it is on Look).
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
    press.onActionButton ||
    !(press.inField || press.onControl)
  )
    return take('skip-scene', press.key === ' ')
  return null
}

/**
 * Escape (unless a drawer, the map or a menu took it first) does what Hide
 * does on the stage, when nothing is being narrated (while it is, Escape only
 * skips); once the words are hidden, a second Escape does what Show does,
 * except in a field, where the command box keeps its own steps back (clear
 * the text, then leave the box). A held key takes no step, so the words do
 * not flicker. The key is not consumed.
 */
function hideKey(press: HurryKeyPress): HurryKeyDecision | null {
  if (
    press.key !== 'Escape' ||
    press.repeat ||
    press.handled ||
    press.narrating ||
    press.arrival ||
    press.dialogOpen
  )
    return null
  if (press.canHide)
    return { action: 'hide-words', consume: false, swallowSpaceUp: false }
  if (press.canShow && !press.inField)
    return { action: 'show-words', consume: false, swallowSpaceUp: false }
  return null
}

/**
 * An arrival on the picture takes Enter and Space even from a focused button
 * (focus stays where it was, the button is not pressed). A field keeps them,
 * but an empty command box goes on; the paper's tab is pressed as a button
 * (it ends the arrival and takes focus on); a held key goes on once, not
 * through the parts and does not press a focused button.
 */
function arrivalKey(press: HurryKeyPress): HurryKeyDecision | null {
  if (press.onPaperTab) return null
  if (press.inField && !press.emptyBoxEnter) return null
  if (press.repeat)
    return press.onControl ? take('swallow', press.key === ' ') : null
  return take('arrival-next', press.key === ' ')
}

/**
 * While the narrator reads (and for Escape on an arrival): a field keeps
 * Space and Enter, and an open word list takes Escape to close itself; any
 * other Escape skips, text kept. A button, link or summary presses on Space
 * or Enter, except Space on the folded bar's Actions or a button in the
 * actions panel, and Enter on a button there that sends a command: that is
 * the hurry the hint invites, so the sheet stays folded, the verb is not sent
 * again and a Space's release is swallowed. Enter on any other button stays
 * its own press.
 */
function narrationKey(press: HurryKeyPress): HurryKeyDecision | null {
  const hurries = goesOn(press.key)
  if (press.inField && (hurries || press.inOpenList)) return null
  const takenFromButton =
    press.key === ' '
      ? press.onActionButton || press.onFoldedActions
      : press.onCommandButton
  if (hurries && !takenFromButton && press.onControl) return null
  const swallowSpaceUp = press.key === ' ' && takenFromButton
  if (press.arrival) return take('arrival-clear', swallowSpaceUp)
  return take(hurries ? 'hurry' : 'skip-all', swallowSpaceUp)
}

/**
 * Just after keys went on an arrival or hurried the last line, Enter and
 * Space on a button in the actions panel do nothing, so a player still going
 * on does not press the verb that kept focus. While the narrator still reads
 * they go on hurrying instead.
 */
function pauseKey(press: HurryKeyPress): HurryKeyDecision | null {
  if (
    !press.settling ||
    press.arrival ||
    press.narrating ||
    !goesOn(press.key) ||
    !press.onActionButton ||
    press.handled ||
    press.modified ||
    press.dialogOpen
  )
    return null
  return take('swallow', press.key === ' ')
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
  const pause = pauseKey(press)
  if (pause) return pause
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
