<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useFullscreen } from '@/composables/useFullscreen'
import type { LanternTextSize } from '@/lantern/tokens'

/**
 * `compact` (phones): one row with the room name and "Act I · Quests 4/11"
 * (that line is left out on short screens) instead of the title, act and
 * progress bar; the title stays as a hidden top-level heading. The
 * full-screen button (where supported) is left out under 360px wide.
 */
defineProps<{ compact?: boolean }>()
const emit = defineEmits<{
  menu: []
  open: [kind: 'save' | 'load' | 'stats' | 'settings' | 'help']
}>()
const game = useGameStore()
const settings = useSettingsStore()
const fullscreen = useFullscreen()

const ROMAN = ['I', 'II', 'III', 'IV', 'V']

const progress = computed(() => game.questProgress)
const actLabel = computed(() =>
  progress.value
    ? `Act ${ROMAN[progress.value.actNumber - 1] ?? progress.value.actNumber}`
    : '',
)
const progressPercent = computed(() =>
  progress.value && progress.value.total > 0
    ? Math.round((progress.value.completed / progress.value.total) * 100)
    : 0,
)

// --- Text size popover: Escape or a click outside closes it ---
const textSizeOpen = ref(false)
const textSizeAnchor = ref<HTMLElement | null>(null)
const textSizeButton = ref<HTMLButtonElement | null>(null)
function onDocumentKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || !textSizeOpen.value) return
  // Consumed here: the story's narration must not also take this Escape.
  e.preventDefault()
  textSizeOpen.value = false
  textSizeButton.value?.focus()
}
function onDocumentClick(e: MouseEvent): void {
  if (!textSizeAnchor.value?.contains(e.target as Node)) {
    textSizeOpen.value = false
  }
}
const SIZES: Array<{ value: LanternTextSize; label: string; px: number }> = [
  { value: 'small', label: 'Small text', px: 13 },
  { value: 'medium', label: 'Medium text', px: 17 },
  { value: 'large', label: 'Large text', px: 21 },
]

// --- Theme toggle: device preference until the player picks one ---
const deviceLight = ref(false)
let mediaQuery: MediaQueryList | null = null
function onDeviceThemeChange(): void {
  deviceLight.value = mediaQuery?.matches ?? false
}
onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown)
  document.addEventListener('click', onDocumentClick)
  if (typeof window.matchMedia !== 'function') return
  mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
  mediaQuery.addEventListener('change', onDeviceThemeChange)
  onDeviceThemeChange()
})
onUnmounted(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
  document.removeEventListener('click', onDocumentClick)
  mediaQuery?.removeEventListener('change', onDeviceThemeChange)
})

const effectiveTheme = computed(() =>
  settings.theme === 'device'
    ? deviceLight.value
      ? 'light'
      : 'dark'
    : settings.theme,
)
const nextTheme = computed(() =>
  effectiveTheme.value === 'dark' ? 'light' : 'dark',
)
function toggleTheme(): void {
  settings.theme = nextTheme.value
}
</script>

<template>
  <header class="lq-header" :class="{ 'lq-header-compact': compact }">
    <button
      v-if="compact"
      type="button"
      class="lq-icon-btn"
      aria-label="Game menu"
      @click="emit('menu')"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
    <div v-if="compact" class="lq-compact">
      <h1 class="lq-sr-only">RetroQuest</h1>
      <span class="lq-compact-room">{{ game.roomName }}</span>
      <span v-if="progress" class="lq-compact-sub"
        >{{ actLabel }} · Quests {{ progress.completed }}/{{
          progress.total
        }}</span
      >
    </div>
    <div v-else class="lq-title">
      <h1 class="lq-logo">RetroQuest</h1>
      <span v-if="progress" class="lq-act" data-testid="act">{{
        actLabel
      }}</span>
    </div>

    <div
      v-if="progress && !compact"
      class="lq-progress"
      data-testid="quest-progress"
    >
      <span class="lq-progress-label">Quests</span>
      <span
        class="lq-progress-track"
        role="progressbar"
        aria-label="Quests completed"
        :aria-valuenow="progress.completed"
        aria-valuemin="0"
        :aria-valuemax="progress.total"
      >
        <span
          class="lq-progress-fill"
          :style="{ width: `${progressPercent}%` }"
        />
      </span>
      <span>{{ progress.completed }}/{{ progress.total }}</span>
    </div>

    <!-- Phone landscape puts the section tabs here. -->
    <slot name="nav" />

    <nav v-if="!compact" class="lq-game-nav" aria-label="Game">
      <button type="button" class="lq-text-btn" @click="emit('open', 'save')">
        Save
      </button>
      <button type="button" class="lq-text-btn" @click="emit('open', 'load')">
        Load
      </button>
      <button type="button" class="lq-text-btn" @click="emit('open', 'stats')">
        Stats
      </button>
      <button
        type="button"
        class="lq-text-btn"
        @click="emit('open', 'settings')"
      >
        Settings
      </button>
      <button type="button" class="lq-text-btn" @click="emit('open', 'help')">
        Help
      </button>
    </nav>

    <div class="lq-actions">
      <button
        v-if="fullscreen.supported"
        type="button"
        class="lq-icon-btn lq-fullscreen-btn"
        :aria-label="
          fullscreen.active.value ? 'Exit full screen' : 'Full screen'
        "
        @click="fullscreen.toggle"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            v-if="fullscreen.active.value"
            d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
          />
          <path v-else d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
      </button>
      <div ref="textSizeAnchor" class="lq-popover-anchor">
        <button
          ref="textSizeButton"
          type="button"
          class="lq-icon-btn"
          aria-label="Text size"
          :aria-expanded="textSizeOpen ? 'true' : 'false'"
          @click="textSizeOpen = !textSizeOpen"
        >
          <span class="lq-aa">Aa</span>
        </button>
        <div
          v-if="textSizeOpen"
          class="lq-popover"
          role="group"
          aria-label="Text size"
        >
          <button
            v-for="size in SIZES"
            :key="size.value"
            type="button"
            class="lq-size"
            :class="{ 'lq-size-on': settings.textSize === size.value }"
            :aria-label="size.label"
            :aria-pressed="settings.textSize === size.value ? 'true' : 'false'"
            :style="{ fontSize: `${size.px}px` }"
            @click="settings.textSize = size.value"
          >
            A
          </button>
        </div>
      </div>

      <button
        type="button"
        class="lq-icon-btn"
        :aria-label="`Switch to ${nextTheme} theme`"
        @click="toggleTheme"
      >
        <svg
          v-if="effectiveTheme === 'dark'"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        </svg>
        <svg
          v-else
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.lq-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(16px * var(--lq-density));
  padding: 8px 16px;
  border-bottom: 1px solid var(--lq-line);
  background: var(--lq-bg);
  color: var(--lq-fg);
  font-family: var(--lq-font-ui);
}
.lq-header-compact {
  flex-wrap: nowrap;
  gap: 8px;
  padding: 8px 10px;
}
.lq-compact {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lq-compact-room,
.lq-compact-sub {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lq-compact-room {
  font-family: var(--lq-font-display);
  font-size: calc(19px * var(--lq-display-scale));
  font-weight: 500;
  color: var(--lq-fg);
}
.lq-compact-sub {
  font-size: 12px;
  color: var(--lq-muted);
}
/* Phone landscape: the room name alone. */
@media (max-height: 519px) {
  .lq-compact-room {
    font-size: calc(17px * var(--lq-display-scale));
  }
  .lq-compact-sub {
    display: none;
  }
}
.lq-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.lq-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
}
.lq-logo {
  margin: 0;
  line-height: 1.2;
  font-family: var(--lq-font-display);
  font-size: calc(22px * var(--lq-display-scale));
  font-weight: 600;
}
.lq-act,
.lq-progress {
  font-size: 13px;
  color: var(--lq-muted);
}
.lq-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}
.lq-progress-track {
  display: inline-block;
  width: 96px;
  height: 6px;
  border-radius: 3px;
  background: var(--lq-line);
  overflow: hidden;
}
.lq-progress-fill {
  display: block;
  height: 6px;
  background: var(--lq-accent);
}
.lq-game-nav {
  display: flex;
  gap: 4px;
}
.lq-text-btn {
  height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--lq-fg);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
.lq-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.lq-icon-btn {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line);
  background: var(--lq-surface);
  color: var(--lq-fg);
  cursor: pointer;
}
.lq-aa {
  font-family: var(--lq-font-display);
  font-size: 17px;
}
.lq-popover-anchor {
  position: relative;
}
.lq-popover {
  position: absolute;
  top: 52px;
  right: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  width: 200px;
  padding: 8px;
  border-radius: var(--lq-radius);
  border: 1px solid var(--lq-line2);
  background: var(--lq-surface);
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.3);
}
.lq-size {
  height: 44px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--lq-fg);
  font-family: var(--lq-font-display);
  cursor: pointer;
}
.lq-size-on {
  background: var(--lq-accent);
  color: var(--lq-on-accent);
}
/* The narrowest phones need the room for the room name. */
@media (max-width: 359px) {
  .lq-fullscreen-btn {
    display: none;
  }
}
</style>
