<script setup lang="ts">
import { AlertDialogAction } from "radix-vue";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AlertDialogAction v-bind="$attrs" :class="cn(buttonVariants(), props.class)">
    <slot />
  </AlertDialogAction>
</template>
