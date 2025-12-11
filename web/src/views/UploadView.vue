<template>
  <div class="flex min-h-[80vh] items-center justify-center">
    <Card class="mx-auto w-full max-w-[450px]">
      <CardHeader>
        <CardTitle class="text-2xl">Upload Video</CardTitle>
        <CardDescription>Share your moments with the world</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex space-x-2 mb-6">
          <Button
            type="button"
            variant="outline"
            :class="{ 'bg-primary text-primary-foreground': !isRecordingMode }"
            @click="toggleMode('upload')"
            class="flex-1"
          >
            Upload File
          </Button>
          <Button
            type="button"
            variant="outline"
            :class="{ 'bg-primary text-primary-foreground': isRecordingMode }"
            @click="toggleMode('record')"
            class="flex-1"
          >
            Record Video
          </Button>
        </div>

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
              <Label for="category">Category</Label>
              <select
                id="category"
                v-model="category"
                class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select a category</option>
                <option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </div>
            <div class="grid gap-2">
              <Label for="description">Description</Label>
              <Textarea
                id="description"
                v-model="description"
                placeholder="Video description"
              />
            </div>

            <div v-if="!isRecordingMode" class="grid gap-2">
              <Label for="video">Video File</Label>
              <Input
                id="video"
                @change="handleFileChange"
                type="file"
                accept="video/*"
                class="cursor-pointer"
              />
            </div>

            <div v-else class="grid gap-2">
              <Label>Record Video</Label>
              <div
                class="relative aspect-video overflow-hidden rounded-lg bg-black"
              >
                <video
                  v-if="!recordedUrl"
                  ref="videoPreview"
                  autoplay
                  muted
                  playsinline
                  class="h-full w-full object-cover"
                  style="transform: scaleX(-1)"
                ></video>
                <video
                  v-else
                  :src="recordedUrl"
                  controls
                  class="h-full w-full object-contain"
                ></video>

                <div
                  v-if="!recordedUrl"
                  class="absolute bottom-4 left-0 right-0 flex justify-center space-x-4"
                >
                  <Button
                    v-if="!isRecording"
                    type="button"
                    @click="startRecording"
                    :disabled="!isCameraReady"
                    variant="destructive"
                  >
                    Start Recording
                  </Button>
                  <Button
                    v-else
                    type="button"
                    @click="stopRecording"
                    variant="destructive"
                    class="animate-pulse"
                  >
                    Stop Recording
                  </Button>
                </div>
              </div>
              <div v-if="recordedUrl" class="flex justify-end">
                <Button type="button" variant="outline" @click="retake">
                  Retake
                </Button>
              </div>
            </div>

            <Button type="submit" :disabled="isLoading || !file" class="w-full">
              <span v-if="isLoading">Uploading...</span>
              <span v-else>Upload</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <AlertDialog v-model:open="errorDialog.open" class="z-50">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ errorDialog.title }}</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          {{ errorDialog.message }}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel @click="errorDialog.open = false" class="w-full">
            Close
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VIDEO_CATEGORIES } from "@/lib/constants";

const title = ref("");
const description = ref("");
const category = ref("");
const categories = VIDEO_CATEGORIES;
const file = ref<File | null>(null);
const isLoading = ref(false);
const router = useRouter();

// Recording state
const isRecordingMode = ref(false);
const isRecording = ref(false);
const isCameraReady = ref(false);
const recordedUrl = ref<string | null>(null);
const videoPreview = ref<HTMLVideoElement | null>(null);
let stream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

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

const startCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError(
      "Browser API not supported. Please use a modern browser or ensure you are using HTTPS or localhost."
    );
    return;
  }
  try {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch (err) {
      console.warn("Failed to get camera+audio, trying camera only...", err);
      // Fallback: Try video only (maybe microphone is missing or blocked)
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      // If successful, warn the user
      showError("Microphone access failed. Recording video only.");
    }

    if (videoPreview.value) {
      videoPreview.value.srcObject = stream;
    }
    isCameraReady.value = true;
  } catch (err: any) {
    console.error("Error accessing media devices:", err);
    let msg = "Could not access camera/microphone.";
    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      msg =
        "Permission denied. Please check browser settings and ensure camera is not blocked.";
    } else if (
      err.name === "NotFoundError" ||
      err.name === "DevicesNotFoundError"
    ) {
      msg = "No camera found. Please check your devices.";
    } else if (
      err.name === "NotReadableError" ||
      err.name === "TrackStartError"
    ) {
      msg =
        "Camera is already in use by another application (e.g., Zoom, Teams).";
    } else {
      msg += " Please ensure permissions are granted.";
    }
    // Add technical details for debugging
    msg += ` (${err.name}: ${err.message})`;
    showError(msg);
  }
};

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  isCameraReady.value = false;
  if (videoPreview.value) {
    videoPreview.value.srcObject = null;
  }
};

const startRecording = () => {
  if (!stream) return;
  chunks = [];
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    recordedUrl.value = URL.createObjectURL(blob);
    // Create a File object to mimic file upload
    file.value = new File([blob], "recorded-video.webm", {
      type: "video/webm",
    });
  };
  mediaRecorder.start();
  isRecording.value = true;
};

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
    stopCamera(); // Stop camera after recording to show preview
  }
};

const retake = () => {
  if (recordedUrl.value) {
    URL.revokeObjectURL(recordedUrl.value);
  }
  recordedUrl.value = null;
  file.value = null;
  startCamera();
};

const toggleMode = (mode: "upload" | "record") => {
  if (mode === "record") {
    isRecordingMode.value = true;
    file.value = null; // Clear file when switching to record
    startCamera();
  } else {
    isRecordingMode.value = false;
    stopCamera();
    if (recordedUrl.value) {
      URL.revokeObjectURL(recordedUrl.value);
    }
    recordedUrl.value = null;
    file.value = null;
  }
};

onUnmounted(() => {
  stopCamera();
  if (recordedUrl.value) {
    URL.revokeObjectURL(recordedUrl.value);
  }
});

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
  formData.append("category", category.value);
  formData.append("video", file.value);

  try {
    await api.post("/videos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    router.push("/");
  } catch (error) {
    showError("Upload failed");
  } finally {
    isLoading.value = false;
  }
};
</script>
