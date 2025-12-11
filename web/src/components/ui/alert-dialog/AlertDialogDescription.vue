<script setup lang="ts">
import { AlertDialogDescription } from "radix-vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AlertDialogDescription
    v-bind="$attrs"
    :class="cn('text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
