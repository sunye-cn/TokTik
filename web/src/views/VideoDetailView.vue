<template>
  <div class="flex flex-col lg:flex-row h-[calc(100vh-4rem)] gap-4">
    <!-- Video Player Section -->
    <div class="flex-1 flex flex-col gap-2">
      <div
        class="bg-black flex items-center justify-center relative group flex-1 rounded-lg overflow-hidden"
      >
        <video
          v-if="video"
          ref="videoRef"
          :src="videoUrl"
          class="w-full h-full object-contain"
          controls
          autoplay
          @ended="onEnded"
        ></video>
        <div v-else class="text-white">Loading video...</div>

        <!-- Danmaku Overlay -->
        <div
          v-if="showDanmaku"
          class="absolute inset-0 pointer-events-none overflow-hidden z-10"
        >
          <div
            v-for="dm in activeDanmakus"
            :key="dm.id"
            class="absolute whitespace-nowrap text-shadow transition-all duration-100 font-bold"
            :style="{
              top: `${dm.top}%`,
              left: `${100 - dm.progress}%`,
              color: dm.color,
              fontSize: `${dm.fontSize || 16}px`,
            }"
          >
            {{ dm.content }}
          </div>
        </div>

        <button
          class="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
          @click="$router.back()"
        >
          Back
        </button>
      </div>

      <!-- Danmaku Controls (Below Video) -->
      <div class="bg-background border rounded-lg p-2 shadow-sm">
        <div class="flex items-center gap-2">
          <!-- Toggle Switch -->
          <div class="flex items-center gap-2 mr-2">
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="showDanmaku"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
              ></div>
              <span class="ml-2 text-sm font-medium text-gray-900">弹</span>
            </label>
          </div>

          <div class="relative">
            <button
              @click="showSettings = !showSettings"
              class="p-2 rounded hover:bg-muted transition-colors"
              :class="showSettings ? 'text-primary' : 'text-muted-foreground'"
              title="Danmaku Settings"
            >
              <Settings class="h-5 w-5" />
            </button>

            <!-- Settings Popover -->
            <div
              v-if="showSettings"
              class="absolute bottom-full left-0 mb-2 w-64 bg-popover p-4 rounded-lg shadow-xl border z-50"
            >
              <div class="space-y-4">
                <div>
                  <div class="text-xs font-medium mb-2">Color</div>
                  <div class="flex gap-1 flex-wrap">
                    <button
                      v-for="c in colors"
                      :key="c"
                      class="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110"
                      :style="{ backgroundColor: c }"
                      @click="danmakuColor = c"
                      :class="{
                        'ring-2 ring-primary ring-offset-2': danmakuColor === c,
                      }"
                    ></button>
                  </div>
                </div>
                <div>
                  <div class="text-xs font-medium mb-2">Position</div>
                  <div class="flex gap-1">
                    <button
                      v-for="p in positions"
                      :key="p"
                      class="text-xs px-3 py-1.5 rounded-md border transition-colors"
                      :class="
                        danmakuPosition === p
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted hover:bg-muted/80'
                      "
                      @click="danmakuPosition = p"
                    >
                      {{ p }}
                    </button>
                  </div>
                </div>
                <div>
                  <div class="text-xs font-medium mb-2">
                    Font Size: {{ danmakuFontSize }}px
                  </div>
                  <input
                    type="range"
                    v-model.number="danmakuFontSize"
                    min="12"
                    max="32"
                    step="2"
                    class="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 flex gap-2">
            <Input
              v-model="newDanmaku"
              placeholder="Send a danmaku..."
              class="h-9"
              @keyup.enter="sendDanmaku"
            />
            <Button @click="sendDanmaku" :disabled="!newDanmaku.trim()"
              >Send</Button
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar (Info & Comments) -->
    <div class="w-full lg:w-[400px] flex flex-col bg-background border-l">
      <div v-if="video" class="p-4 border-b">
        <div class="flex justify-between items-start mb-2">
          <h1 class="text-xl font-bold">
            {{ video.title }}
            <span
              v-if="video.category"
              class="text-blue-500 cursor-pointer hover:underline"
              @click="goToCategory(video.category)"
              >#{{ video.category }}</span
            >
          </h1>
        </div>
        <div class="mb-4 text-sm">
          <p class="text-muted-foreground mb-2">{{ video.description }}</p>
        </div>
        <div
          class="flex items-center justify-between text-sm text-muted-foreground"
        >
          <div class="flex items-center gap-2">
            <div
              class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary"
            >
              {{
                (video.user.nickname || video.user.username)
                  .charAt(0)
                  .toUpperCase()
              }}
            </div>
            <span class="font-medium text-foreground">{{
              video.user.nickname || video.user.username
            }}</span>
          </div>
          <div class="flex gap-4">
            <span>{{ video.views }} views</span>
            <span>{{ video.likes?.length || 0 }} likes</span>
          </div>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="flex-1 overflow-y-auto p-4 flex flex-col">
        <h3 class="font-semibold mb-4">Comments</h3>

        <!-- Comment Input -->
        <div class="flex gap-2 mb-6">
          <Input
            v-model="newComment"
            placeholder="Add a comment..."
            @keyup.enter="postComment"
          />
          <Button @click="postComment" :disabled="!newComment.trim()"
            >Post</Button
          >
        </div>

        <!-- Comments List -->
        <div v-if="comments.length > 0" class="space-y-4">
          <div v-for="comment in comments" :key="comment.id" class="flex gap-3">
            <div
              class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0"
            >
              {{
                (comment.user.nickname || comment.user.username)
                  .charAt(0)
                  .toUpperCase()
              }}
            </div>
            <div class="flex-1 space-y-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">{{
                    comment.user.nickname || comment.user.username
                  }}</span>
                  <span
                    v-if="comment.user.id === video.user.id"
                    class="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full"
                    >Author</span
                  >
                </div>
                <span class="text-xs text-muted-foreground">{{
                  formatDate(comment.createdAt)
                }}</span>
              </div>
              <p class="text-sm">{{ comment.content }}</p>
              <div class="flex items-center gap-4 mt-1">
                <button
                  @click="likeComment(comment)"
                  class="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <Heart class="h-3 w-3" /> {{ comment.likes || 0 }}
                </button>
                <button
                  v-if="canDeleteComment(comment)"
                  @click="deleteComment(comment.id)"
                  class="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-muted-foreground text-sm py-8">
          No comments yet. Be the first to comment!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Settings } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const store = useStore();
const video = ref<any>(null);
const videoRef = ref<HTMLVideoElement | null>(null);

// Comments State
const comments = ref<any[]>([]);
const newComment = ref("");

// Danmaku State
const danmakus = ref<any[]>([]);
const activeDanmakus = ref<any[]>([]);
const newDanmaku = ref("");
const showDanmaku = ref(true);
const showSettings = ref(false);
const danmakuColor = ref("#ffffff");
const danmakuPosition = ref("scroll");
const danmakuFontSize = ref(16);
const colors = [
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
];
const positions = ["scroll", "top", "bottom"];
let danmakuInterval: any = null;

const currentUser = computed(() => store.getters.currentUser);
const isOwner = computed(() => {
  return (
    video.value &&
    currentUser.value &&
    video.value.user.id === currentUser.value.id
  );
});

const videoUrl = computed(() => {
  if (!video.value) return "";
  // Ensure there is a slash between base URL and video path
  const path = video.value.url.startsWith("/")
    ? video.value.url
    : `/${video.value.url}`;
  return `http://localhost:3000${path}`;
});

const fetchVideo = async () => {
  try {
    const response = await api.get(`/videos/${route.params.id}`);
    video.value = response.data;
    fetchComments();
    fetchDanmakus();
  } catch (error) {
    console.error("Error fetching video:", error);
  }
};

const fetchComments = async () => {
  try {
    const res = await api.get(`/videos/${route.params.id}/comments`);
    comments.value = res.data;
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
};

const fetchDanmakus = async () => {
  try {
    const res = await api.get(`/videos/${route.params.id}/danmaku`);
    danmakus.value = res.data;
  } catch (error) {
    console.error("Error fetching danmakus:", error);
  }
};

const sendDanmaku = async () => {
  if (!newDanmaku.value.trim() || !videoRef.value) return;

  const time = videoRef.value.currentTime;
  const danmakuData = {
    content: newDanmaku.value,
    time,
    color: danmakuColor.value,
    position: danmakuPosition.value,
    fontSize: danmakuFontSize.value,
  };

  try {
    const res = await api.post(
      `/videos/${route.params.id}/danmaku`,
      danmakuData
    );
    danmakus.value.push(res.data);
    // Also add to active immediately for feedback
    addActiveDanmaku({
      ...res.data,
      top: Math.random() * 80, // Random vertical position
      left: 100,
      progress: 0,
    });
    newDanmaku.value = "";
  } catch (error) {
    console.error("Failed to send danmaku:", error);
    alert("Failed to send danmaku");
  }
};

const addActiveDanmaku = (dm: any) => {
  activeDanmakus.value.push(dm);
  // Animation logic would go here or be handled by CSS/JS loop
  // For simplicity, we'll just let CSS handle the movement if we were using keyframes,
  // but here we are using style binding. We need a loop.
};

// Simple Danmaku Engine
const updateDanmakus = () => {
  danmakuInterval = requestAnimationFrame(updateDanmakus);

  if (!videoRef.value || !showDanmaku.value) return;
  const currentTime = videoRef.value.currentTime;

  // Check for new danmakus to show
  danmakus.value.forEach((dm) => {
    if (
      Math.abs(dm.time - currentTime) < 0.1 &&
      !activeDanmakus.value.find((a) => a.id === dm.id)
    ) {
      addActiveDanmaku({
        ...dm,
        top: Math.random() * 80,
        left: 100,
        progress: 0,
      });
    }
  });

  // Update positions
  activeDanmakus.value.forEach((dm, index) => {
    dm.progress += 0.5; // Speed
    if (dm.progress > 120) {
      activeDanmakus.value.splice(index, 1);
    }
  });
};

onMounted(() => {
  fetchVideo();
  danmakuInterval = requestAnimationFrame(updateDanmakus);
});

onUnmounted(() => {
  if (danmakuInterval) cancelAnimationFrame(danmakuInterval);
});

const postComment = async () => {
  if (!newComment.value.trim()) return;
  try {
    const res = await api.post(`/videos/${route.params.id}/comments`, {
      content: newComment.value,
    });
    comments.value.unshift(res.data);
    newComment.value = "";
  } catch (error) {
    alert("Failed to post comment");
  }
};

const deleteComment = async (commentId: number) => {
  if (!confirm("Delete this comment?")) return;
  try {
    await api.delete(`/videos/comments/${commentId}`);
    comments.value = comments.value.filter((c) => c.id !== commentId);
  } catch (error) {
    alert("Failed to delete comment");
  }
};

const likeComment = async (comment: any) => {
  try {
    const res = await api.post(`/videos/comments/${comment.id}/like`);
    comment.likes = res.data.likes;
  } catch (error) {
    console.error("Failed to like comment");
  }
};

const canDeleteComment = (comment: any) => {
  if (!currentUser.value) return false;
  // Comment author OR Video owner can delete
  return comment.user.id === currentUser.value.id || isOwner.value;
};

const goToCategory = (category: string) => {
  router.push({ path: "/", query: { category } });
};

const formatDate = (date: string) => {
  return (
    new Date(date).toLocaleDateString() +
    " " +
    new Date(date).toLocaleTimeString()
  );
};

const onEnded = () => {
  // Handle video end (e.g., replay or show overlay)
};
</script>
