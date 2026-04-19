<script setup lang="ts">
defineProps<{
  visible: boolean
  text: string
}>()

defineEmits<{
  advance: []
}>()
</script>

<template>
  <div
    v-if="visible"
    tabindex="0"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary px-8 py-12 cursor-pointer"
    @click="$emit('advance')"
    @keydown.enter="$emit('advance')"
  >
    <!-- eslint-disable vue/no-v-html -->
    <div
      class="max-w-2xl w-full text-center text-text-primary leading-relaxed text-lg"
      v-html="text"
    ></div>
    <!-- eslint-enable vue/no-v-html -->
    <div class="mt-8 text-text-secondary text-sm animate-pulse">
      Press Enter or tap to continue…
    </div>
  </div>
</template>
