<script setup lang="ts">
// Features configuration
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
  <!-- Features Grid -->
  <div class="grid md:grid-cols-3 gap-6 mt-12 mb-12">
    <div 
      v-for="feature in features" 
      :key="feature.title"
      class="glass-subtle p-6 rounded-xl hover:border-primary-500/50 transition-all duration-300 hover:scale-105 shadow-lg"
    >
      <div class="text-4xl mb-4">{{ feature.icon }}</div>
      <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{{ feature.title }}</h3>
      <p class="text-gray-600 dark:text-gray-300 text-sm">{{ feature.description }}</p>
    </div>
  </div>
</template>
