<template>
  <div class="min-h-screen bg-background font-sans antialiased">
    <nav class="sticky top-0 z-40 w-full border-b bg-background">
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
              <router-link to="/login">
                <Button>Login</Button>
              </router-link>
            </template>
            <template v-else>
              <div class="relative group">
                <button class="flex items-center gap-2 focus:outline-none">
                  <div
                    class="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border"
                  >
                    <img
                      v-if="currentUser?.avatar"
                      :src="getAvatarUrl(currentUser.avatar)"
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
                  <template v-if="!isProfilePage">
                    <router-link
                      to="/profile"
                      class="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      My Profile
                    </router-link>
                    <button
                      @click="openLogoutModal"
                      class="block w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-destructive"
                    >
                      Logout
                    </button>
                  </template>
                  <template v-else>
                    <button
                      @click="openDeleteNoticeModal"
                      class="block w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      Delete Account
                    </button>
                    <button
                      @click="openLogoutModal"
                      class="block w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-destructive"
                    >
                      Logout
                    </button>
                  </template>
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

    <!-- Logout Confirmation Modal -->
    <Modal
      :isOpen="showLogoutModal"
      title="Confirm Logout"
      description="Are you sure you want to logout?"
      @close="showLogoutModal = false"
    >
      <template #footer>
        <Button variant="outline" @click="showLogoutModal = false">
          Cancel
        </Button>
        <Button variant="destructive" @click="handleLogout">Logout</Button>
      </template>
    </Modal>

    <!-- Delete Account Notice Modal -->
    <Modal
      :isOpen="showDeleteNoticeModal"
      title="Account Deletion Notice"
      @close="showDeleteNoticeModal = false"
    >
      <div
        class="text-sm text-muted-foreground space-y-4 text-left max-h-[60vh] overflow-y-auto"
      >
        <p>
          To ensure the security of your account, the following conditions must
          be met before your deletion request takes effect:
        </p>
        <ol class="list-decimal list-inside space-y-2">
          <li>Account security verification required.</li>
          <li>
            <strong>Account assets settled and transactions completed</strong
            ><br />
            All assets and expected earnings (including cash, coins, coupons,
            etc.) and rights (including membership) under the account have been
            settled, refunded, cleared, or voluntarily forfeited. All
            transactions have been completed or voluntarily forfeited. Payment
            accounts have been cancelled.
          </li>
          <li>
            <strong>Account authorizations and bindings released</strong><br />
            The account has released authorizations or bindings with other
            accounts (including enterprise accounts, employee accounts, etc.)
            and third-party products/platforms. There are no unfinished or
            disputed contents in related services accessed through this account.
          </li>
          <li>
            <strong>No account disputes</strong><br />
            Including but not limited to complaints or reports, services have
            been completed or voluntarily forfeited.
          </li>
        </ol>
        <div class="flex items-center space-x-2 pt-4">
          <input
            type="checkbox"
            id="agreeDelete"
            v-model="deleteAgreed"
            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label
            for="agreeDelete"
            class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and agree to the TokTik Account Deletion Notice
          </label>
        </div>
      </div>
      <template #footer>
        <Button :disabled="!deleteAgreed" @click="handleDeleteNoticeNext">
          Next
        </Button>
      </template>
    </Modal>

    <!-- Delete Account Confirmation Modal -->
    <Modal
      :isOpen="showDeleteConfirmModal"
      title="Confirm Deletion"
      description="Are you sure you want to delete your account? This action cannot be undone."
      @close="showDeleteConfirmModal = false"
    >
      <template #footer>
        <Button variant="outline" @click="showDeleteConfirmModal = false">
          Cancel
        </Button>
        <Button variant="destructive" @click="handleDeleteConfirm">
          Confirm
        </Button>
      </template>
    </Modal>

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
import { computed, ref, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import { getAvatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal/Modal.vue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from "@/services/api";

const store = useStore();
const router = useRouter();
const route = useRoute();

const isAuthenticated = computed(() => store.getters.isAuthenticated);
const currentUser = computed(() => store.getters.currentUser);
const isProfilePage = computed(() => route.path === "/profile");

const showLogoutModal = ref(false);
const showDeleteNoticeModal = ref(false);
const showDeleteConfirmModal = ref(false);
const deleteAgreed = ref(false);

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

onMounted(() => {
  if (isAuthenticated.value) {
    store.dispatch("fetchProfile");
  }
});

const openLogoutModal = () => {
  showLogoutModal.value = true;
};

const handleLogout = () => {
  store.dispatch("logout");
  showLogoutModal.value = false;
  router.push("/login");
};

const openDeleteNoticeModal = () => {
  deleteAgreed.value = false;
  showDeleteNoticeModal.value = true;
};

const handleDeleteNoticeNext = () => {
  showDeleteNoticeModal.value = false;
  showDeleteConfirmModal.value = true;
};

const handleDeleteConfirm = async () => {
  try {
    await api.delete("/users/profile");
    store.dispatch("logout");
    showDeleteConfirmModal.value = false;
    router.push("/login");
  } catch (error) {
    console.error("Failed to delete account:", error);
    showError("Failed to delete account. Please try again.");
  }
};
</script>
