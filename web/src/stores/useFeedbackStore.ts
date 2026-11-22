import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createBeacon } from '@/feedback/beacon'
import {
  FEEDBACK_MIN_LETTERS,
  failureText,
  headingFrom,
  lettersIn,
  versionLabel,
} from '@/feedback/feedbackReport'

/** What goes with every report besides the words: the save, where the player is and the version. */
export interface FeedbackContext {
  /** The game's current state, as the save's JSON. */
  saveData: string
  /** The act's label ("Act I"). */
  act: string
  /** The room's name. */
  room: string
  /** The game's version. */
  version: string
}

/** The two kinds a report can be: a bug (Something's wrong) or a feature request (An idea). */
export type FeedbackKind = 'bug' | 'feature'

/** Where the window is: being written, on its way, taken by the service, or refused. */
export type FeedbackPhase = 'editing' | 'sending' | 'sent' | 'failed'

/** The picture of the screen: being taken, ready, or one that could not be taken. */
export type FeedbackPictureState = 'taking' | 'ready' | 'failed'

/** The beacon client ID the service knows the game by. */
const CLIENT_ID = 'retroquest'

/**
 * The feedback window's state, the one owner of what the player wrote. The kind and the words
 * outlive the window (reopening shows them) until a report is sent; nothing is stored, so a
 * reload loses them. `begin` opens the window with the picture of the screen taken just before
 * it, with the picture box ticked each time; the picture arrives later (`pictureState` says
 * whether it is being taken, ready or could not be taken); `send` files the report and moves
 * `phase` through sending to sent or failed (`error` then holds the words the player reads).
 */
export const useFeedbackStore = defineStore('feedback', () => {
  const open = ref(false)
  const kind = ref<FeedbackKind>('bug')
  const text = ref('')
  const includePicture = ref(false)
  const picture = ref<Blob | null>(null)
  const pictureState = ref<FeedbackPictureState>('failed')
  /** The picture being taken for this window, which `send` waits for; null once it is settled. */
  let pending: Promise<void> | null = null
  /** Which opening of the window a picture belongs to; a closed window's picture is thrown away. */
  let opening = 0
  const phase = ref<FeedbackPhase>('editing')
  const error = ref('')
  const reference = ref<number | null>(null)

  const hasPicture = computed(() => picture.value !== null)
  const canSend = computed(
    () =>
      phase.value !== 'sending' &&
      phase.value !== 'sent' &&
      lettersIn(text.value) >= FEEDBACK_MIN_LETTERS,
  )

  /**
   * Open the window over the game at once, with `shot` as the picture of the screen being taken
   * (it resolves to null when it cannot be). The box is ticked; the picture fills in when it arrives.
   */
  function begin(shot: Promise<Blob | null>): void {
    const mine = ++opening
    picture.value = null
    pictureState.value = 'taking'
    includePicture.value = true
    pending = shot
      .catch((): Blob | null => null)
      .then((blob) => {
        if (mine !== opening) return
        pending = null
        picture.value = blob
        pictureState.value = blob ? 'ready' : 'failed'
        if (!blob) includePicture.value = false
      })
    if (phase.value === 'sent') reset()
    phase.value = 'editing'
    error.value = ''
    open.value = true
  }

  /** Forget the kind and words after a report was taken, so the next opens on Something's wrong. */
  function reset(): void {
    kind.value = 'bug'
    text.value = ''
    reference.value = null
  }

  /** Close the window, sending nothing (it stays while a report is on its way); a sent report's words are cleared. */
  function close(): void {
    if (phase.value === 'sending') return
    if (phase.value === 'sent') reset()
    open.value = false
    opening++
    pending = null
    picture.value = null
    phase.value = 'editing'
    error.value = ''
  }

  /** File the report; the phase says how it went. */
  async function send(context: FeedbackContext): Promise<void> {
    if (!canSend.value) return
    phase.value = 'sending'
    error.value = ''
    if (includePicture.value && pending) await pending
    const pictured = includePicture.value && picture.value !== null
    const beacon = createBeacon({
      clientId: CLIENT_ID,
      appVersion: versionLabel(context.version, context.act, context.room),
    })
    const result = await beacon.report({
      type: kind.value,
      title: headingFrom(text.value),
      description: text.value,
      save: context.saveData,
      ...(pictured && picture.value ? { screenshots: [picture.value] } : {}),
    })
    if (result.ok) {
      reference.value = result.reference
      phase.value = 'sent'
    } else {
      error.value = failureText(result.error, pictured)
      phase.value = 'failed'
    }
  }

  return {
    open,
    kind,
    text,
    includePicture,
    picture,
    pictureState,
    phase,
    error,
    reference,
    hasPicture,
    canSend,
    begin,
    close,
    send,
  }
})
