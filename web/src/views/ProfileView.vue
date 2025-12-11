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
          <div
            class="flex items-center gap-1 cursor-pointer hover:underline"
            @click="openFollowingModal"
          >
            <span class="font-bold">{{
              profileUser?.followingCount || 0
            }}</span>
            <span class="text-muted-foreground">Following</span>
          </div>
          <div
            class="flex items-center gap-1 cursor-pointer hover:underline"
            @click="openFollowersModal"
          >
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
            :show-views="isSelf && currentTab === 'works'"
            :show-actions="isSelf && currentTab === 'works'"
            @click="openVideo(video)"
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

    <!-- Old Modals Removed -->
    <!-- Connections Modal (Following & Followers) -->
    <Modal
      :isOpen="showConnectionsModal"
      @close="showConnectionsModal = false"
      :closeOnBackdropClick="true"
    >
      <div class="flex flex-col h-[500px]">
        <!-- Header with Tabs -->
        <div class="flex items-center justify-between border-b pb-4 mb-4">
          <div class="flex gap-6">
            <button
              @click="switchTab('following')"
              class="relative pb-1 transition-all"
              :class="
                activeConnectionTab === 'following'
                  ? 'text-lg font-bold text-foreground'
                  : 'text-base font-medium text-muted-foreground hover:text-foreground'
              "
            >
              Following ({{ followingList.length }})
              <span
                v-if="activeConnectionTab === 'following'"
                class="absolute bottom-0 left-0 h-[2px] w-full bg-primary"
              ></span>
            </button>
            <button
              @click="switchTab('followers')"
              class="relative pb-1 transition-all"
              :class="
                activeConnectionTab === 'followers'
                  ? 'text-lg font-bold text-foreground'
                  : 'text-base font-medium text-muted-foreground hover:text-foreground'
              "
            >
              Followers ({{ followersList.length }})
              <span
                v-if="activeConnectionTab === 'followers'"
                class="absolute bottom-0 left-0 h-[2px] w-full bg-primary"
              ></span>
            </button>
          </div>
        </div>

        <!-- Search and Sort -->
        <div class="flex gap-2 mb-4">
          <Input
            v-model="userListSearch"
            placeholder="Search users..."
            class="flex-1"
          />
          <select
            v-if="activeConnectionTab === 'following'"
            v-model="userListSort"
            class="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="default">Default</option>
            <option value="recent">Recent</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <!-- List Content -->
        <div class="flex-1 overflow-y-auto pr-2">
          <!-- Following List -->
          <div v-if="activeConnectionTab === 'following'" class="space-y-4">
            <div v-if="isFollowingLoading" class="space-y-4">
              <div
                v-for="n in 5"
                :key="n"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <Skeleton class="h-10 w-10 rounded-full" />
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-24" />
                    <Skeleton class="h-3 w-16" />
                  </div>
                </div>
                <Skeleton class="h-8 w-20" />
              </div>
            </div>
            <template v-else>
              <div
                v-for="user in filteredFollowingList"
                :key="user.id"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted"
                  >
                    <img
                      v-if="user.avatar"
                      :src="getAvatarUrl(user.avatar)"
                      class="h-full w-full object-cover"
                    />
                    <span
                      v-else
                      class="text-lg font-bold text-muted-foreground"
                    >
                      {{
                        (user.nickname || user.username)
                          ?.charAt(0)
                          .toUpperCase()
                      }}
                    </span>
                  </div>
                  <div>
                    <div class="font-medium">
                      {{ user.nickname || user.username }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      @{{ user.username }}
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  @click="unfollowUserInList(user)"
                >
                  {{ user.isMutual ? "Mutual Follow" : "Following" }}
                </Button>
              </div>
              <div
                v-if="filteredFollowingList.length === 0"
                class="py-8 text-center text-muted-foreground"
              >
                No users found
              </div>
            </template>
          </div>

          <!-- Followers List -->
          <div v-else class="space-y-4">
            <div v-if="isFollowersLoading" class="space-y-4">
              <div
                v-for="n in 5"
                :key="n"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <Skeleton class="h-10 w-10 rounded-full" />
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-24" />
                    <Skeleton class="h-3 w-16" />
                  </div>
                </div>
                <Skeleton class="h-8 w-20" />
              </div>
            </div>
            <template v-else>
              <div
                v-for="user in filteredFollowersList"
                :key="user.id"
                class="flex items-center justify-between"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted"
                  >
                    <img
                      v-if="user.avatar"
                      :src="getAvatarUrl(user.avatar)"
                      class="h-full w-full object-cover"
                    />
                    <span
                      v-else
                      class="text-lg font-bold text-muted-foreground"
                    >
                      {{
                        (user.nickname || user.username)
                          ?.charAt(0)
                          .toUpperCase()
                      }}
                    </span>
                  </div>
                  <div>
                    <div class="font-medium">
                      {{ user.nickname || user.username }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      @{{ user.username }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Button
                    v-if="user.isMutual"
                    variant="secondary"
                    size="sm"
                    @click="unfollowUserInList(user)"
                  >
                    Mutual Follow
                  </Button>
                  <Button
                    v-else-if="user.isFollowing"
                    variant="secondary"
                    size="sm"
                    @click="unfollowUserInList(user)"
                  >
                    Following
                  </Button>
                  <Button
                    v-else
                    variant="default"
                    size="sm"
                    @click="followUserInList(user)"
                  >
                    Follow Back
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="removeFollower(user.id)"
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div
                v-if="filteredFollowersList.length === 0"
                class="py-8 text-center text-muted-foreground"
              >
                No users found
              </div>
            </template>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Remove Follower Confirmation Modal -->
    <AlertDialog
      :open="showRemoveConfirmModal"
      @update:open="showRemoveConfirmModal = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Follower</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove this follower? They will no longer
            follow you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="showRemoveConfirmModal = false"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction @click="confirmRemoveFollower"
            >Remove</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog
      :open="isDeleteVideoDialogOpen"
      @update:open="isDeleteVideoDialogOpen = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Video</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this video? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteVideoDialogOpen = false"
            >Cancel</AlertDialogCancel
          >
          <AlertDialogAction @click="confirmDeleteVideo"
            >Delete</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Error Alert Dialog -->
    <AlertDialog
      :open="errorDialog.open"
      @update:open="errorDialog.open = $event"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ errorDialog.title }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ errorDialog.message }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction @click="errorDialog.open = false"
            >OK</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import VideoCard from "@/components/VideoCard.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/ui/modal/Modal.vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VIDEO_CATEGORIES } from "@/lib/constants";
import { getAvatarUrl } from "@/lib/utils";

const store = useStore();
const route = useRoute();
const router = useRouter();

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
const videoToDelete = ref<any>(null);
const isDeleteVideoDialogOpen = ref(false);
const editVideoForm = ref({
  id: 0,
  title: "",
  description: "",
  category: "",
});
const categories = VIDEO_CATEGORIES;

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

const openVideo = (video: any) => {
  if (isSelf.value && currentTab.value === "works") {
    router.push({
      path: `/video/${video.id}`,
      query: { showAnalysis: "true" },
    });
  } else {
    router.push(`/video/${video.id}`);
  }
};

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
    showError("Failed to update video");
  }
};

const deleteVideo = (video: any) => {
  videoToDelete.value = video;
  isDeleteVideoDialogOpen.value = true;
};

const confirmDeleteVideo = async () => {
  if (!videoToDelete.value) return;
  try {
    await api.delete(`/videos/${videoToDelete.value.id}`);
    fetchData(); // Refresh data
    videoToDelete.value = null;
    isDeleteVideoDialogOpen.value = false;
  } catch (error) {
    showError("Failed to delete video");
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
    showError("Failed to update follow status");
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
    showError("Failed to update profile");
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
    showError("Failed to upload avatar");
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

const showConnectionsModal = ref(false);
const activeConnectionTab = ref("following"); // 'following' | 'followers'
const followingList = ref<any[]>([]);
const followersList = ref<any[]>([]);
const isFollowingLoading = ref(false);
const isFollowersLoading = ref(false);
const userListSearch = ref("");
const userListSort = ref("default");

const fetchFollowing = async () => {
  if (!profileUser.value) return;
  isFollowingLoading.value = true;
  try {
    const res = await api.get(`/users/${profileUser.value.id}/following`);
    followingList.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    isFollowingLoading.value = false;
  }
};

const fetchFollowers = async () => {
  if (!profileUser.value) return;
  isFollowersLoading.value = true;
  try {
    const res = await api.get(`/users/${profileUser.value.id}/followers`);
    followersList.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    isFollowersLoading.value = false;
  }
};

const openFollowingModal = async () => {
  if (!profileUser.value) return;
  showConnectionsModal.value = true;
  activeConnectionTab.value = "following";
  userListSearch.value = "";
  userListSort.value = "default";
  await fetchFollowing();
  // Also fetch followers to have data ready if user switches tab
  fetchFollowers();
};

const openFollowersModal = async () => {
  if (!profileUser.value) return;
  showConnectionsModal.value = true;
  activeConnectionTab.value = "followers";
  userListSearch.value = "";
  await fetchFollowers();
  // Also fetch following
  fetchFollowing();
};

const switchTab = (tab: string) => {
  activeConnectionTab.value = tab;
  userListSearch.value = "";
  userListSort.value = "default";
};

const followUserInList = async (user: any) => {
  try {
    await api.post(`/users/${user.id}/follow`);
    user.isFollowing = true;
    user.isMutual = true;

    if (isSelf.value) {
      profileUser.value.followingCount++;
      // Add to following list if not present
      if (!followingList.value.find((u) => u.id === user.id)) {
        followingList.value.push({
          ...user,
          isFollowing: true,
          isMutual: true,
        });
      }

      // Update follower list status if exists
      const follower = followersList.value.find((u) => u.id === user.id);
      if (follower) {
        follower.isFollowing = true;
        follower.isMutual = true;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const unfollowUserInList = async (user: any) => {
  try {
    await api.delete(`/users/${user.id}/follow`);
    user.isFollowing = false;
    user.isMutual = false;

    if (isSelf.value) {
      profileUser.value.followingCount--;
      // Remove from following list
      followingList.value = followingList.value.filter((u) => u.id !== user.id);

      // Update follower list status if exists
      const follower = followersList.value.find((u) => u.id === user.id);
      if (follower) {
        follower.isFollowing = false;
        follower.isMutual = false;
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const showRemoveConfirmModal = ref(false);
const followerToRemoveId = ref<number | null>(null);

const removeFollower = (followerId: number) => {
  followerToRemoveId.value = followerId;
  showRemoveConfirmModal.value = true;
};

const confirmRemoveFollower = async () => {
  if (!profileUser.value || !followerToRemoveId.value) return;
  try {
    await api.delete(
      `/users/${profileUser.value.id}/followers/${followerToRemoveId.value}`
    );
    followersList.value = followersList.value.filter(
      (u) => u.id !== followerToRemoveId.value
    );
    profileUser.value.followersCount--;
    showRemoveConfirmModal.value = false;
    followerToRemoveId.value = null;
  } catch (error) {
    console.error(error);
  }
};

const filteredFollowingList = computed(() => {
  let list = [...followingList.value];
  if (userListSearch.value) {
    const q = userListSearch.value.toLowerCase();
    list = list.filter(
      (u) =>
        (u.nickname && u.nickname.toLowerCase().includes(q)) ||
        u.username.toLowerCase().includes(q)
    );
  }
  if (userListSort.value === "recent") {
    list.sort((a, b) => b.id - a.id);
  } else if (userListSort.value === "oldest") {
    list.sort((a, b) => a.id - b.id);
  }
  return list;
});

const filteredFollowersList = computed(() => {
  let list = [...followersList.value];
  if (userListSearch.value) {
    const q = userListSearch.value.toLowerCase();
    list = list.filter(
      (u) =>
        (u.nickname && u.nickname.toLowerCase().includes(q)) ||
        u.username.toLowerCase().includes(q)
    );
  }
  return list;
});
</script>
