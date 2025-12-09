<template>
  <div class="flex flex-col lg:flex-row h-[calc(100vh-7rem)] gap-4 -mt-2">
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
          autoplay
          @ended="onEnded"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onLoadedMetadata"
          @click="togglePlay"
          @play="isPlaying = true"
          @pause="isPlaying = false"
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
            class="absolute whitespace-nowrap text-shadow font-bold"
            :style="{
              top: `${dm.top}%`,
              left: `${100 - dm.progress}%`,
              color: dm.color,
              fontSize: `${fontSizePx}px`,
              opacity: 0.3 + (danmakuOpacity / 100) * 0.7,
            }"
          >
            {{ dm.content }}
          </div>
        </div>

        <!-- Danmaku List Modal -->
        <div
          v-if="showDanmakuList"
          class="absolute inset-0 bg-black/80 z-50 flex items-center justify-center"
          @click.self="showDanmakuList = false"
        >
          <div
            class="bg-[#2a2a2a] w-[600px] max-w-[90%] h-[400px] rounded-lg flex flex-col shadow-2xl border border-white/10"
          >
            <div
              class="flex justify-between items-center p-4 border-b border-white/10"
            >
              <span class="font-medium text-white">Danmaku List</span>
              <button
                @click="showDanmakuList = false"
                class="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-0">
              <table class="w-full text-left text-sm text-white/80">
                <thead class="bg-[#353535] sticky top-0 z-10">
                  <tr>
                    <th class="p-3 w-24 font-medium text-white/60">Time</th>
                    <th class="p-3 font-medium text-white/60">Content</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr
                    v-for="dm in danmakus"
                    :key="dm.id"
                    class="hover:bg-white/5 transition-colors"
                  >
                    <td class="p-3 font-mono text-xs text-white/50">
                      {{ formatTime(dm.time) }}
                    </td>
                    <td class="p-3">{{ dm.content }}</td>
                  </tr>
                  <tr v-if="danmakus.length === 0">
                    <td
                      colspan="2"
                      class="p-8 text-center text-white/40 italic"
                    >
                      No danmaku yet
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Custom Controls Overlay (Bottom) -->
        <div
          class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-2 pt-8 flex flex-col gap-2 z-20"
        >
          <!-- Progress Bar -->
          <div
            class="relative w-full h-1 hover:h-2 bg-white/20 cursor-pointer transition-all duration-200 group/progress"
            @click="seek"
            @mousemove="handleMouseMove"
            @mousedown="startDrag"
            @mouseup="stopDrag"
            @mouseleave="stopDrag"
          >
            <div
              class="absolute top-0 left-0 h-full bg-white transition-all duration-100 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              :style="{ width: `${progress}%` }"
            >
              <div
                class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-md"
              ></div>
            </div>
          </div>

          <div class="flex items-center gap-4 h-10">
            <!-- Play/Pause -->
            <button
              @click="togglePlay"
              class="text-white hover:text-primary transition-colors"
            >
              <Play v-if="!isPlaying" class="h-6 w-6 fill-current" />
              <Pause v-else class="h-6 w-6 fill-current" />
            </button>

            <!-- Time -->
            <div class="text-white text-xs font-mono">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </div>

            <!-- Danmaku Toggle -->
            <div class="flex items-center gap-2">
              <label
                class="relative inline-flex items-center cursor-pointer pointer-events-auto"
              >
                <input
                  type="checkbox"
                  v-model="showDanmaku"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200/50 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"
                ></div>
                <span
                  class="ml-2 text-sm font-medium text-shadow transition-colors"
                  :class="showDanmaku ? 'text-red-500' : 'text-white'"
                  >弹</span
                >
              </label>
            </div>

            <!-- Settings -->
            <div class="relative pointer-events-auto">
              <button
                @click="showSettings = !showSettings"
                class="p-2 rounded hover:bg-white/20 transition-colors text-white"
                :class="showSettings ? 'text-red-500' : ''"
                title="Danmaku Settings"
              >
                <Settings class="h-5 w-5" />
              </button>

              <!-- Settings Popover -->
              <div
                v-if="showSettings"
                class="absolute bottom-full left-0 mb-2 w-72 bg-[#1f1f1f] p-4 rounded-lg shadow-xl border border-white/10 z-50 text-white/90"
              >
                <div
                  class="flex justify-between items-center mb-4 border-b border-white/10 pb-2"
                >
                  <span class="font-medium">Danmaku Settings</span>
                  <button
                    @click="resetSettings"
                    class="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <span class="text-[10px]">↺</span> Reset
                  </button>
                </div>

                <div class="space-y-4 text-xs">
                  <!-- Opacity -->
                  <div class="flex items-center gap-3">
                    <span class="w-16 text-white/60">Opacity</span>
                    <input
                      type="range"
                      v-model.number="danmakuOpacity"
                      min="0"
                      max="100"
                      class="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      :style="{
                        background: `linear-gradient(to right, #ef4444 ${danmakuOpacity}%, #4b5563 ${danmakuOpacity}%)`,
                      }"
                    />
                    <span class="w-8 text-right">{{ danmakuOpacity }}%</span>
                  </div>

                  <!-- Display Area -->
                  <div class="flex items-center gap-3">
                    <span class="w-16 text-white/60">Area</span>
                    <input
                      type="range"
                      v-model.number="danmakuArea"
                      min="1"
                      max="4"
                      step="1"
                      class="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      :style="{
                        background: `linear-gradient(to right, #ef4444 ${
                          (danmakuArea - 1) * 33.33
                        }%, #4b5563 ${(danmakuArea - 1) * 33.33}%)`,
                      }"
                    />
                    <span class="w-8 text-right">{{ areaPercent }}%</span>
                  </div>

                  <!-- Font Size -->
                  <div class="flex items-center gap-3">
                    <span class="w-16 text-white/60">Font Size</span>
                    <input
                      type="range"
                      v-model.number="danmakuFontSize"
                      min="1"
                      max="5"
                      step="1"
                      class="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      :style="{
                        background: `linear-gradient(to right, #ef4444 ${
                          (danmakuFontSize - 1) * 25
                        }%, #4b5563 ${(danmakuFontSize - 1) * 25}%)`,
                      }"
                    />
                    <span class="w-8 text-right">{{
                      ["XS", "S", "M", "L", "XL"][danmakuFontSize - 1]
                    }}</span>
                  </div>

                  <!-- Speed -->
                  <div class="flex items-center gap-3">
                    <span class="w-16 text-white/60">Speed</span>
                    <input
                      type="range"
                      v-model.number="danmakuSpeed"
                      min="1"
                      max="3"
                      step="1"
                      class="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      :style="{
                        background: `linear-gradient(to right, #ef4444 ${
                          (danmakuSpeed - 1) * 50
                        }%, #4b5563 ${(danmakuSpeed - 1) * 50}%)`,
                      }"
                    />
                    <span class="w-8 text-right">{{
                      ["Slow", "Med", "Fast"][danmakuSpeed - 1]
                    }}</span>
                  </div>

                  <!-- Danmaku List Link -->
                  <div
                    class="pt-2 mt-2 border-t border-white/10 flex justify-between items-center cursor-pointer hover:bg-white/5 p-1 rounded"
                    @click="
                      showDanmakuList = true;
                      showSettings = false;
                    "
                  >
                    <span class="text-white/60">Danmaku List</span>
                    <span class="text-white/40">&gt;</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="flex-1 flex gap-2 pointer-events-auto">
              <Input
                v-model="newDanmaku"
                placeholder="Send a danmaku..."
                class="h-9 bg-black/50 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-red-500 rounded-full px-4"
                @keyup.enter="sendDanmaku"
              />
              <Button
                @click="sendDanmaku"
                :disabled="!newDanmaku.trim()"
                class="bg-red-500 hover:bg-red-600 text-white rounded-full px-6"
                >Send</Button
              >
            </div>
          </div>
        </div>

        <button
          class="absolute top-4 left-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 z-20"
          @click="$router.back()"
        >
          Back
        </button>

        <!-- Like Button Overlay -->
        <div
          class="absolute top-4 right-4 z-20 flex flex-col items-center gap-1"
        >
          <button
            @click="toggleLike"
            class="p-3 rounded-full bg-black/40 backdrop-blur-sm transition-all hover:bg-black/60 active:scale-95"
            :class="{ 'text-red-500': isLiked, 'text-white': !isLiked }"
          >
            <Heart class="h-8 w-8" :class="{ 'fill-current': isLiked }" />
          </button>
          <span
            class="text-white text-sm font-medium shadow-black drop-shadow-md"
            >{{ likeCount }}</span
          >
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
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-3 w-full">
            <div
              class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary overflow-hidden cursor-pointer"
              @click="$router.push(`/u/${video.user.username}`)"
            >
              <img
                v-if="video.user.avatar"
                :src="getAvatarUrl(video.user.avatar)"
                class="h-full w-full object-cover"
              />
              <span v-else>{{
                (video.user.nickname || video.user.username)
                  .charAt(0)
                  .toUpperCase()
              }}</span>
            </div>
            <div class="flex-1">
              <div
                class="font-bold text-foreground cursor-pointer hover:underline"
                @click="$router.push(`/u/${video.user.username}`)"
              >
                {{ video.user.nickname || video.user.username }}
              </div>
              <div class="text-xs text-muted-foreground flex gap-2">
                <span>{{ authorStats?.followersCount || 0 }} Followers</span>
                <span>{{ authorStats?.totalLikes || 0 }} Likes</span>
              </div>
            </div>
            <Button
              v-if="currentUser && currentUser.id !== video.user.id"
              :variant="isFollowingAuthor ? 'secondary' : 'default'"
              size="sm"
              @click="toggleFollowAuthor"
            >
              {{ isFollowingAuthor ? "Unfollow" : "Follow" }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="flex-1 flex flex-col min-h-0">
        <div class="flex-1 overflow-y-auto p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold">Comments</h3>
            <span class="text-xs text-muted-foreground"
              >{{ comments.length }} comments</span
            >
          </div>

          <!-- Comments List -->
          <div v-if="comments.length > 0" class="space-y-4">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="flex gap-3"
            >
              <div
                class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden cursor-pointer"
                @click="$router.push(`/u/${comment.user.username}`)"
              >
                <img
                  v-if="comment.user.avatar"
                  :src="getAvatarUrl(comment.user.avatar)"
                  alt="User avatar"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{
                  (comment.user.nickname || comment.user.username)
                    .charAt(0)
                    .toUpperCase()
                }}</span>
              </div>
              <div class="flex-1 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-medium text-sm cursor-pointer hover:underline"
                      @click="$router.push(`/u/${comment.user.username}`)"
                    >
                      {{ comment.user.nickname || comment.user.username }}
                    </span>
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

        <!-- Comment Input -->
        <div class="p-4 border-t bg-background">
          <div class="flex gap-2">
            <Input
              v-model="newComment"
              placeholder="Add a comment..."
              @keyup.enter="postComment"
            />
            <Button @click="postComment" :disabled="!newComment.trim()"
              >Post</Button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Settings, Play, Pause } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const store = useStore();
const video = ref<any>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const progress = ref(0);
const isDragging = ref(false);

// Comments State
const comments = ref<any[]>([]);
const newComment = ref("");

// Danmaku State
const danmakus = ref<any[]>([]);
const activeDanmakus = ref<any[]>([]);
const newDanmaku = ref("");
const showDanmaku = ref(true);
const showSettings = ref(false);
const showDanmakuList = ref(false);
const danmakuColor = ref("#ffffff");
const danmakuPosition = ref("scroll");
const danmakuFontSize = ref(2); // 1-5 scale
const danmakuOpacity = ref(100); // 0-100
const danmakuArea = ref(4); // 1-4 scale (25%, 50%, 75%, 100%)
const danmakuSpeed = ref(2); // 1-3 scale (Slow, Medium, Fast)

let danmakuInterval: any = null;

// Author Stats State
const authorStats = ref<any>(null);
const isFollowingAuthor = ref(false);

// Like State
const isLiked = ref(false);
const likeCount = ref(0);

// Computed properties for settings
const fontSizePx = computed(() => {
  // Map 1-5 to 16-28 (Linear interpolation)
  // 1 -> 16 (Current S)
  // 5 -> 28 (Current XL)
  // Step = (28 - 16) / 4 = 3
  const sizes = [16, 19, 22, 25, 28];
  return sizes[danmakuFontSize.value - 1] || 16;
});

const speedValue = computed(() => {
  const speeds = [0.03, 0.05, 0.075];
  return speeds[danmakuSpeed.value - 1] || 0.05;
});

const areaPercent = computed(() => {
  return danmakuArea.value * 25;
});

const resetSettings = () => {
  danmakuOpacity.value = 100;
  danmakuArea.value = 4;
  danmakuFontSize.value = 2;
  danmakuSpeed.value = 2;
};

const getAvatarUrl = (path: string) => {
  if (!path) return "";
  return `http://localhost:3000/${path}`;
};

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
    fetchAuthorStats();
    fetchComments();
    fetchDanmakus();
    fetchAuthorStats();
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

const fetchAuthorStats = async () => {
  if (!video.value) return;
  try {
    const res = await api.get(`/users/${video.value.user.id}`);
    authorStats.value = res.data;
    isFollowingAuthor.value = res.data.isFollowing;
  } catch (error) {
    console.error("Error fetching author stats:", error);
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

    // Calculate top based on position
    let top = Math.random() * areaPercent.value;
    if (res.data.position === "top") top = Math.random() * 30;
    else if (res.data.position === "bottom") top = 60 + Math.random() * 30;

    // Also add to active immediately for feedback
    addActiveDanmaku({
      ...res.data,
      top,
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

  if (!videoRef.value || !showDanmaku.value || videoRef.value.paused) return;
  const currentTime = videoRef.value.currentTime;

  // Check for new danmakus to show
  danmakus.value.forEach((dm) => {
    if (
      Math.abs(dm.time - currentTime) < 0.1 &&
      !activeDanmakus.value.find((a) => a.id === dm.id)
    ) {
      let top = Math.random() * areaPercent.value;
      if (dm.position === "top") top = Math.random() * 30;
      else if (dm.position === "bottom") top = 60 + Math.random() * 30;

      addActiveDanmaku({
        ...dm,
        top,
        left: 100,
        progress: 0,
      });
    }
  });

  // Update positions
  activeDanmakus.value.forEach((dm, index) => {
    dm.progress += speedValue.value; // Speed
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
  isPlaying.value = false;
};

const togglePlay = () => {
  if (!videoRef.value) return;
  if (videoRef.value.paused) {
    videoRef.value.play();
  } else {
    videoRef.value.pause();
  }
};

const onTimeUpdate = () => {
  if (!videoRef.value || isDragging.value) return;
  currentTime.value = videoRef.value.currentTime;
  progress.value = (currentTime.value / duration.value) * 100;
};

const onLoadedMetadata = () => {
  if (!videoRef.value) return;
  duration.value = videoRef.value.duration;
};

const formatTime = (seconds: number) => {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const seek = (e: MouseEvent) => {
  if (!videoRef.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = x / rect.width;
  const newTime = percentage * duration.value;
  videoRef.value.currentTime = newTime;
  currentTime.value = newTime;
  progress.value = percentage * 100;
};

const startDrag = () => {
  isDragging.value = true;
};

const stopDrag = () => {
  if (isDragging.value && videoRef.value) {
    videoRef.value.currentTime = (progress.value / 100) * duration.value;
  }
  isDragging.value = false;
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  progress.value = percentage * 100;
};

const toggleFollowAuthor = async () => {
  if (!video.value) return;
  try {
    if (isFollowingAuthor.value) {
      await api.delete(`/users/${video.value.user.id}/follow`);
      isFollowingAuthor.value = false;
      if (authorStats.value) authorStats.value.followersCount--;
    } else {
      await api.post(`/users/${video.value.user.id}/follow`);
      isFollowingAuthor.value = true;
      if (authorStats.value) authorStats.value.followersCount++;
    }
  } catch (error) {
    console.error("Failed to toggle follow", error);
    alert("Failed to update follow status");
  }
};

const updateLikeState = () => {
  if (!video.value) return;
  likeCount.value = video.value.likes ? video.value.likes.length : 0;
  if (currentUser.value && video.value.likes) {
    isLiked.value = video.value.likes.some(
      (like: any) => like.user && like.user.id === currentUser.value.id
    );
  } else {
    isLiked.value = false;
  }
};

const toggleLike = async () => {
  if (!currentUser.value) {
    alert("Please login to like videos");
    return;
  }
  if (!video.value) return;

  try {
    if (isLiked.value) {
      await api.delete(`/videos/${video.value.id}/like`);
      likeCount.value--;
      isLiked.value = false;
      // Update local video object to reflect change if needed elsewhere
      if (video.value.likes) {
        video.value.likes = video.value.likes.filter(
          (l: any) => l.user.id !== currentUser.value.id
        );
      }
    } else {
      await api.post(`/videos/${video.value.id}/like`);
      likeCount.value++;
      isLiked.value = true;
      // Update local video object
      if (!video.value.likes) video.value.likes = [];
      video.value.likes.push({ user: { id: currentUser.value.id } });
    }
  } catch (error) {
    console.error("Failed to toggle like", error);
  }
};

watch(video, updateLikeState);
</script>

<style scoped>
.text-shadow {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* Custom Range Slider Styling */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

/* Webkit (Chrome, Safari, Edge) */
input[type="range"]::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: transparent; /* Transparent so input background shows through */
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #ffffff;
  margin-top: -4px; /* Center thumb on track */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Firefox */
input[type="range"]::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: transparent;
}

input[type="range"]::-moz-range-thumb {
  height: 12px;
  width: 12px;
  border: none;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>
