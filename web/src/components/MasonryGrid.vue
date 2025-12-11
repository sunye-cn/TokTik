<template>
  <div ref="container" class="w-full">
    <!-- Masonry Layout -->
    <div class="flex gap-4">
      <div
        v-for="(col, colIndex) in renderColumns"
        :key="colIndex"
        class="flex-1 flex flex-col gap-4"
      >
        <!-- Top Spacer -->
        <div
          v-if="col.paddingTop > 0"
          :style="{ height: col.paddingTop + 'px' }"
        ></div>

        <!-- Visible Items -->
        <div
          v-for="item in col.visibleItems"
          :key="item.id"
          :data-id="item.id"
          :ref="(el) => setItemRef(el, item.id)"
        >
          <slot name="item" :item="item"></slot>
        </div>

        <!-- Bottom Spacer -->
        <div
          v-if="col.paddingBottom > 0"
          :style="{ height: col.paddingBottom + 'px' }"
        ></div>
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
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  reactive,
  type ComponentPublicInstance,
} from "vue";

const props = defineProps<{
  items: any[];
  isLoading: boolean;
  hasMore: boolean;
}>();

const emit = defineEmits(["loadMore"]);

const container = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const columnCount = ref(1);
const itemHeights = reactive(new Map<string | number, number>());
const scrollTop = ref(0);
const windowHeight = ref(0);
const containerOffset = ref(0);
const gap = 16; // gap-4 = 1rem = 16px

// Responsive column count
const updateColumnCount = () => {
  const width = window.innerWidth;
  if (width >= 1280) columnCount.value = 4; // lg
  else if (width >= 1024) columnCount.value = 3; // md
  else if (width >= 640) columnCount.value = 2; // sm
  else columnCount.value = 1;
};

// Scroll & Resize Handling
const handleScroll = () => {
  scrollTop.value = window.scrollY;
  windowHeight.value = window.innerHeight;
  if (container.value) {
    const rect = container.value.getBoundingClientRect();
    containerOffset.value = rect.top + window.scrollY;
  }
};

// ResizeObserver for measuring item heights
const resizeObserver = new ResizeObserver((entries) => {
  window.requestAnimationFrame(() => {
    for (const entry of entries) {
      const id = entry.target.getAttribute("data-id");
      if (id) {
        // Use borderBoxSize if available for accurate height including padding/border
        const height =
          entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;

        // Only update if height changed to avoid loops
        if (itemHeights.get(id) !== height) {
          itemHeights.set(id, height);
        }
      }
    }
  });
});

const setItemRef = (el: Element | ComponentPublicInstance | null, id: any) => {
  if (el instanceof Element) {
    el.setAttribute("data-id", String(id));
    resizeObserver.observe(el);
  }
};

// Computed Columns with Virtualization
const renderColumns = computed(() => {
  // 1. Distribute items to columns
  const fullCols: any[][] = Array.from({ length: columnCount.value }, () => []);
  props.items.forEach((item, index) => {
    fullCols[index % columnCount.value].push(item);
  });

  // 2. Calculate visibility and spacers
  const buffer = windowHeight.value || 1000;
  const topThreshold = Math.max(
    0,
    scrollTop.value - containerOffset.value - buffer
  );
  const bottomThreshold =
    scrollTop.value -
    containerOffset.value +
    (windowHeight.value || 1000) +
    buffer;

  return fullCols.map((colItems) => {
    let currentY = 0;
    let paddingTop = 0;
    let paddingBottom = 0;
    const visibleItems: any[] = [];

    for (const item of colItems) {
      const h = itemHeights.get(String(item.id)) || 300; // Default estimate
      const itemTop = currentY;
      const itemBottom = currentY + h;

      if (itemBottom < topThreshold) {
        // Item is above viewport
        paddingTop = itemBottom;
      } else if (itemTop > bottomThreshold) {
        // Item is below viewport
        paddingBottom += h + gap;
      } else {
        // Item is visible
        visibleItems.push(item);
      }

      currentY += h + gap;
    }

    // Adjust paddingBottom to remove the last gap
    if (paddingBottom > 0) paddingBottom -= gap;

    return { paddingTop, paddingBottom, visibleItems };
  });
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
  handleScroll(); // Initial measure
  window.addEventListener("resize", updateColumnCount);
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll); // Update window height
  setupObserver();
});

onUnmounted(() => {
  window.removeEventListener("resize", updateColumnCount);
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleScroll);
  if (observer) observer.disconnect();
  resizeObserver.disconnect();
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
