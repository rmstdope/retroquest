<script setup lang="ts">
defineProps<{
  roomName: string
  roomDescription: string
  characters: string[]
  items: string[]
  exits: Record<string, string>
  lastOutput: string
  introText: string
}>()

defineEmits<{
  entityClick: [event: MouseEvent, name: string, type: string]
  goDirection: [direction: string]
}>()

function getArrow(direction: string): string {
  const arrows: Record<string, string> = {
    north: '↑',
    south: '↓',
    east: '→',
    west: '←',
    up: '⬆',
    down: '⬇',
  }
  return arrows[direction.toLowerCase()] ?? '•'
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden min-w-0">
    <!-- Room Card -->
    <div
      class="bg-bg-card border border-border rounded-lg m-3 p-4 shrink-0 max-md:m-2 max-md:p-3"
    >
      <div class="text-[1.3rem] font-bold text-room mb-2">{{ roomName }}</div>
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="text-text-primary leading-relaxed mb-3"
        v-html="roomDescription"
      ></div>
      <!-- eslint-enable vue/no-v-html -->

      <!-- Characters -->
      <div v-if="characters.length > 0" class="mt-2">
        <div class="text-xs uppercase tracking-widest text-text-secondary mb-1">
          Characters
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="char in characters"
            :key="char"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-chip-bg border border-character text-character cursor-pointer text-sm transition-all select-none hover:bg-chip-hover hover:-translate-y-px active:translate-y-0 max-md:min-h-11 max-md:min-w-11 max-md:px-3.5 max-md:py-2"
            @click="$emit('entityClick', $event, char, 'character')"
          >
            👤 {{ char }}
          </button>
        </div>
      </div>

      <!-- Items -->
      <div v-if="items.length > 0" class="mt-2">
        <div class="text-xs uppercase tracking-widest text-text-secondary mb-1">
          Items
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="item in items"
            :key="item"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-chip-bg border border-item text-item cursor-pointer text-sm transition-all select-none hover:bg-chip-hover hover:-translate-y-px active:translate-y-0 max-md:min-h-11 max-md:min-w-11 max-md:px-3.5 max-md:py-2"
            @click="$emit('entityClick', $event, item, 'item')"
          >
            📦 {{ item }}
          </button>
        </div>
      </div>

      <!-- Exits -->
      <div v-if="Object.keys(exits).length > 0" class="mt-2">
        <div class="text-xs uppercase tracking-widest text-text-secondary mb-1">
          Exits
        </div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="[dir, dest] in Object.entries(exits)"
            :key="dir"
            class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-chip-bg border border-exits text-exits cursor-pointer text-sm transition-all select-none hover:bg-chip-hover hover:-translate-y-px active:translate-y-0 max-md:min-h-11 max-md:min-w-11 max-md:px-3.5 max-md:py-2"
            @click="$emit('goDirection', dir)"
          >
            {{ getArrow(dir) }} {{ dir }}
            <span class="opacity-60 text-[0.8em]">({{ dest }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Result Area -->
    <div class="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="lastOutput || introText"
        class="bg-bg-card border border-border rounded-lg p-4 leading-relaxed min-h-[60px]"
        v-html="lastOutput || introText"
      ></div>
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </div>
</template>
