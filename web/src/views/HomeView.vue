<template>
  <div class="space-y-6">
    <!-- Sorting Controls -->
    <div
      class="flex flex-wrap gap-4 items-center justify-between bg-background/95 backdrop-blur p-4 sticky top-14 z-30 border-b"
    >
      <div class="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
        <Button
          variant="secondary"
          size="sm"
          @click="
            currentCategory = '';
            fetchVideos(true);
          "
          :class="
            currentCategory === ''
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted hover:bg-muted/80'
          "
        >
          All
        </Button>
        <Button
          v-for="cat in categories"
          :key="cat"
          variant="secondary"
          size="sm"
          @click="
            currentCategory = cat;
            fetchVideos(true);
          "
          :class="
            currentCategory === cat
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted hover:bg-muted/80'
          "
        >
          {{ cat }}
        </Button>
      </div>

      <div class="flex gap-2 items-center">
        <div class="relative">
          <Input
            v-model="searchQuery"
            @keyup.enter="fetchVideos(true)"
            type="text"
            placeholder="Search..."
            class="h-9 w-[150px] sm:w-[200px]"
          />
        </div>
        <select
          v-model="sortBy"
          @change="fetchVideos(true)"
          class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="createdAt">Latest</option>
          <option value="views">Most Viewed</option>
          <option value="likes">Most Liked</option>
          <option value="title">Name</option>
        </select>
      </div>
    </div>

    <div
      v-if="isLoading && videos.length === 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <div v-for="n in 8" :key="n" class="flex flex-col space-y-3">
        <Skeleton class="h-[250px] w-full rounded-xl" />
        <div class="space-y-2">
          <Skeleton class="h-4 w-[250px]" />
          <Skeleton class="h-4 w-[200px]" />
        </div>
      </div>
    </div>

    <div v-else class="space-y-8">
      <div
        class="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4 space-y-4"
      >
        <div v-for="video in videos" :key="video.id" class="break-inside-avoid">
          <VideoCard
            :video="video"
            :show-views="false"
            @click="openVideo(video)"
          />
        </div>
      </div>

      <!-- Load More Trigger -->
      <div ref="loadMoreTrigger" class="h-10 flex items-center justify-center">
        <div
          v-if="isLoading"
          class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
        ></div>
        <span
          v-else-if="!hasMore && videos.length > 0"
          class="text-muted-foreground text-sm"
          >No more videos</span
        >
        <span
          v-else-if="!hasMore && videos.length === 0"
          class="text-muted-foreground text-sm"
          >No videos found</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "../services/api";
import VideoCard from "@/components/VideoCard.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VIDEO_CATEGORIES } from "@/lib/constants";

interface Video {
  id: number;
  title: string;
  url: string;
  user: {
    username: string;
  };
  likes: any[];
  views: number;
  comments: any[];
  danmakus: any[];
}

const router = useRouter();
const route = useRoute();
const videos = ref<Video[]>([]);
const isLoading = ref(false);
const sortBy = ref("createdAt");
const searchQuery = ref("");
const currentCategory = ref("");
const categories = VIDEO_CATEGORIES;

const page = ref(1);
const limit = ref(12);
const hasMore = ref(true);
const loadMoreTrigger = ref<HTMLElement | null>(null);

const fetchVideos = async (reset = false) => {
  if (reset) {
    page.value = 1;
    videos.value = [];
    hasMore.value = true;
  }

  if (!hasMore.value && !reset) return;

  isLoading.value = true;
  try {
    const params: any = {
      sort: sortBy.value,
      page: page.value,
      limit: limit.value,
    };
    if (currentCategory.value) params.category = currentCategory.value;
    if (searchQuery.value) params.search = searchQuery.value;

    const response = await api.get("/videos", { params });

    // Assuming the API returns an array of videos.
    // If the API returns { data: [], total: ... }, adjust accordingly.
    // Based on previous context, it seems to return an array directly or we need to check.
    // Let's assume it returns an array for now, and if length < limit, hasMore = false.

    const newVideos = response.data;
    if (newVideos.length < limit.value) {
      hasMore.value = false;
    }

    if (reset) {
      videos.value = newVideos;
    } else {
      videos.value = [...videos.value, ...newVideos];
    }

    page.value++;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const openVideo = (video: Video) => {
  router.push(`/video/${video.id}`);
};

let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (route.query.category) {
    currentCategory.value = route.query.category as string;
  }
  fetchVideos(true);

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !isLoading.value) {
        fetchVideos();
      }
    },
    { threshold: 0.1 }
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

watch(loadMoreTrigger, (el) => {
  if (el && observer) observer.observe(el);
});

watch(
  () => route.query.category,
  (newCategory) => {
    if (newCategory !== undefined) {
      currentCategory.value = newCategory as string;
      fetchVideos(true);
    }
  }
);
</script>
