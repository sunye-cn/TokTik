<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm"
        @click="handleBackdropClick"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative z-50 w-full max-w-lg transform rounded-lg bg-background p-6 shadow-xl transition-all sm:w-full sm:max-w-lg"
      >
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <h3
            v-if="title"
            class="text-lg font-semibold leading-none tracking-tight"
          >
            {{ title }}
          </h3>
          <p v-if="description" class="text-sm text-muted-foreground">
            {{ description }}
          </p>
        </div>

        <div class="py-4">
          <slot></slot>
        </div>

        <div
          v-if="$slots.footer"
          class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
  title?: string;
  description?: string;
  closeOnBackdropClick?: boolean;
}>();

const emit = defineEmits(["close"]);

const handleBackdropClick = () => {
  if (props.closeOnBackdropClick !== false) {
    emit("close");
  }
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .transform,
.modal-leave-active .transform {
  transition: all 0.3s ease;
}

.modal-enter-from .transform,
.modal-leave-to .transform {
  opacity: 0;
  transform: scale(0.95);
}
</style>
