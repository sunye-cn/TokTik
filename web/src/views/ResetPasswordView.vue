<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your username and new password</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="username">Username</Label>
            <Input
              id="username"
              v-model="username"
              placeholder="Enter your username"
            />
          </div>
          <div class="space-y-2">
            <Label for="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              v-model="newPassword"
              placeholder="Enter new password"
            />
          </div>
          <Button
            class="w-full"
            @click="handleResetPassword"
            :disabled="isLoading"
          >
            {{ isLoading ? "Saving..." : "Save New Password" }}
          </Button>
          <div class="text-center text-sm text-gray-500 mt-4">
            <router-link to="/login" class="hover:underline">
              Back to Login
            </router-link>
          </div>
        </div>
      </CardContent>
    </Card>

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
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const username = ref("");
const newPassword = ref("");
const isLoading = ref(false);
const router = useRouter();
const store = useStore();

const errorDialog = ref({
  open: false,
  title: "Error",
  message: "",
});

const showError = (message: string, title = "Error") => {
  errorDialog.value = {
    open: true,
    title: title,
    message: message,
  };
};

const handleResetPassword = async () => {
  if (!username.value || !newPassword.value) {
    showError("Please fill in all fields");
    return;
  }

  isLoading.value = true;
  try {
    await store.dispatch("resetPassword", {
      username: username.value,
      newPassword: newPassword.value,
    });
    showError(
      "Password updated successfully! Please login with your new password.",
      "Success"
    );
    router.push("/login");
  } catch (error: any) {
    console.error("Reset password error:", error);
    const message =
      error.response?.data || error.message || "Failed to reset password";
    showError(message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
