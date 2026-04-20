<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  title: string
  body: string
}>()

const emit = defineEmits<{
  dismiss: []
}>()

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('dismiss')
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      window.addEventListener('keydown', onKeyDown)
    } else {
      window.removeEventListener('keydown', onKeyDown)
    }
  },
)

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-[200] flex items-center justify-center bg-bg-overlay"
    @click.self="$emit('dismiss')"
  >
    <div
      class="bg-bg-card border border-border rounded-xl p-6 max-w-[480px] w-[90%] shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      <div class="text-[1.1rem] font-bold text-quest mb-3">{{ title }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="leading-relaxed mb-4" v-html="body"></div>
      <button
        class="float-right px-6 py-2 rounded-md bg-accent text-white border-none cursor-pointer text-[0.9rem] hover:opacity-85"
        @click="$emit('dismiss')"
      >
        Continue
      </button>
      <div class="clear-both"></div>
    </div>
  </div>
</template>
