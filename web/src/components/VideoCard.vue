<template>
  <Card
    class="break-inside-avoid overflow-hidden group cursor-pointer transition-all hover:shadow-lg relative"
  >
    <div class="relative w-full overflow-hidden bg-black">
      <video
        ref="videoRef"
        :src="videoUrl"
        class="w-full object-cover"
        loop
        playsinline
        disablePictureInPicture
        :muted="isMuted"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @ended="onEnded"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
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

      <!-- Edit/Delete Actions (Top Left) - Only if showActions is true -->
      <div v-if="showActions" class="absolute top-3 left-3 flex gap-2">
        <button
          @click.stop="$emit('edit', video)"
          class="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 hover:text-primary transition-all"
        >
          <Edit class="h-5 w-5" />
        </button>
        <button
          @click.stop="$emit('delete', video)"
          class="p-2 rounded-full bg-black/20 backdrop-blur-sm text-white hover:bg-black/40 hover:text-destructive transition-all"
        >
          <Trash2 class="h-5 w-5" />
        </button>
      </div>
    </div>

    <CardContent class="p-4">
      <h3 class="font-semibold leading-none tracking-tight mb-2 line-clamp-2">
        {{ video.title }}
        <span v-if="video.category" class="text-blue-500"
          >#{{ video.category }}</span
        >
      </h3>
      <div
        class="flex items-center justify-between text-sm text-muted-foreground"
      >
        <div class="flex items-center gap-2">
          <div
            class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary overflow-hidden"
          >
            <img
              v-if="video.user?.avatar"
              :src="`http://localhost:3000/${video.user.avatar}`"
              class="h-full w-full object-cover"
            />
            <span v-else>{{
              (video.user?.nickname || video.user?.username)
                ?.charAt(0)
                .toUpperCase() || "?"
            }}</span>
          </div>
          <span class="truncate max-w-[80px]">{{
            video.user?.nickname || video.user?.username || "Unknown"
          }}</span>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <div v-if="showViews" class="flex items-center gap-1">
            <Play class="h-3 w-3" />
            <span>{{ video.views || 0 }}</span>
          </div>
          <div class="flex items-center gap-1">
            <Heart
              class="h-3 w-3"
              :class="{ 'fill-red-500 text-red-500': isLiked }"
            />
            <span>{{ likeCount }}</span>
          </div>
        </div>
      </div>
    </CardContent>

    <!-- Error Alert Dialog -->
    <AlertDialog v-model:open="errorDialog.open">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ errorDialog.title }}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {{ errorDialog.message }}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Heart,
  Edit,
  Trash2,
} from "lucide-vue-next";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/services/api";
import { useStore } from "vuex";

const props = withDefaults(
  defineProps<{
    video: any;
    showViews?: boolean;
    showActions?: boolean;
  }>(),
  {
    showViews: true,
    showActions: false,
  }
);

defineEmits(["edit", "delete"]);

const store = useStore();
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(true); // Start muted for auto-play
const currentTime = ref(0);
const duration = ref(0);
const isLoading = ref(true);
const hasError = ref(false);
const likeCount = ref(0);
const isLiked = ref(false);

const errorDialog = ref({
  open: false,
  title: "Error",
  message: "",
});

const showError = (message: string) => {
  errorDialog.value = {
    open: true,
    title: "Error",
    message: message,
  };
};

const currentUser = computed(() => store.getters.currentUser);

const videoUrl = computed(() => {
  if (!props.video?.url) return "";
  return `http://localhost:3000/${props.video.url}`;
});

const updateLikeState = () => {
  likeCount.value = props.video.likes ? props.video.likes.length : 0;
  if (currentUser.value && props.video.likes) {
    isLiked.value = props.video.likes.some(
      (like: any) => like.user && like.user.id === currentUser.value.id
    );
  } else {
    isLiked.value = false;
  }
};

onMounted(() => {
  updateLikeState();
});

watch(() => props.video, updateLikeState, { deep: true });
watch(currentUser, updateLikeState);

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
  showError("Failed to load video. Please try again later.");
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const toggleLike = async () => {
  if (!currentUser.value) {
    showError("Please login to like videos");
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
    showError("Failed to update like. Please try again.");
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
