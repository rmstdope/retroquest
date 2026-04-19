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
  <div class="main-content">
    <!-- Room Card -->
    <div class="room-card">
      <div class="room-name">{{ roomName }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="room-description" v-html="roomDescription"></div>

      <!-- Characters -->
      <div v-if="characters.length > 0" class="entity-section">
        <div class="entity-label">Characters</div>
        <div class="chip-row">
          <button
            v-for="char in characters"
            :key="char"
            class="chip chip-character"
            @click="$emit('entityClick', $event, char, 'character')"
          >
            👤 {{ char }}
          </button>
        </div>
      </div>

      <!-- Items -->
      <div v-if="items.length > 0" class="entity-section">
        <div class="entity-label">Items</div>
        <div class="chip-row">
          <button
            v-for="item in items"
            :key="item"
            class="chip chip-item"
            @click="$emit('entityClick', $event, item, 'item')"
          >
            📦 {{ item }}
          </button>
        </div>
      </div>

      <!-- Exits -->
      <div v-if="Object.keys(exits).length > 0" class="entity-section">
        <div class="entity-label">Exits</div>
        <div class="chip-row">
          <button
            v-for="[dir, dest] in Object.entries(exits)"
            :key="dir"
            class="chip chip-exit"
            @click="$emit('goDirection', dir)"
          >
            {{ getArrow(dir) }} {{ dir }}
            <span style="opacity: 0.6; font-size: 0.8em">({{ dest }})</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Result Area -->
    <div class="result-area">
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="lastOutput || introText"
        class="result-content"
        v-html="lastOutput || introText"
      ></div>
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </div>
</template>
