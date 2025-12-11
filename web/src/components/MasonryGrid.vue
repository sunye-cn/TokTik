<template>
  <div class="w-full">
    <!-- Masonry Layout -->
    <div class="flex gap-4">
      <div
        v-for="(col, colIndex) in columns"
        :key="colIndex"
        class="flex-1 flex flex-col gap-4"
      >
        <VirtualItem v-for="item in col" :key="item.id">
          <slot name="item" :item="item"></slot>
        </VirtualItem>
      </div>
    </div>

    <!-- Loading State & Trigger -->
    <div ref="trigger" class="h-20 flex items-center justify-center mt-4">
      <div
        v-if="isLoading"
        class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
      ></div>
      <span
        v-else-if="!hasMore && items.length > 0"
        class="text-muted-foreground text-sm"
      >
        No more content
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import VirtualItem from "./VirtualItem.vue";

const props = defineProps<{
  items: any[];
  isLoading: boolean;
  hasMore: boolean;
}>();

const emit = defineEmits(["loadMore"]);

const trigger = ref<HTMLElement | null>(null);
const columnCount = ref(1);

// Responsive column count
const updateColumnCount = () => {
  const width = window.innerWidth;
  if (width >= 1280) columnCount.value = 4; // lg
  else if (width >= 1024) columnCount.value = 3; // md
  else if (width >= 640) columnCount.value = 2; // sm
  else columnCount.value = 1;
};

// Distribute items into columns
const columns = computed(() => {
  const cols: any[][] = Array.from({ length: columnCount.value }, () => []);
  props.items.forEach((item, index) => {
    cols[index % columnCount.value].push(item);
  });
  return cols;
});

// Infinite Scroll Observer
let observer: IntersectionObserver | null = null;

const setupObserver = () => {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !props.isLoading && props.hasMore) {
        emit("loadMore");
      }
    },
    { rootMargin: "200px" }
  );

  if (trigger.value) {
    observer.observe(trigger.value);
  }
};

onMounted(() => {
  updateColumnCount();
  window.addEventListener("resize", updateColumnCount);
  setupObserver();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateColumnCount);
  if (observer) observer.disconnect();
});

watch(
  () => [props.isLoading, props.hasMore],
  () => {
    nextTick(() => {
      setupObserver();
    });
  }
);
</script>
