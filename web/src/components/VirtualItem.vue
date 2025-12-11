<template>
  <div ref="el" :style="{ minHeight: height ? `${height}px` : 'auto' }">
    <slot v-if="isVisible"></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const el = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const height = ref<number>(0);

let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true;
        } else {
          // When scrolling out of view, save the height and hide content
          if (el.value && el.value.clientHeight > 0) {
            height.value = el.value.clientHeight;
          }
          // Only hide if we have a height to reserve space
          if (height.value > 0) {
            isVisible.value = false;
          }
        }
      });
    },
    {
      rootMargin: "800px 0px", // Preload/keep content 800px before/after viewport
    }
  );

  if (el.value) {
    observer.observe(el.value);
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>
