<script setup lang="ts">
import { ref } from 'vue'
import type { NamedItem } from '@/types/bridge'

const expandedQuests = ref<Set<string>>(new Set())

function toggleQuest(name: string) {
  if (expandedQuests.value.has(name)) {
    expandedQuests.value.delete(name)
  } else {
    expandedQuests.value.add(name)
  }
  // Trigger reactivity for Sets
  expandedQuests.value = new Set(expandedQuests.value)
}

defineProps<{
  activeQuests: NamedItem[]
  completedQuests: NamedItem[]
  inventory: NamedItem[]
  spells: NamedItem[]
  showActiveQuests: boolean
  showCompletedQuests: boolean
  showInventory: boolean
  showSpells: boolean
}>()

defineEmits<{
  toggleSection: [section: string]
  inventoryClick: [event: MouseEvent, name: string]
  spellClick: [event: MouseEvent, name: string]
}>()
</script>

<template>
  <div
    data-testid="side-panel"
    class="w-80 bg-bg-sidebar border-l border-border overflow-y-auto shrink-0 p-3 max-md:hidden"
  >
    <!-- Active Quests -->
    <div class="mb-4">
      <div
        class="text-xs uppercase tracking-widest text-text-secondary mb-2 flex items-center justify-between cursor-pointer"
        @click="$emit('toggleSection', 'activeQuests')"
      >
        📜 Active Quests
        <span
          class="transition-transform duration-200"
          :class="{ '-rotate-90': !showActiveQuests }"
          >▼</span
        >
      </div>
      <div v-if="showActiveQuests">
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
          <div
            class="font-semibold text-[0.9rem] cursor-pointer select-none flex items-center justify-between"
            @click="toggleQuest(quest.name)"
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="quest.name"></span>
            <span
              class="text-xs transition-transform duration-200 ml-1 shrink-0"
              :class="{ '-rotate-90': !expandedQuests.has(quest.name) }"
              >▼</span
            >
          </div>
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="expandedQuests.has(quest.name)"
            class="text-[0.8rem] text-text-secondary mt-0.5"
            v-html="quest.description"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </div>
    </div>

    <!-- Completed Quests -->
    <div class="mb-4">
      <div
        class="text-xs uppercase tracking-widest text-text-secondary mb-2 flex items-center justify-between cursor-pointer"
        @click="$emit('toggleSection', 'completedQuests')"
      >
        🏆 Completed Quests
        <span
          class="transition-transform duration-200"
          :class="{ '-rotate-90': !showCompletedQuests }"
          >▼</span
        >
      </div>
      <div v-if="showCompletedQuests">
        <div
          v-if="completedQuests.length === 0"
          class="text-sm text-text-secondary italic px-2.5"
        >
          No completed quests
        </div>
        <div
          v-for="quest in completedQuests"
          :key="quest.name"
          class="px-2.5 py-2 rounded-md mb-1 transition-colors hover:bg-chip-hover"
        >
          <div
            class="font-semibold text-[0.9rem] cursor-pointer select-none flex items-center justify-between"
            @click="toggleQuest(quest.name)"
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="quest.name"></span>
            <span
              class="text-xs transition-transform duration-200 ml-1 shrink-0"
              :class="{ '-rotate-90': !expandedQuests.has(quest.name) }"
              >▼</span
            >
          </div>
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="expandedQuests.has(quest.name)"
            class="text-[0.8rem] text-text-secondary mt-0.5"
            v-html="quest.description"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </div>
    </div>

    <!-- Inventory -->
    <div class="mb-4">
      <div
        class="text-xs uppercase tracking-widest text-text-secondary mb-2 flex items-center justify-between cursor-pointer"
        @click="$emit('toggleSection', 'inventory')"
      >
        🎒 Inventory
        <span
          class="transition-transform duration-200"
          :class="{ '-rotate-90': !showInventory }"
          >▼</span
        >
      </div>
      <div v-if="showInventory">
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
          <!-- eslint-disable vue/no-v-html -->
          <div class="font-semibold text-[0.9rem]" v-html="item.name"></div>
          <div
            class="text-[0.8rem] text-text-secondary mt-0.5"
            v-html="item.description"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </div>
    </div>

    <!-- Spells -->
    <div class="mb-4">
      <div
        class="text-xs uppercase tracking-widest text-text-secondary mb-2 flex items-center justify-between cursor-pointer"
        @click="$emit('toggleSection', 'spells')"
      >
        ✨ Spells
        <span
          class="transition-transform duration-200"
          :class="{ '-rotate-90': !showSpells }"
          >▼</span
        >
      </div>
      <div v-if="showSpells">
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
          <!-- eslint-disable vue/no-v-html -->
          <div class="font-semibold text-[0.9rem]" v-html="spell.name"></div>
          <div
            class="text-[0.8rem] text-text-secondary mt-0.5"
            v-html="spell.description"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </div>
    </div>
  </div>
</template>
