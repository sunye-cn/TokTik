<template>
  <div class="flex min-h-[80vh] items-center justify-center">
    <Card class="mx-auto w-full max-w-[350px]">
      <CardHeader>
        <CardTitle class="text-2xl">Create an account</CardTitle>
        <CardDescription
          >Enter your username and password to create an
          account</CardDescription
        >
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleRegister">
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
                autocomplete="new-password"
              />
            </div>
            <Button type="submit" :disabled="isLoading" class="w-full">
              <span v-if="isLoading">Loading...</span>
              <span v-else>Sign Up</span>
            </Button>
          </div>
        </form>
        <div class="mt-4 text-center text-sm text-muted-foreground">
          <router-link
            to="/login"
            class="underline underline-offset-4 hover:text-primary"
          >
            Already have an account? Sign In
          </router-link>
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

const handleRegister = async () => {
  isLoading.value = true;
  try {
    await store.dispatch("register", {
      username: username.value,
      password: password.value,
    });
    // Auto login after register or redirect to login
    await store.dispatch("login", {
      username: username.value,
      password: password.value,
    });
    router.push("/");
  } catch (error: any) {
    console.error("Registration error:", error);
    const message =
      error.response?.data || error.message || "Registration failed";
    alert(message);
  } finally {
    isLoading.value = false;
  }
};
</script>
