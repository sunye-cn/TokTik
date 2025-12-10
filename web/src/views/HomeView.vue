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
            fetchVideos();
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
            fetchVideos();
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
            @keyup.enter="fetchVideos"
            type="text"
            placeholder="Search..."
            class="h-9 w-[150px] sm:w-[200px]"
          />
        </div>
        <select
          v-model="sortBy"
          @change="fetchVideos"
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
      v-if="isLoading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    >
      <div v-for="n in 8" :key="n" class="flex flex-col space-y-3">
        <div class="h-[250px] w-full rounded-xl bg-muted animate-pulse"></div>
        <div class="space-y-2">
          <div class="h-4 w-[250px] bg-muted animate-pulse rounded"></div>
          <div class="h-4 w-[200px] bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4 space-y-4"
    >
      <VideoCard
        v-for="video in videos"
        :key="video.id"
        :video="video"
        :show-views="false"
        @click="openVideo(video)"
      />
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
const isLoading = ref(true);
const sortBy = ref("createdAt");
const searchQuery = ref("");
const currentCategory = ref("");
const categories = VIDEO_CATEGORIES;

const fetchVideos = async () => {
  isLoading.value = true;
  try {
    const params: any = { sort: sortBy.value };
    if (currentCategory.value) params.category = currentCategory.value;
    if (searchQuery.value) params.search = searchQuery.value;

    const response = await api.get("/videos", { params });
    videos.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const openVideo = (video: Video) => {
  router.push(`/video/${video.id}`);
};

onMounted(() => {
  if (route.query.category) {
    currentCategory.value = route.query.category as string;
  }
  fetchVideos();
});

watch(
  () => route.query.category,
  (newCategory) => {
    if (newCategory) {
      currentCategory.value = newCategory as string;
      fetchVideos();
    }
  }
);
</script>
