<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <nav
      class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div class="container flex h-14 items-center">
        <div class="mr-4 hidden md:flex">
          <router-link to="/" class="mr-6 flex items-center space-x-2">
            <span class="hidden font-bold sm:inline-block">TokTik</span>
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
              <button
                @click="logout"
                class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Logout
              </button>
            </template>
          </nav>
        </div>
      </div>
    </nav>
    <main class="container py-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

const store = useStore();
const router = useRouter();

const isAuthenticated = computed(() => store.getters.isAuthenticated);

const logout = () => {
  store.dispatch("logout");
  router.push("/login");
};
</script>
