<script setup lang="ts">
import AuthForm from '@/components/AuthForm.vue'
import PageLayout from '@/components/PageLayout.vue'
</script>

<template>
  <PageLayout class="flex items-center justify-center px-6 py-12">
    <!-- Auth Form -->
    <div class="relative z-10 w-full max-w-md">
      <AuthForm />
    </div>
  </PageLayout>
</template>

