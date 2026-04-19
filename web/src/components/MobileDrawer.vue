<script setup lang="ts">
import type { NamedItem } from '@/types/bridge'

defineProps<{
  visible: boolean
  activeQuests: NamedItem[]
  inventory: NamedItem[]
  spells: NamedItem[]
}>()

defineEmits<{
  close: []
  inventoryClick: [event: MouseEvent, name: string]
  spellClick: [event: MouseEvent, name: string]
}>()
</script>

<template>
  <div v-if="visible">
    <div
      class="fixed inset-0 z-[120] bg-bg-overlay"
      @click="$emit('close')"
    ></div>
    <div
      class="fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] z-[130] bg-bg-sidebar border-l border-border overflow-y-auto p-3 transition-transform duration-300 ease-in-out"
    >
      <div
        class="flex items-center justify-between pb-3 border-b border-border mb-3"
      >
        <span class="font-bold text-base">Menu</span>
        <button
          class="bg-transparent border-none text-text-primary text-2xl cursor-pointer p-1 min-w-11 min-h-11 flex items-center justify-center"
          aria-label="Close menu"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Active Quests -->
      <div class="mb-4">
        <div class="text-xs uppercase tracking-widest text-text-secondary mb-2">
          📜 Active Quests
        </div>
        <div
          v-if="activeQuests.length === 0"
          class="text-sm text-text-secondary italic px-2.5"
        >
          No active quests
        </div>
        <div
          v-for="quest in activeQuests"
          :key="quest.name"
          class="px-2.5 py-2 rounded-md mb-1 transition-colors hover:bg-chip-hover"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="font-semibold text-[0.9rem]" v-html="quest.name"></div>
          <div class="text-[0.8rem] text-text-secondary mt-0.5">
            {{ quest.description }}
          </div>
        </div>
      </div>

      <!-- Inventory -->
      <div class="mb-4">
        <div class="text-xs uppercase tracking-widest text-text-secondary mb-2">
          🎒 Inventory
        </div>
        <div
          v-if="inventory.length === 0"
          class="text-sm text-text-secondary italic px-2.5"
        >
          Inventory is empty
        </div>
        <div
          v-for="item in inventory"
          :key="item.name"
          class="px-2.5 py-2 rounded-md mb-1 transition-colors cursor-pointer hover:bg-chip-hover"
          @click="$emit('inventoryClick', $event, item.name)"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="font-semibold text-[0.9rem]" v-html="item.name"></div>
          <div class="text-[0.8rem] text-text-secondary mt-0.5">
            {{ item.description }}
          </div>
        </div>
      </div>

      <!-- Spells -->
      <div class="mb-4">
        <div class="text-xs uppercase tracking-widest text-text-secondary mb-2">
          ✨ Spells
        </div>
        <div
          v-if="spells.length === 0"
          class="text-sm text-text-secondary italic px-2.5"
        >
          No spells known
        </div>
        <div
          v-for="spell in spells"
          :key="spell.name"
          class="px-2.5 py-2 rounded-md mb-1 transition-colors cursor-pointer hover:bg-chip-hover"
          @click="$emit('spellClick', $event, spell.name)"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="font-semibold text-[0.9rem]" v-html="spell.name"></div>
          <div class="text-[0.8rem] text-text-secondary mt-0.5">
            {{ spell.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
