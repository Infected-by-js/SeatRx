<script setup lang="ts">
import {ref} from "vue"
import BaseButton from "@/ui/common/base/BaseButton.vue"
import BaseInput from "@/ui/common/base/BaseInput"
import AuthFormLayout from "./AuthFormLayout.vue"

defineProps<{username: string}>()
const emit = defineEmits<{recoveryAccess: [void]; submit: [code: string]; back: [void]}>()
const key = ref("")
</script>

<template>
  <AuthFormLayout desc="Enter 6 digits 2FA-Key from your authenticator application" @submit="emit('submit', key)">
    <div class="mb-4 flex flex-col justify-between">
      <span class="text-sm text-content/60">Username</span>
      <span class="truncate text-content">{{ username }}</span>
    </div>

    <BaseInput v-model="key" label="2FA-Key" placeholder="Enter 6 digits 2FA-Key" />

    <BaseButton variant="accent" type="submit" class="mt-2">Login</BaseButton>

    <div class="flex justify-between text-sm">
      <BaseButton type="button" variant="primary" icon="arrow-left" class="w-1/3 justify-start gap-1" class-icon="size-4" @click="emit('back')">
        Back
      </BaseButton>
      <BaseButton type="button" icon="key" class-icon="size-4" class="gap-1" @click="emit('recoveryAccess')">Problem with key? </BaseButton>
    </div>
  </AuthFormLayout>
</template>
