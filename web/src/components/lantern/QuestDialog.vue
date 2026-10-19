<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseQuestDetails } from '@/lantern/parseQuestDetails'
import { renderMarkup } from '@/utils/theme'
import LanternDialog from './LanternDialog.vue'

/**
 * A quest's details: what kind it is (main/side, done, how many entries),
 * then either its latest journal entry with the earlier ones folded away,
 * or its checklist with what is done and what is not yet.
 */
export interface QuestView {
  name: string
  main: boolean
  done: boolean
  /** Engine markup (dimmed earlier stages, or checklist lines). */
  description: string
}

const props = defineProps<{ quest: QuestView }>()
const emit = defineEmits<{ close: [] }>()
const showEarlier = ref(false)

const details = computed(() => parseQuestDetails(props.quest.description))
const tags = computed(() => {
  const list = [props.quest.main ? 'Main quest' : 'Side quest']
  if (props.quest.done) list.push('Done')
  const d = details.value
  if (d.kind === 'journal' && d.earlier.length)
    list.push(`${d.earlier.length + 1} entries`)
  return list
})
const checks = computed(() => {
  const d = details.value
  if (d.kind !== 'checklist') return null
  const done = d.items.filter((item) => item.done).length
  return {
    done,
    total: d.items.length,
    percent: d.items.length ? Math.round((done / d.items.length) * 100) : 0,
  }
})
</script>

<template>
  <LanternDialog :title="quest.name" eyebrow="Quest" @close="emit('close')">
    <div class="lq-tags">
      <span
        v-for="(tag, index) in tags"
        :key="tag"
        class="lq-tag"
        :class="{ 'lq-tag-accent': index === 0 && quest.main }"
        >{{ tag }}</span
      >
    </div>

    <template v-if="details.kind === 'journal'">
      <span class="lq-label">Latest</span>
      <!-- eslint-disable vue/no-v-html -->
      <p class="lq-latest lq-prose" v-html="renderMarkup(details.latest)"></p>
      <!-- eslint-enable vue/no-v-html -->
      <template v-if="details.earlier.length">
        <button
          type="button"
          class="lq-earlier-toggle"
          :aria-expanded="showEarlier ? 'true' : 'false'"
          @click="showEarlier = !showEarlier"
        >
          <span>{{
            showEarlier
              ? 'Hide earlier entries'
              : `Earlier entries (${details.earlier.length})`
          }}</span>
          <svg
            class="lq-chevron"
            :class="{ 'lq-chevron-up': showEarlier }"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <ol v-if="showEarlier" class="lq-timeline">
          <li v-for="(entry, index) in details.earlier" :key="index">
            <span class="lq-step">Entry {{ index + 1 }}</span>
            <!-- eslint-disable vue/no-v-html -->
            <p class="lq-prose lq-step-text" v-html="renderMarkup(entry)"></p>
            <!-- eslint-enable vue/no-v-html -->
          </li>
        </ol>
      </template>
    </template>

    <template v-else>
      <!-- eslint-disable vue/no-v-html -->
      <p class="lq-intro lq-prose" v-html="renderMarkup(details.intro)"></p>
      <!-- eslint-enable vue/no-v-html -->
      <div v-if="checks" class="lq-check-head">
        <span class="lq-track"
          ><span class="lq-fill" :style="{ width: `${checks.percent}%` }"></span
        ></span>
        <span class="lq-check-count"
          >{{ checks.done }} of {{ checks.total }} done</span
        >
      </div>
      <ul class="lq-checks">
        <li
          v-for="(item, index) in details.items"
          :key="index"
          class="lq-check"
          :class="{ 'lq-check-done': item.done }"
        >
          <span class="lq-check-mark" aria-hidden="true">{{
            item.done ? '✓' : '○'
          }}</span>
          <!-- eslint-disable vue/no-v-html -->
          <span class="lq-check-text" v-html="renderMarkup(item.text)"></span>
          <!-- eslint-enable vue/no-v-html -->
          <span class="lq-sr-only">{{
            item.done ? ' (done)' : ' (not yet)'
          }}</span>
        </li>
      </ul>
    </template>
  </LanternDialog>
</template>

<style scoped>
.lq-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.lq-tag {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--lq-line2);
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-tag-accent {
  border-color: var(--lq-accent-line);
  background: var(--lq-accent-soft);
  color: var(--lq-accent-text);
}
.lq-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
.lq-prose {
  margin: 4px 0 0;
  font-family: var(--lq-font-prose);
  font-size: var(--lq-story-size);
  line-height: var(--lq-story-line-height);
  color: var(--lq-prose);
}
.lq-earlier-toggle {
  margin-top: 14px;
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--lq-line2);
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-chevron {
  color: var(--lq-muted);
  transition: transform calc(0.15s * var(--lq-motion));
}
.lq-chevron-up {
  transform: rotate(180deg);
}
.lq-timeline {
  list-style: none;
  margin: 12px 0 0;
  padding: 0 0 0 14px;
  border-left: 2px solid var(--lq-line);
}
.lq-timeline li + li {
  margin-top: 12px;
}
.lq-step {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--lq-muted);
}
.lq-step-text {
  color: var(--lq-muted);
}
.lq-check-head {
  margin: 12px 0 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.lq-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--lq-line);
  overflow: hidden;
}
.lq-fill {
  display: block;
  height: 6px;
  background: var(--lq-accent);
}
.lq-check-count {
  font-size: 12px;
  color: var(--lq-muted);
}
.lq-checks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.lq-check {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 15px;
  color: var(--lq-muted);
}
.lq-check-done {
  color: var(--lq-fg);
}
.lq-check-mark {
  flex: 0 0 auto;
  width: 1.2em;
  color: var(--lq-muted);
}
.lq-check-done .lq-check-mark {
  color: var(--lq-success);
}
.lq-check-text {
  flex: 1;
}
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
