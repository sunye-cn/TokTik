<template>
  <div class="space-y-6">
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
        @click="openVideo(video)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import api from "../services/api";
import VideoCard from "@/components/VideoCard.vue";

interface Video {
  id: number;
  title: string;
  url: string;
  user: {
    username: string;
  };
  likes: any[];
}

const videos = ref<Video[]>([]);
const isLoading = ref(true);

const fetchVideos = async () => {
  try {
    const response = await api.get("/videos");
    videos.value = response.data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const openVideo = (video: Video) => {
  // Implement modal or navigation to detail page
  console.log("Open video", video);
};

onMounted(() => {
  fetchVideos();
});
</script>
