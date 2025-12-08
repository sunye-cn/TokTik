<template>
  <div class="flex min-h-[80vh] items-center justify-center">
    <Card class="mx-auto w-full max-w-[350px]">
      <CardHeader>
        <CardTitle class="text-2xl">Login</CardTitle>
        <CardDescription>Enter your credentials to sign in</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label for="username">Username</Label>
              <Input
                id="username"
                v-model="username"
                placeholder="name"
                type="text"
                autocapitalize="none"
                autocomplete="username"
                autocorrect="off"
              />
            </div>
            <div class="grid gap-2">
              <Label for="password">Password</Label>
              <Input
                id="password"
                v-model="password"
                placeholder="password"
                type="password"
                autocomplete="current-password"
              />
            </div>
            <Button type="submit" :disabled="isLoading" class="w-full">
              <span v-if="isLoading">Loading...</span>
              <span v-else>Sign In</span>
            </Button>
          </div>
        </form>
        <div class="mt-4 text-center text-sm text-muted-foreground">
          <router-link
            to="/register"
            class="underline-offset-4 hover:text-primary hover:underline"
          >
            Don't have an account? Sign Up
          </router-link>
        </div>
        <div class="text-center text-sm text-gray-500 mt-4 space-y-2">
          <div>
            <router-link to="/reset-password" class="hover:underline">
              Forgot Password?
            </router-link>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
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

const username = ref("");
const password = ref("");
const isLoading = ref(false);
const store = useStore();
const router = useRouter();

const handleLogin = async () => {
  isLoading.value = true;
  try {
    await store.dispatch("login", {
      username: username.value,
      password: password.value,
    });
    router.push("/");
  } catch (error: any) {
    console.error("Login error:", error);
    const message = error.response?.data || error.message || "Login failed";
    alert(message);
  } finally {
    isLoading.value = false;
  }
};
</script>
