<script setup lang="ts">
import { AlertDialogCancel } from "radix-vue";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <AlertDialogCancel
    v-bind="$attrs"
    :class="
      cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', props.class)
    "
  >
    <slot />
  </AlertDialogCancel>
</template>
