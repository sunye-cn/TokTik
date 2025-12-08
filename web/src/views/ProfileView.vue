<template>
  <div class="container py-6 space-y-8">
    <!-- Profile Header -->
    <div
      class="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-lg border shadow-sm"
    >
      <div class="relative group">
        <div
          class="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary"
        >
          <img
            v-if="user?.avatar"
            :src="avatarUrl"
            class="h-full w-full object-cover"
          />
          <span v-else class="text-4xl font-bold text-muted-foreground">{{
            (user?.nickname || user?.username)?.charAt(0).toUpperCase()
          }}</span>
        </div>
        <label
          class="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity"
        >
          <span class="text-xs">Change</span>
          <input
            type="file"
            class="hidden"
            accept="image/*"
            @change="handleAvatarUpload"
          />
        </label>
      </div>

      <div class="flex-1 text-center md:text-left space-y-2">
        <div
          v-if="!isEditing"
          class="flex items-center justify-center md:justify-start gap-2"
        >
          <h1 class="text-2xl font-bold">
            {{ user?.nickname || user?.username }}
          </h1>
          <Button variant="ghost" size="sm" @click="startEditing">Edit</Button>
        </div>
        <div v-else class="flex items-center gap-2">
          <Input v-model="editNickname" class="max-w-[200px]" />
          <Button size="sm" @click="saveProfile">Save</Button>
          <Button variant="ghost" size="sm" @click="cancelEditing"
            >Cancel</Button
          >
        </div>
        <p class="text-muted-foreground text-sm">
          Joined {{ formatDate(user?.createdAt) }}
        </p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex space-x-4 border-b">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="currentTab = tab.value"
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2"
        :class="
          currentTab === tab.value
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Search and Sort -->
    <div class="flex flex-wrap gap-4 items-center justify-between">
      <div class="relative">
        <Input
          v-model="searchQuery"
          placeholder="Search videos..."
          class="w-[200px] md:w-[300px]"
        />
      </div>
      <select
        v-model="sortBy"
        class="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="createdAt">Latest</option>
        <option value="views">Most Viewed</option>
        <option value="likes">Most Liked</option>
      </select>
    </div>

    <!-- Content -->
    <div v-if="currentTab === 'works'" class="space-y-8">
      <!-- Stats Dashboard -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card v-for="stat in dashboardStats" :key="stat.label">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-muted-foreground">{{
              stat.label
            }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stat.value }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- Videos Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <div
          v-for="video in filteredVideos"
          :key="video.id"
          class="relative group"
        >
          <VideoCard
            :video="video"
            :show-views="true"
            :show-actions="true"
            @click="$router.push(`/video/${video.id}`)"
            @edit="openEditModal"
            @delete="deleteVideo"
          />
        </div>
      </div>
    </div>

    <div
      v-else-if="currentTab === 'likes'"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <VideoCard
        v-for="video in filteredVideos"
        :key="video.id"
        :video="video"
        :show-views="true"
        :show-actions="false"
        @click="$router.push(`/video/${video.id}`)"
      />
    </div>

    <!-- Edit Video Modal -->
    <div
      v-if="isVideoEditing"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <Card class="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Video</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Title</Label>
            <Input v-model="editVideoForm.title" />
          </div>
          <div class="space-y-2">
            <Label>Category</Label>
            <select
              v-model="editVideoForm.category"
              class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <Label>Description</Label>
            <Textarea v-model="editVideoForm.description" />
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="ghost" @click="isVideoEditing = false"
              >Cancel</Button
            >
            <Button @click="saveVideoEdit">Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import api from "@/services/api";
import VideoCard from "@/components/VideoCard.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const store = useStore();
const user = computed(() => store.state.user);
const avatarUrl = computed(() =>
  user.value?.avatar ? `http://localhost:3000/${user.value.avatar}` : ""
);

const tabs = [
  { label: "My Works", value: "works" },
  { label: "Liked", value: "likes" },
];
const currentTab = ref("works");
const searchQuery = ref("");
const sortBy = ref("createdAt");

const myVideos = ref<any[]>([]);
const likedVideos = ref<any[]>([]);
const stats = ref<any[]>([]);

const isEditing = ref(false);
const editNickname = ref("");

// Video Editing State
const isVideoEditing = ref(false);
const editVideoForm = ref({
  id: 0,
  title: "",
  description: "",
  category: "",
});
const categories = [
  "Music",
  "Dance",
  "Gaming",
  "Comedy",
  "Food",
  "Sports",
  "Other",
];

const openEditModal = (video: any) => {
  editVideoForm.value = {
    id: video.id,
    title: video.title,
    description: video.description,
    category: video.category,
  };
  isVideoEditing.value = true;
};

const saveVideoEdit = async () => {
  try {
    await api.patch(`/videos/${editVideoForm.value.id}`, {
      title: editVideoForm.value.title,
      description: editVideoForm.value.description,
      category: editVideoForm.value.category,
    });
    isVideoEditing.value = false;
    fetchData(); // Refresh data
  } catch (error) {
    alert("Failed to update video");
  }
};

const deleteVideo = async (video: any) => {
  if (!confirm("Are you sure you want to delete this video?")) return;
  try {
    await api.delete(`/videos/${video.id}`);
    fetchData(); // Refresh data
  } catch (error) {
    alert("Failed to delete video");
  }
};

const filteredVideos = computed(() => {
  let videos =
    currentTab.value === "works" ? [...myVideos.value] : [...likedVideos.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    videos = videos.filter(
      (v) =>
        v.title.toLowerCase().includes(query) ||
        (v.description && v.description.toLowerCase().includes(query)) ||
        (v.category && v.category.toLowerCase().includes(query))
    );
  }

  videos.sort((a, b) => {
    if (sortBy.value === "views") {
      return (b.views || 0) - (a.views || 0);
    } else if (sortBy.value === "likes") {
      // Assuming likes is an array or count. If array:
      const likesA = Array.isArray(a.likes) ? a.likes.length : a.likes || 0;
      const likesB = Array.isArray(b.likes) ? b.likes.length : b.likes || 0;
      return likesB - likesA;
    } else {
      // createdAt
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return videos;
});

const dashboardStats = computed(() => {
  const totalViews = stats.value.reduce(
    (acc, curr) => acc + (curr.views || 0),
    0
  );
  const totalLikes = stats.value.reduce(
    (acc, curr) => acc + (curr.likes || 0),
    0
  );
  const totalComments = stats.value.reduce(
    (acc, curr) => acc + (curr.comments || 0),
    0
  );
  const totalDanmakus = stats.value.reduce(
    (acc, curr) => acc + (curr.danmakus || 0),
    0
  );

  return [
    { label: "Total Views", value: totalViews },
    { label: "Total Likes", value: totalLikes },
    { label: "Total Comments", value: totalComments },
    { label: "Total Danmakus", value: totalDanmakus },
  ];
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

const fetchData = async () => {
  try {
    const profileRes = await api.get("/users/profile");
    store.commit("update_user", profileRes.data);
    myVideos.value = profileRes.data.videos;
    likedVideos.value = profileRes.data.likedVideos;

    const statsRes = await api.get("/users/stats");
    stats.value = statsRes.data;
  } catch (error) {
    console.error(error);
  }
};

const startEditing = () => {
  editNickname.value = user.value.nickname || user.value.username;
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
};

const saveProfile = async () => {
  try {
    const res = await api.patch("/users/profile", {
      nickname: editNickname.value,
    });
    store.commit("update_user", res.data);
    isEditing.value = false;
  } catch (error) {
    alert("Failed to update profile");
  }
};

const handleAvatarUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await api.patch("/users/profile", formData);
    store.commit("update_user", res.data);
  } catch (error) {
    alert("Failed to upload avatar");
  }
};

onMounted(() => {
  fetchData();
});
</script>
