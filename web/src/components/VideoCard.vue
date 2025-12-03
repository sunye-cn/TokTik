<template>
  <Card
    class="break-inside-avoid overflow-hidden group cursor-pointer transition-all hover:shadow-lg relative"
  >
    <div class="relative aspect-[9/16] w-full overflow-hidden bg-black">
      <video
        ref="videoRef"
        :src="videoUrl"
        class="h-full w-full object-cover"
        loop
        playsinline
        disablePictureInPicture
        :muted="isMuted"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @ended="onEnded"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
        @click="togglePlay"
        @error="handleError"
      ></video>

      <!-- Loading Spinner -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-black/20"
      >
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        ></div>
      </div>

      <!-- Error Message -->
      <div
        v-if="hasError"
        class="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-xs"
      >
        Video unavailable
      </div>

      <!-- Custom Controls Overlay -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col gap-2"
        @click.stop
      >
        <!-- Timeline -->
        <input
          type="range"
          min="0"
          :max="duration"
          step="0.1"
          v-model="currentTime"
          @input="seek"
          class="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
        />

        <div class="flex items-center justify-between text-white">
          <div class="flex items-center gap-2">
            <!-- Play/Pause -->
            <button
              @click="togglePlay"
              class="hover:text-primary transition-colors"
            >
              <Play v-if="!isPlaying" class="h-5 w-5 fill-current" />
              <Pause v-else class="h-5 w-5 fill-current" />
            </button>

            <!-- Mute/Unmute -->
            <button
              @click="toggleMute"
              class="hover:text-primary transition-colors"
            >
              <VolumeX v-if="isMuted" class="h-5 w-5" />
              <Volume2 v-else class="h-5 w-5" />
            </button>

            <!-- Time -->
            <span class="text-xs font-mono"
              >{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span
            >
          </div>

          <!-- Replay -->
          <button @click="replay" class="hover:text-primary transition-colors">
            <RotateCcw class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Like Button (Top Right) -->
      <button
        @click.stop="toggleLike"
        class="absolute top-3 right-3 p-2 rounded-full bg-black/20 backdrop-blur-sm transition-all hover:bg-black/40 active:scale-95"
        :class="{ 'text-red-500': isLiked, 'text-white': !isLiked }"
      >
        <Heart class="h-6 w-6" :class="{ 'fill-current': isLiked }" />
      </button>
    </div>

    <CardContent class="p-4">
      <h3 class="font-semibold leading-none tracking-tight mb-2 line-clamp-1">
        {{ video.title }}
      </h3>
      <div
        class="flex items-center justify-between text-sm text-muted-foreground"
      >
        <div class="flex items-center gap-2">
          <div
            class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary"
          >
            {{ video.user.username.charAt(0).toUpperCase() }}
          </div>
          <span class="truncate max-w-[100px]">{{ video.user.username }}</span>
        </div>
        <div class="flex items-center gap-1">
          <Heart
            class="h-3 w-3"
            :class="{ 'fill-red-500 text-red-500': isLiked }"
          />
          <span>{{ likeCount }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Heart,
} from "lucide-vue-next";
import api from "@/services/api";
import { useStore } from "vuex";

const props = defineProps<{
  video: any;
}>();

const store = useStore();
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(true); // Start muted for auto-play
const currentTime = ref(0);
const duration = ref(0);
const isLoading = ref(true);
const hasError = ref(false);

// Like state
const isLiked = ref(false);
const likeCount = ref(0);

const videoUrl = computed(() => {
  if (!props.video.url) return "";
  if (props.video.url.startsWith("http")) return props.video.url;
  return `http://localhost:3000/${props.video.url.replace(/\\/g, "/")}`;
});

const currentUser = computed(() => store.getters.currentUser);

onMounted(() => {
  // Initialize like state
  likeCount.value = props.video.likes ? props.video.likes.length : 0;
  if (currentUser.value && props.video.likes) {
    isLiked.value = props.video.likes.some(
      (like: any) => like.user && like.user.id === currentUser.value.id
    );
  }
});

const togglePlay = () => {
  if (!videoRef.value) return;
  if (videoRef.value.paused) {
    videoRef.value.play().catch((e) => console.error(e));
    isPlaying.value = true;
  } else {
    videoRef.value.pause();
    isPlaying.value = false;
  }
};

const onMouseEnter = () => {
  if (!videoRef.value) return;
  videoRef.value.play().catch(() => {
    // Auto-play might be blocked
    isMuted.value = true; // Ensure muted if blocked
    videoRef.value?.play().catch((e) => console.error(e));
  });
  isPlaying.value = true;
};

const onMouseLeave = () => {
  if (!videoRef.value) return;
  videoRef.value.pause();
  isPlaying.value = false;
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
};

const onTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime;
  }
};

const onLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration;
    isLoading.value = false;
  }
};

const seek = () => {
  if (videoRef.value) {
    videoRef.value.currentTime = currentTime.value;
  }
};

const replay = () => {
  if (videoRef.value) {
    videoRef.value.currentTime = 0;
    videoRef.value.play();
    isPlaying.value = true;
  }
};

const onEnded = () => {
  isPlaying.value = false;
};

const handleError = () => {
  isLoading.value = false;
  hasError.value = true;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const toggleLike = async () => {
  if (!currentUser.value) {
    alert("Please login to like videos");
    return;
  }

  try {
    if (isLiked.value) {
      await api.delete(`/videos/${props.video.id}/like`);
      likeCount.value--;
      isLiked.value = false;
    } else {
      await api.post(`/videos/${props.video.id}/like`);
      likeCount.value++;
      isLiked.value = true;
    }
  } catch (error) {
    console.error("Failed to toggle like", error);
  }
};
</script>

<style scoped>
/* Custom range input styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  margin-top: -4px;
}

input[type="range"]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style>
