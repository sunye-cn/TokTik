<template>
  <div class="w-full px-4 py-6 space-y-8">
    <!-- Profile Header -->
    <div
      class="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-lg border shadow-sm"
    >
      <div class="relative group">
        <div
          class="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary"
        >
          <img
            v-if="profileUser?.avatar"
            :src="getAvatarUrl(profileUser.avatar)"
            alt="Profile avatar"
            class="h-full w-full object-cover"
          />
          <span v-else class="text-4xl font-bold text-muted-foreground">
            {{
              (profileUser?.nickname || profileUser?.username)
                ?.charAt(0)
                .toUpperCase()
            }}
          </span>
        </div>
        <label
          v-if="isSelf"
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
        <div class="flex flex-col md:flex-row items-center gap-4">
          <div
            v-if="!isEditing"
            class="flex items-center justify-center md:justify-start gap-2"
          >
            <h1 class="text-2xl font-bold">
              {{ profileUser?.nickname || profileUser?.username }}
            </h1>
            <Button
              v-if="isSelf"
              variant="ghost"
              size="sm"
              @click="startEditing"
              >Edit</Button
            >
            <Button
              v-else
              :variant="isFollowing ? 'secondary' : 'default'"
              size="sm"
              @click="toggleFollow"
            >
              {{ isFollowing ? "Unfollow" : "Follow" }}
            </Button>
          </div>
          <div v-else class="flex items-center gap-2">
            <Input v-model="editNickname" class="max-w-[200px]" />
            <Button size="sm" @click="saveProfile">Save</Button>
            <Button variant="ghost" size="sm" @click="cancelEditing"
              >Cancel</Button
            >
          </div>
        </div>

        <div
          class="flex items-center justify-center md:justify-start gap-6 text-sm"
        >
          <div class="flex items-center gap-1">
            <span class="font-bold">{{
              profileUser?.followingCount || 0
            }}</span>
            <span class="text-muted-foreground">Following</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="font-bold">{{
              profileUser?.followersCount || 0
            }}</span>
            <span class="text-muted-foreground">Followers</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="font-bold">{{ profileUser?.totalLikes || 0 }}</span>
            <span class="text-muted-foreground">Likes</span>
          </div>
        </div>

        <p class="text-muted-foreground text-sm">
          Joined {{ formatDate(profileUser?.createdAt) }}
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

    <div v-else class="space-y-8">
      <!-- Videos Grid (Masonry) -->
      <div
        class="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4 space-y-4"
      >
        <div
          v-for="video in visibleVideos"
          :key="video.id"
          class="relative group break-inside-avoid"
        >
          <VideoCard
            :video="video"
            :show-views="isSelf"
            :show-actions="isSelf"
            @click="$router.push(`/video/${video.id}`)"
            @edit="openEditModal"
            @delete="deleteVideo"
          />
        </div>
      </div>

      <!-- Load More Trigger -->
      <div ref="loadMoreTrigger" class="h-10 flex items-center justify-center">
        <div
          v-if="hasMore"
          class="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
        ></div>
        <span
          v-else-if="visibleVideos.length > 0"
          class="text-muted-foreground text-sm"
          >No more videos</span
        >
        <span v-else class="text-muted-foreground text-sm"
          >No videos found</span
        >
      </div>
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
import { ref, onMounted, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import api from "@/services/api";
import VideoCard from "@/components/VideoCard.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VIDEO_CATEGORIES } from "@/lib/constants";
import { getAvatarUrl } from "@/lib/utils";

const store = useStore();
const route = useRoute();

const profileUser = ref<any>(null);
const isFollowing = ref(false);

const currentUser = computed(() => store.getters.currentUser);

const isSelf = computed(() => {
  if (!currentUser.value) return false;
  if (route.params.username) {
    return (
      currentUser.value.username.toLowerCase() ===
      (route.params.username as string).toLowerCase()
    );
  }
  if (route.params.id) {
    return currentUser.value.id === parseInt(route.params.id as string);
  }
  return true; // /profile route
});

const tabs = computed(() => {
  const t = [{ label: "Works", value: "works" }];
  if (isSelf.value) {
    t.push({ label: "Liked", value: "likes" });
  }
  return t;
});

const currentTab = ref("works");
const searchQuery = ref("");
const sortBy = ref("createdAt");

const myVideos = ref<any[]>([]);
const likedVideos = ref<any[]>([]);

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
const categories = VIDEO_CATEGORIES;

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

const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};

const fetchData = async () => {
  isLoading.value = true;
  try {
    // If it's the profile route OR it's the user's own profile page (via username/id)
    if (route.name === "profile" || isSelf.value) {
      const profileRes = await api.get("/users/profile");
      store.commit("update_user", profileRes.data);
      profileUser.value = profileRes.data;
      myVideos.value = profileRes.data.videos || [];
      likedVideos.value = profileRes.data.likedVideos || [];
    } else {
      let userRes;
      if (route.params.username) {
        userRes = await api.get(`/users/u/${route.params.username}`);
      } else if (route.params.id) {
        userRes = await api.get(`/users/${route.params.id}`);
      } else {
        // Fallback or error
        return;
      }
      profileUser.value = userRes.data;
      isFollowing.value = userRes.data.isFollowing;

      // Fetch videos for other user
      const videos = userRes.data.videos || [];
      // Inject user info into videos for VideoCard display
      myVideos.value = videos.map((v: any) => ({
        ...v,
        user: userRes.data,
      }));
      likedVideos.value = []; // Usually can't see other's liked videos
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const toggleFollow = async () => {
  if (!profileUser.value) return;
  try {
    if (isFollowing.value) {
      await api.delete(`/users/${profileUser.value.id}/follow`);
      isFollowing.value = false;
      profileUser.value.followersCount--;
    } else {
      await api.post(`/users/${profileUser.value.id}/follow`);
      isFollowing.value = true;
      profileUser.value.followersCount++;
    }
  } catch (error) {
    console.error("Failed to toggle follow", error);
    alert("Failed to update follow status");
  }
};

const startEditing = () => {
  editNickname.value = profileUser.value.nickname || profileUser.value.username;
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
    profileUser.value = { ...profileUser.value, ...res.data };
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
    profileUser.value = { ...profileUser.value, ...res.data };
  } catch (error) {
    alert("Failed to upload avatar");
  }
};

const isLoading = ref(false);
const displayLimit = ref(12);
const loadMoreTrigger = ref<HTMLElement | null>(null);

const visibleVideos = computed(() => {
  return filteredVideos.value.slice(0, displayLimit.value);
});

const hasMore = computed(() => {
  return visibleVideos.value.length < filteredVideos.value.length;
});

let observer: IntersectionObserver | null = null;

watch(loadMoreTrigger, (el) => {
  if (el && observer) observer.observe(el);
});

watch([currentTab, sortBy, searchQuery], () => {
  displayLimit.value = 12;
});

onMounted(() => {
  fetchData();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value) {
        setTimeout(() => {
          displayLimit.value += 12;
        }, 300);
      }
    },
    { threshold: 0.1 }
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

watch(isSelf, (newVal) => {
  if (newVal) {
    fetchData();
  }
});

watch(() => route.params, fetchData);
</script>
