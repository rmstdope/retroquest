<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useFeedbackStore, type FeedbackKind } from '@/stores/useFeedbackStore'
import { FEEDBACK_MAX } from '@/feedback/feedbackReport'
import LanternDialog from './LanternDialog.vue'

/**
 * The feedback window, a pane of frosted glass over the dimmed game: the eyebrow "Feedback", the
 * heading "Tell us what you found", the two kinds as chips (Something's wrong, An idea), one box
 * (at most 5,000 characters, counted under it), the box that includes a picture of the screen
 * (with a small copy beside it), a quiet line of what goes with every report (the save, `place`
 * and the version), and Cancel and Send at the foot. Everything is read from and written to the
 * feedback store; Send only asks (`send`), the layout adds what the store cannot know. Cancel, ✕,
 * Escape and a click on the dimmed game emit `close`. While sending nothing can be changed; a
 * refusal shows its words in red above the buttons and Send is live again; once the report is taken
 * the window becomes "Thank you" with one button back to the game. Focus starts in the box.
 */
defineProps<{
  /** Where the player is, as the quiet line names it ("Act I · Riverbank"). */
  place: string
}>()
const emit = defineEmits<{ close: []; send: [] }>()
const feedback = useFeedbackStore()
const { kind, text, includePicture, phase, error, reference, pictureState } =
  storeToRefs(feedback)

const KINDS: Array<{ kind: FeedbackKind; label: string }> = [
  { kind: 'bug', label: "Something's wrong" },
  { kind: 'feature', label: 'An idea' },
]
const sending = computed(() => phase.value === 'sending')
const sent = computed(() => phase.value === 'sent')
const failed = computed(() => phase.value === 'failed')

const dialog = ref<InstanceType<typeof LanternDialog> | null>(null)
const box = ref<HTMLTextAreaElement | null>(null)

// Focus follows the window's change: to the way back once sent, to the box after a refusal
// (the control that had it was disabled or removed).
watch(phase, async (now) => {
  if (now !== 'sent' && now !== 'failed') return
  await nextTick()
  if (now === 'sent') dialog.value?.focusFirst()
  else box.value?.focus()
})

/** The small copy of the picture, made from the store's picture while it is ticked. */
const pictureUrl = ref('')
watch(
  [() => feedback.picture, includePicture],
  () => {
    if (pictureUrl.value) URL.revokeObjectURL(pictureUrl.value)
    pictureUrl.value =
      includePicture.value && feedback.picture
        ? URL.createObjectURL(feedback.picture)
        : ''
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (pictureUrl.value) URL.revokeObjectURL(pictureUrl.value)
})
</script>

<template>
  <LanternDialog
    ref="dialog"
    data-feedback-window
    :title="sent ? 'Thank you' : 'Tell us what you found'"
    :eyebrow="sent ? '' : 'Feedback'"
    centered
    glass
    narrow
    @close="emit('close')"
  >
    <div v-if="sent" class="lq-feedback-sent">
      <p class="lq-feedback-ok" role="status">
        {{ `Sent — it's report #${reference}. Thank you for telling us.` }}
      </p>
    </div>
    <form v-else class="lq-feedback" @submit.prevent>
      <div class="lq-feedback-kinds" role="radiogroup" aria-label="Kind">
        <button
          v-for="choice in KINDS"
          :key="choice.kind"
          type="button"
          role="radio"
          class="lq-feedback-chip"
          :aria-checked="kind === choice.kind"
          :disabled="sending"
          @click="kind = choice.kind"
        >
          {{ choice.label }}
        </button>
      </div>
      <textarea
        ref="box"
        v-model="text"
        class="lq-feedback-box"
        data-autofocus
        rows="5"
        :maxlength="FEEDBACK_MAX"
        :disabled="sending"
        aria-label="What you found"
        placeholder="What happened, or what would make the game better?"
      ></textarea>
      <p class="lq-feedback-count" aria-hidden="true">
        {{ text.length }} / {{ FEEDBACK_MAX }}
      </p>
      <label class="lq-feedback-picture">
        <input
          v-model="includePicture"
          type="checkbox"
          :disabled="sending || pictureState === 'failed'"
        />
        <span>Include a picture of the screen</span>
        <img
          v-if="pictureUrl"
          class="lq-feedback-thumb"
          :src="pictureUrl"
          alt=""
        />
        <span
          v-else-if="includePicture && pictureState === 'taking'"
          class="lq-feedback-shim"
          aria-hidden="true"
        ></span>
      </label>
      <p v-if="pictureState === 'taking'" class="lq-feedback-quiet">
        Taking the picture…
      </p>
      <p v-else-if="pictureState === 'failed'" class="lq-feedback-quiet">
        The picture couldn't be taken. Your report can still be sent without it.
      </p>
      <p v-else class="lq-feedback-quiet">
        Screenshots are posted publicly with your report. Check they show
        nothing private.
      </p>
      <p class="lq-feedback-quiet">
        {{
          `Your save, where you are (${place}) and the game's version go with it, ` +
          'so we can load exactly what you saw. Reports are posted publicly — ' +
          "don't write anything private."
        }}
      </p>
      <p v-if="failed" class="lq-feedback-error" role="alert">{{ error }}</p>
    </form>
    <template #footer>
      <div class="lq-feedback-buttons">
        <button
          v-if="sent"
          type="button"
          class="lq-feedback-primary"
          data-autofocus
          @click="emit('close')"
        >
          Back to the game
        </button>
        <template v-else>
          <button
            type="button"
            class="lq-feedback-plain"
            :disabled="sending"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            class="lq-feedback-primary"
            :disabled="!feedback.canSend"
            @click="emit('send')"
          >
            {{ sending ? 'Sending…' : 'Send' }}
          </button>
        </template>
      </div>
    </template>
  </LanternDialog>
</template>

<style scoped>
.lq-feedback {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lq-feedback-kinds {
  display: flex;
  gap: 8px;
}
.lq-feedback-chip {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-feedback-chip[aria-checked='true'] {
  border-color: var(--lq-accent);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
.lq-feedback-box {
  width: 100%;
  min-height: 96px;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: rgb(0 0 0 / 0.25);
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  resize: vertical;
}
.lq-feedback-count {
  margin: -6px 0 0;
  text-align: right;
  font-size: 11px;
  color: var(--lq-muted);
}
.lq-feedback-picture {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.lq-feedback-picture input {
  width: 18px;
  height: 18px;
  accent-color: var(--lq-accent);
}
.lq-feedback-thumb {
  margin-left: auto;
  width: 96px;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--lq-line2);
}
.lq-feedback-shim {
  margin-left: auto;
  width: 96px;
  aspect-ratio: 16 / 9;
  box-sizing: border-box;
  border-radius: 6px;
  border: 1px dashed var(--lq-line2);
  background: linear-gradient(
    90deg,
    rgb(243 234 214 / 0.05),
    rgb(243 234 214 / 0.16),
    rgb(243 234 214 / 0.05)
  );
  background-size: 200% 100%;
  animation: lq-feedback-shimmer 1.2s linear infinite;
}
@keyframes lq-feedback-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: 0 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .lq-feedback-shim {
    animation: none;
  }
}
.lq-feedback-quiet {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--lq-muted);
}
.lq-feedback-error,
.lq-feedback-ok {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
}
.lq-feedback-error {
  background: var(--lq-failure-soft);
  border: 1px solid var(--lq-failure);
  color: var(--lq-failure);
}
.lq-feedback-ok {
  border: 1px solid var(--lq-success);
  color: var(--lq-success);
}
.lq-feedback-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.lq-feedback-plain,
.lq-feedback-primary {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 12px;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
}
.lq-feedback-plain {
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
}
.lq-feedback-primary {
  border: none;
  background: var(--lq-accent);
  color: var(--lq-on-accent);
  font-weight: 600;
}
button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
