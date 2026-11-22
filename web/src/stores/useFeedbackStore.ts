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

/** The beacon client ID the service knows the game by. */
const CLIENT_ID = 'retroquest'

/**
 * The feedback window's state, the one owner of what the player wrote. The kind and the words
 * outlive the window (reopening shows them) until a report is sent; nothing is stored, so a
 * reload loses them. `begin` opens the window with the picture of the screen taken just before
 * it (or none), with the picture box ticked each time; `send` files the report and moves
 * `phase` through sending to sent or failed (`error` then holds the words the player reads).
 */
export const useFeedbackStore = defineStore('feedback', () => {
  const open = ref(false)
  const kind = ref<FeedbackKind>('bug')
  const text = ref('')
  const includePicture = ref(false)
  const picture = ref<Blob | null>(null)
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

  /** Open the window over the game, with `shot` as the picture of the screen (null: none). */
  function begin(shot: Blob | null): void {
    picture.value = shot
    includePicture.value = shot !== null
    if (phase.value === 'sent') reset()
    phase.value = 'editing'
    error.value = ''
    open.value = true
  }

  /** Forget the words after a report was taken. */
  function reset(): void {
    text.value = ''
    reference.value = null
  }

  /** Close the window, sending nothing; a sent report's words are cleared. */
  function close(): void {
    if (phase.value === 'sent') reset()
    open.value = false
    picture.value = null
    phase.value = 'editing'
    error.value = ''
  }

  /** File the report; the phase says how it went. */
  async function send(context: FeedbackContext): Promise<void> {
    if (!canSend.value) return
    phase.value = 'sending'
    error.value = ''
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
