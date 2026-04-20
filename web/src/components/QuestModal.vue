<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  title: string
  body: string
}>()

const emit = defineEmits<{
  dismiss: []
}>()

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('dismiss')
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

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
      data-testid="quest-modal-card"
      class="bg-bg-card border border-border rounded-xl p-4 md:p-6 max-w-[480px] w-[90%] max-h-[90vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
    >
      <div class="text-[1.1rem] font-bold text-quest mb-3 shrink-0">
        {{ title }}
      </div>
      <div class="relative flex-1 min-h-0">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          class="overflow-y-auto h-full leading-relaxed pr-1 touch-pan-y"
          v-html="body"
        ></div>
        <div
          class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bg-card to-transparent pointer-events-none"
        ></div>
      </div>
      <div class="shrink-0 flex justify-end pt-2">
        <button
          class="px-6 py-2 rounded-md bg-accent text-white border-none cursor-pointer text-[0.9rem] hover:opacity-85"
          @click="$emit('dismiss')"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</template>
