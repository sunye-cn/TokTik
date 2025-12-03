<template>
  <div class="flex min-h-[80vh] items-center justify-center">
    <Card class="mx-auto w-full max-w-[450px]">
      <CardHeader>
        <CardTitle class="text-2xl">Upload Video</CardTitle>
        <CardDescription>Share your moments with the world</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleUpload">
          <div class="grid gap-4">
            <div class="grid gap-2">
              <Label for="title">Title</Label>
              <Input
                id="title"
                v-model="title"
                placeholder="Video title"
                type="text"
              />
            </div>
            <div class="grid gap-2">
              <Label for="description">Description</Label>
              <Textarea
                id="description"
                v-model="description"
                placeholder="Video description"
              />
            </div>
            <div class="grid gap-2">
              <Label for="video">Video File</Label>
              <Input
                id="video"
                @change="handleFileChange"
                type="file"
                accept="video/*"
                class="cursor-pointer"
              />
            </div>
            <Button type="submit" :disabled="isLoading || !file" class="w-full">
              <span v-if="isLoading">Uploading...</span>
              <span v-else>Upload</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import api from "../services/api";
import { useRouter } from "vue-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const title = ref("");
const description = ref("");
const file = ref<File | null>(null);
const isLoading = ref(false);
const router = useRouter();

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0];
  }
};

const handleUpload = async () => {
  if (!file.value) return;

  isLoading.value = true;
  const formData = new FormData();
  formData.append("title", title.value);
  formData.append("description", description.value);
  formData.append("video", file.value);

  try {
    await api.post("/videos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    router.push("/");
  } catch (error) {
    alert("Upload failed");
  } finally {
    isLoading.value = false;
  }
};
</script>
