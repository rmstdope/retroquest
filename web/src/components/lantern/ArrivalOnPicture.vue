<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArrivalStore } from '@/stores/useArrivalStore'
import { useReadAlong } from '@/composables/useReadAlong'
import { questTextHtml } from '@/lantern/questTextHtml'
import { FOLLOW_EVENT } from '@/composables/useStoryFollow'
import {
  pageLines,
  paginate,
  type ArrivalPage,
  type ArrivalPiece,
  type PageLine,
} from '@/lantern/arrivalPages'
import { newsSlimHeading } from '@/lantern/stageArrival'
import { SPELL_HEADING } from '@/lantern/spellNews'
import { renderMarkup } from '@/utils/theme'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * The arrival told on the middle of the room's picture, like a film title:
 * light serif text with a soft dark glow, no paper, at most 760 px wide. First
 * what happens as the player arrives (in italics), then the room's
 * description, the spoken word lit while the narrator tells it. Under it a
 * small dark pill holds the hint and, while nobody speaks the part, a thin bar
 * that empties over its reading time. A click anywhere on the picture goes on
 * (`useArrivalStore`).
 * Names and other inline tags keep the dark theme's light colours on the
 * picture. With no picture (`pictured` false) the text is dark ink on the
 * paper in the light theme. The text is also in the story, which waits aside:
 * the layer is a polite live region for screen readers.
 *
 * A part taller than the clear space (below the top buttons or the phone's
 * plate, above the story tab and the actions) is cut into pages that each
 * fit, in the type it is shown in (`arrivalPages`): the view measures the
 * pieces in a hidden twin of the text box, shows the page up
 * (`useArrivalStore.page`) and reports where each page starts to the store,
 * which turns them. The cut is made afresh when the part or the stage's size
 * changes. A phone (`phone`) is paged the same way, at its narrower card
 * and smaller type, so a tap never moves on past lines still hidden. Only a
 * single sentence too tall for any page scrolls inside its own box
 * (`.lq-arrival-text`) above the pill, which never leaves the bottom of the
 * space. A scrolling box fades out at an edge where the text continues, and,
 * while the narrator speaks, glides to keep the lit word in view (the
 * `lq-follow` event of the read-along); with reduced motion it jumps.
 *
 * A phone held sideways (`sideways`) tells the card in the free height between
 * the top buttons and the bottom row, in smaller type on the smallest phones,
 * with the seal small and beside the heading, and says "Tap to continue".
 *
 * News (`news` parts: a learned spell, quest news) is told the same way: a round seal (a violet ✦ for a spell, a tick for a completion),
 * the heading, the quest's or spell's name in large type and then its text, which is the
 * part that is paged or scrolls; the head above it stays on every page.
 */
const props = defineProps<{
  pictured: boolean
  phone?: boolean
  /** A phone held sideways: the card uses the free height between the top and bottom rows, takes smaller type on the smallest phones and keeps the seal beside the heading. */
  sideways?: boolean
  /** The words are folded away (to show the names on the picture): out of sight and reach, still being read and clicked on in no way, and back when it is false. */
  away?: boolean
  /** The height the belt of pictures takes at the foot (px): the words end above it (the stage's `--lq-belt-h`). */
  lift?: number
}>()
const arrival = useArrivalStore()
const root = ref<HTMLElement | null>(null)
const { html, mark } = useReadAlong(() => arrival.turnId ?? 0, root)

/** The twin of the text box the pieces are measured in. */
const twin = ref<HTMLElement | null>(null)
/** The pill under the text. */
const pill = ref<HTMLElement | null>(null)
/** The head of a piece of quest news (seal, heading, name), above the text. */
const head = ref<HTMLElement | null>(null)
/** The quest news of the part up, or null. */
const news = computed(() => arrival.part?.news ?? null)
/** The learned spell the part up tells, or null. */
const spell = computed(() => arrival.part?.spell ?? null)
/** The piece of news up (a spell or a quest): its heading and name, or null. */
const piece = computed(() => {
  if (spell.value)
    return { heading: SPELL_HEADING, name: spell.value.name, spell: true }
  if (news.value)
    return {
      heading: newsSlimHeading(news.value),
      name: news.value.name,
      spell: false,
    }
  return null
})
/** The count after a completion's heading: shown, not read aloud. */
const newsCount = computed(() => {
  const progress = news.value?.progress
  return progress ? ` · ${progress.completed} of ${progress.total}` : ''
})
/** The pages of the part up; empty until it is cut. */
const pages = ref<ArrivalPage[]>([])
/** The width (px) of the widest checklist anywhere in the part up, so every page's list keeps one left edge; 0 when it has none. */
const checklistWidth = ref(0)
/** The gap between the text and the pill (px), as in the card's rule. */
const CARD_GAP = 14

/** What the page up shows: its lines, or all of the part's before it is cut. */
const shown = computed((): PageLine[] => {
  const page = pages.value[arrival.page]
  if (page) return pageLines(page)
  return (arrival.part?.lines ?? []).map((line) => ({
    unit: line.unit,
    markup: line.markup,
    wordStart: 0,
  }))
})
/** The height the text may have: the stage inside its padding, less the pill and the gap. */
function room(): number {
  const stage = root.value
  if (!stage) return 0
  const style = getComputedStyle(stage)
  const padding =
    (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0)
  const gaps = head.value ? 2 * CARD_GAP : CARD_GAP
  return (
    stage.clientHeight -
    padding -
    (pill.value?.offsetHeight ?? 0) -
    (head.value?.offsetHeight ?? 0) -
    gaps
  )
}

/** Cut the part up into pages that fit. */
function recut(): void {
  const part = arrival.part
  const measure = twin.value
  if (!part || !measure) {
    pages.value = []
    return
  }
  const available = room()
  const html = (lines: PageLine[]): string =>
    lines
      .map((line) =>
        part.kind === 'news'
          ? `<div class="lq-arrival-line">${questTextHtml(line.markup)}</div>`
          : `<p class="lq-arrival-line${part.kind === 'events' ? ' lq-arrival-event' : ''}">` +
            `${renderMarkup(line.markup)}</p>`,
      )
      .join('')
  // The whole part at once, each list as wide as its own lines make it.
  measure.style.setProperty('--lq-checklist-width', '0px')
  measure.innerHTML = html(
    part.lines.map((line) => ({
      unit: line.unit,
      markup: line.markup,
      wordStart: 0,
    })),
  )
  checklistWidth.value = Math.max(
    0,
    ...Array.from(
      measure.querySelectorAll<HTMLElement>('.lq-quest-checklist'),
    ).map((list) => list.offsetWidth),
  )
  // The pages are measured with the width they will be drawn with.
  measure.style.setProperty('--lq-checklist-width', `${checklistWidth.value}px`)
  const fits = (pieces: ArrivalPiece[]): boolean => {
    measure.innerHTML = html(
      pageLines({ pieces, firstUnit: 0, firstWord: 0, scrolls: false }),
    )
    return measure.offsetHeight <= available
  }
  const cut = paginate(part.lines, fits)
  measure.style.removeProperty('--lq-checklist-width')
  measure.innerHTML = ''
  pages.value = cut
  const base = (unit: number): number =>
    part.lines.find((line) => line.unit === unit)?.wordBase ?? 0
  arrival.setPages(
    cut.map((page) => ({
      unit: page.firstUnit,
      word: base(page.firstUnit) + page.firstWord,
      text: pageLines(page)
        .map((line) => line.markup)
        .join(' '),
    })),
  )
}
// Larger or smaller type changes the lines, not the stage: cut afresh.
watch(
  () => useSettingsStore().textSize,
  async () => {
    await nextTick()
    recut()
  },
)
// The belt came up, went away or changed height: the room for the words changed with it.
watch(
  () => props.lift,
  async () => {
    await nextTick()
    recut()
  },
)
let stageObserver: ResizeObserver | undefined
onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || !root.value) return
  stageObserver = new ResizeObserver(() => requestAnimationFrame(recut))
  stageObserver.observe(root.value)
})
// Cut each part afresh, once its card is drawn.
watch(
  () => [
    arrival.turnId,
    arrival.part?.kind,
    arrival.part?.lines[0]?.unit,
    props.phone,
    props.sideways,
  ],
  async () => {
    pages.value = []
    await nextTick()
    recut()
  },
)

/** The text box of the part up; it is a new element for every part. */
const text = ref<HTMLElement | null>(null)
const fadeTop = ref(false)
const fadeBottom = ref(false)
/** The lit word is kept in the top two thirds of the box, and put a third down when it leaves. */
const BAND_END = 2 / 3
const PLACE_AT = 1 / 3
let observer: ResizeObserver | undefined

/** Whether the text continues above and below what shows. */
function measure(): void {
  const el = text.value
  fadeTop.value = !!el && el.scrollTop > 1
  fadeBottom.value =
    !!el && el.scrollTop + el.clientHeight < el.scrollHeight - 1
}

/** Whether the game's "less motion" setting (or the system's) is on. */
function motionReduced(): boolean {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--lq-motion')
      .trim() === '0'
  )
}

/** Keep the lit word in view; the event is taken so nothing else scrolls for it. */
function follow(event: Event): void {
  const el = text.value
  const word = event.target
  if (!el || !(word instanceof Element)) return
  event.preventDefault()
  const box = el.getBoundingClientRect()
  const at = word.getBoundingClientRect()
  const top = at.top - box.top
  if (top >= 0 && at.bottom - box.top <= box.height * BAND_END) return
  el.scrollTo({
    top: el.scrollTop + top - el.clientHeight * PLACE_AT,
    behavior: motionReduced() ? 'auto' : 'smooth',
  })
}

/** Measure the box afresh, and watch it and its lines for a change of size. */
async function watchBox(el: HTMLElement | null): Promise<void> {
  observer?.disconnect()
  await nextTick()
  measure()
  if (el && typeof ResizeObserver !== 'undefined') {
    observer ??= new ResizeObserver(() => requestAnimationFrame(measure))
    observer.observe(el)
    el.querySelectorAll('.lq-arrival-line').forEach((line) =>
      observer?.observe(line),
    )
  }
}

watch(text, watchBox)
// A new arrival whose first part is of the same kind reuses the box: start it
// at its first line.
watch(
  () => [arrival.turnId, arrival.part?.kind, arrival.part?.lines[0]?.unit],
  () => {
    if (text.value) text.value.scrollTop = 0
    void watchBox(text.value)
  },
)
onBeforeUnmount(() => {
  observer?.disconnect()
  stageObserver?.disconnect()
})
</script>

<template>
  <div
    ref="root"
    class="lq-arrival-stage"
    :style="{ '--lq-checklist-width': `${checklistWidth}px` }"
    :class="{
      'lq-bare': !pictured,
      'lq-on': arrival.active,
      'lq-phone-arrival': phone,
      'lq-sideways-arrival': sideways,
      'lq-arrival-away': away,
    }"
    aria-live="polite"
    data-testid="arrival-on-picture"
    @click="arrival.next()"
  >
    <div class="lq-arrival-measure" aria-hidden="true">
      <div ref="twin" class="lq-arrival-twin"></div>
    </div>
    <Transition name="lq-arrival-fade">
      <div
        v-if="arrival.part"
        :key="`${arrival.part.kind}-${arrival.part.lines[0]?.unit}`"
        class="lq-arrival-card"
      >
        <div v-if="piece" ref="head" class="lq-news-head">
          <div class="lq-news-top">
            <span
              v-if="spell"
              class="lq-news-seal lq-news-spark"
              aria-hidden="true"
              data-testid="spell-seal"
              >✦</span
            >
            <span
              v-else-if="news?.kind === 'completed'"
              class="lq-news-seal"
              aria-hidden="true"
              data-testid="news-seal"
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <!-- eslint-disable vue/no-v-html -->
            <p
              class="lq-news-kicker"
              :class="{ 'lq-news-kicker-spell': spell }"
            >
              <span
                v-html="html(piece.heading, arrival.part.lines[0].unit, 0, 1)"
              ></span
              >{{ newsCount }}
            </p>
          </div>
          <p
            class="lq-news-name"
            v-html="html(piece.name, arrival.part.lines[0].unit, 1, 2)"
          ></p>
          <!-- eslint-enable vue/no-v-html -->
        </div>
        <!-- eslint-disable vue/no-v-html -->
        <div
          ref="text"
          class="lq-arrival-text"
          :class="{ 'lq-fade-t': fadeTop, 'lq-fade-b': fadeBottom }"
          @scroll="measure"
          v-on="{ [FOLLOW_EVENT]: follow }"
        >
          <template v-if="arrival.part.kind === 'events'">
            <p
              v-for="line in shown"
              :key="`${line.unit}-${line.wordStart}`"
              class="lq-arrival-line lq-arrival-event"
              :data-unit="line.unit"
              v-html="
                html(line.markup, line.unit, 0, undefined, line.wordStart)
              "
            ></p>
          </template>
          <template v-else-if="piece">
            <div
              v-for="line in shown"
              :key="`${line.unit}-${line.wordStart}`"
              class="lq-arrival-line"
              :data-unit="line.unit"
              v-html="
                mark(
                  questTextHtml(line.markup),
                  line.unit,
                  2,
                  undefined,
                  line.wordStart,
                )
              "
            ></div>
          </template>
          <template v-else>
            <p
              v-for="line in shown"
              :key="`${line.unit}-${line.wordStart}`"
              class="lq-arrival-line"
              :data-unit="line.unit"
              v-html="
                html(line.markup, line.unit, 1, undefined, line.wordStart)
              "
            ></p>
          </template>
        </div>
        <!-- eslint-enable vue/no-v-html -->
        <div ref="pill" class="lq-arrival-pill">
          <p class="lq-arrival-hint">
            {{
              phone || sideways
                ? 'Tap to continue'
                : 'Click or press Enter to continue'
            }}
          </p>
          <div
            v-if="arrival.barMs"
            :key="arrival.barKey"
            class="lq-arrival-bar"
            data-testid="arrival-bar"
          >
            <i :style="{ animationDuration: `${arrival.barMs}ms` }"></i>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lq-arrival-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Above the middle of the picture, clear of the story's tab and the actions. */
  padding: 72px 24px calc(140px + var(--lq-belt-h, 0px));
  pointer-events: none;
  --lq-arrival-ink: #fbf6ea;
  --lq-arrival-glow:
    0 0 18px rgb(0 0 0 / 0.85), 0 0 6px rgb(0 0 0 / 0.9), 0 1px 2px #000;
}
/*
 * On a picture the glow is dark in both themes, so the inline tags (names,
 * exits, quests) keep the dark theme's light colours, as tokens.ts sets them.
 */
.lq-arrival-stage:not(.lq-bare) {
  --lq-fg: #ece6d6;
  --lq-muted: #a39d8e;
  --lq-accent-text: #ffb836;
  --lq-failure: #e8896b;
  --lq-success: #8fcf7a;
  --lq-character: #7fb0e6;
  --lq-item: #8fcf7a;
  --lq-spell: #c79bf0;
}
/* The phone: a narrower block of smaller type, above the paper's tab and the bar. */
.lq-phone-arrival {
  /* Clear of the plate across the top, and of the bar and the paper's tab. */
  padding: calc(var(--lq-plate-h, 108px) + 24px) 20px
    calc(110px + var(--lq-belt-h, 0px));
}
.lq-phone-arrival .lq-arrival-card,
.lq-phone-arrival .lq-arrival-twin {
  width: min(320px, 100%);
}
.lq-phone-arrival .lq-arrival-line,
.lq-phone-arrival .lq-arrival-twin :deep(.lq-arrival-line) {
  font-size: calc(17px * var(--lq-text-scale, 1));
}
/*
 * A phone held sideways: the card uses the free height between the top row of
 * buttons and the bottom row (56 px clear above, 61 px below, belt up or folded: the
 * slim belt's top lies 60 px above the foot) instead of the laptop's margins. The
 * smallest phones take smaller type, and the seal stands beside the heading,
 * small, so the words keep their room. The twin the pages are measured in has
 * the card's own side margins, so the cut is made for the width shown.
 */
.lq-sideways-arrival {
  padding: 56px 20px 61px;
}
.lq-sideways-arrival .lq-arrival-measure {
  padding: 0 20px;
}
.lq-sideways-arrival .lq-news-seal {
  width: 22px;
  height: 22px;
}
.lq-sideways-arrival .lq-news-seal svg {
  width: 14px;
  height: 14px;
}
.lq-sideways-arrival .lq-news-spark {
  font-size: 13px;
}
@media (max-height: 340px) {
  .lq-sideways-arrival .lq-arrival-line,
  .lq-sideways-arrival .lq-arrival-twin :deep(.lq-arrival-line) {
    font-size: calc(17px * var(--lq-text-scale, 1));
  }
  .lq-sideways-arrival .lq-news-name {
    font-size: calc(30px * var(--lq-display-scale, 1));
  }
}
.lq-arrival-stage.lq-on {
  pointer-events: auto;
  cursor: pointer;
}
/* No picture: ink on the paper in the light theme, the light text in the dark. */
.lq-arrival-stage.lq-bare {
  --lq-arrival-ink: var(--lq-arrival-bare-ink);
  --lq-arrival-glow: var(--lq-arrival-bare-glow);
}
.lq-arrival-away {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity calc(0.2s * var(--lq-motion)) ease,
    visibility 0s linear calc(0.2s * var(--lq-motion));
}
.lq-arrival-card {
  width: min(760px, 100%);
  /* No taller than the clear space; the text scrolls and the pill stays. */
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  color: var(--lq-arrival-ink);
  text-shadow: var(--lq-arrival-glow);
}
/*
 * The text scrolls here when it is too tall. The padding and the opposite
 * margin keep the glow from being clipped without moving the text; the mask
 * fades an edge where the text continues.
 */
.lq-arrival-text {
  flex: 0 1 auto;
  min-height: 0;
  align-self: stretch;
  margin: -20px -24px;
  padding: 20px 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
/*
 * Measures the pieces of a page at the card's width; never seen or heard. It
 * lives on the stage, outside the card, which is replaced as the parts change.
 */
.lq-arrival-measure {
  position: absolute;
  inset: 0;
  padding: 0 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  visibility: hidden;
  pointer-events: none;
}
.lq-arrival-twin {
  width: min(760px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
  font-size: inherit;
}
.lq-arrival-text::-webkit-scrollbar {
  display: none;
}
.lq-arrival-text.lq-fade-b {
  mask-image: linear-gradient(#000 calc(100% - 44px), transparent);
}
.lq-arrival-text.lq-fade-t {
  mask-image: linear-gradient(transparent, #000 44px);
}
.lq-arrival-text.lq-fade-t.lq-fade-b {
  mask-image: linear-gradient(
    transparent,
    #000 44px,
    #000 calc(100% - 44px),
    transparent
  );
}
.lq-arrival-line,
.lq-arrival-twin :deep(.lq-arrival-line) {
  margin: 0;
  font-family: var(--lq-font-prose);
  font-size: calc(24px * var(--lq-text-scale, 1));
  line-height: 1.5;
}
/* A checklist quest's needs are one left-aligned column, as wide as its longest
   line but at most 22em of the text's own size, centred under the paragraph;
   a phone's card is narrower, so there the column fills it. */
.lq-arrival-line :deep(.lq-quest-checklist),
.lq-arrival-twin :deep(.lq-quest-checklist) {
  width: fit-content;
  min-width: min(var(--lq-checklist-width, 0px), 100%);
  max-width: min(22em, 100%);
  margin-inline: auto;
  text-align: left;
}
/* A line holding a checklist spans the card, so the list's cap resolves against
   the card and not against a line that shrank to a short list on a later page. */
.lq-arrival-line:has(.lq-quest-checklist),
.lq-arrival-twin :deep(.lq-arrival-line:has(.lq-quest-checklist)) {
  align-self: stretch;
}
.lq-arrival-event,
.lq-arrival-twin :deep(.lq-arrival-event) {
  font-style: italic;
}
.lq-arrival-card :deep(.lq-w-now) {
  background: rgb(242 158 0 / 0.45);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgb(242 158 0 / 0.45);
}
/* The head of a piece of quest news: the seal, the heading and the quest's name. */
.lq-news-head {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
/* The seal and the heading: part of the head's column, except on a sideways phone, where they share a row. */
.lq-news-top {
  display: contents;
}
.lq-sideways-arrival .lq-news-top {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.lq-news-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--lq-accent);
  color: #fff;
  text-shadow: none;
}
.lq-news-spark {
  background: #6b3fa0;
  font-size: 24px;
}
.lq-news-kicker {
  margin: 0;
  font-family: var(--lq-font-ui);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffd27a;
}
.lq-arrival-stage.lq-bare .lq-news-kicker {
  color: var(--lq-accent-text);
}
/* A spell's heading is violet, on the picture and on the paper (after the quest rules, which it outweighs). */
.lq-arrival-stage .lq-news-kicker.lq-news-kicker-spell {
  color: var(--lq-spell);
}
.lq-news-name {
  margin: 0;
  font-family: var(--lq-font-display);
  font-size: calc(44px * var(--lq-display-scale, 1));
  font-weight: 500;
  line-height: 1.1;
}
.lq-phone-arrival .lq-news-name {
  font-size: calc(30px * var(--lq-display-scale, 1));
}
.lq-phone-arrival .lq-news-seal {
  width: 38px;
  height: 38px;
}
/*
 * The hint and the bar sit on their own dark, see-through pill, so they read
 * over any picture and on the paper alike, in both themes.
 */
.lq-arrival-pill {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgb(20 17 12 / 0.72);
  color: #fbf6ea;
  text-shadow: none;
}
.lq-arrival-hint {
  margin: 0;
  font-family: var(--lq-font-ui);
  font-size: 13px;
  letter-spacing: 0.02em;
}
.lq-arrival-bar {
  width: 100%;
  min-width: 140px;
  height: 2px;
  border-radius: 2px;
  background: rgb(255 255 255 / 0.25);
  overflow: hidden;
  box-shadow: none;
}
/* Empties over the reading time; Reduce motion keeps it (it is the clock). */
.lq-arrival-bar i {
  display: block;
  height: 100%;
  background: rgb(255 255 255 / 0.85);
  transform-origin: left;
  animation-name: lq-arrival-empty;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes lq-arrival-empty {
  to {
    transform: scaleX(0);
  }
}
/* A quick cross-fade. The leaving card is taken out of the row (kept centred by
   the stage) so it never pushes the entering one sideways; both stay mounted
   together so the cut into pages still measures the new card's pill and head. */
.lq-arrival-fade-leave-active {
  position: absolute;
}
.lq-arrival-fade-enter-active,
.lq-arrival-fade-leave-active {
  transition: opacity calc(0.15s * var(--lq-motion));
}
.lq-arrival-fade-enter-from,
.lq-arrival-fade-leave-to {
  opacity: 0;
}
</style>
