<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <nav
      class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="w-full px-6 flex h-14 items-center">
        <div class="mr-4 flex">
          <router-link to="/" class="mr-6 flex items-center space-x-2">
            <span class="font-bold inline-block">TokTik</span>
          </router-link>
          <nav class="flex items-center space-x-6 text-sm font-medium">
            <router-link
              to="/"
              class="transition-colors hover:text-foreground/80 text-foreground/60"
              >Home</router-link
            >
            <router-link
              v-if="isAuthenticated"
              to="/upload"
              class="transition-colors hover:text-foreground/80 text-foreground/60"
              >Upload</router-link
            >
          </nav>
        </div>
        <div
          class="flex flex-1 items-center justify-between space-x-2 md:justify-end"
        >
          <div class="w-full flex-1 md:w-auto md:flex-none">
            <!-- Search could go here -->
          </div>
          <nav class="flex items-center space-x-2">
            <template v-if="!isAuthenticated">
              <router-link
                to="/login"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                Login
              </router-link>
            </template>
            <template v-else>
              <div class="relative group">
                <button class="flex items-center gap-2 focus:outline-none">
                  <div
                    class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border"
                  >
                    <img
                      v-if="currentUser?.avatar"
                      :src="`http://localhost:3000/${currentUser.avatar}`"
                      class="h-full w-full object-cover"
                    />
                    <span v-else class="text-xs font-bold text-primary">{{
                      currentUser?.username?.charAt(0).toUpperCase()
                    }}</span>
                  </div>
                </button>

                <!-- Dropdown -->
                <div
                  class="absolute right-0 mt-2 w-48 bg-popover border rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
                >
                  <router-link
                    to="/profile"
                    class="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    My Profile
                  </router-link>
                  <button
                    @click="confirmLogout"
                    class="block w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-destructive"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </template>
          </nav>
        </div>
      </div>
    </nav>
    <main class="w-full px-6 py-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();

const isAuthenticated = computed(() => store.getters.isAuthenticated);
const currentUser = computed(() => store.getters.currentUser);

onMounted(() => {
  if (isAuthenticated.value) {
    store.dispatch("fetchProfile");
  }
});

const confirmLogout = () => {
  if (confirm("Are you sure you want to logout?")) {
    store.dispatch("logout");
    router.push("/login");
  }
};
</script>
