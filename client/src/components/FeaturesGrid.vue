<script setup lang="ts">
import FeatureCard from './FeatureCard.vue'

const features = [
  {
    icon: '⚡',
    title: 'Real-Time Sync',
    description: 'See changes instantly as your team collaborates'
  },
  {
    icon: '🎯',
    title: 'Drag & Drop',
    description: 'Intuitive task management with smooth interactions'
  },
  {
    icon: '👥',
    title: 'Team Presence',
    description: "Know who's online and working with you"
  }
]
</script>

<template>
  <div class="grid md:grid-cols-3 gap-6 mt-12 mb-8">
    <FeatureCard
      v-for="feature in features"
      :key="feature.title"
      :icon="feature.icon"
      :title="feature.title"
      :description="feature.description"
    />
  </div>
</template>
