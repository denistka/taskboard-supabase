<template>
  <div class="presence">
    <div class="presence-avatars">
      <div
        v-for="user in activeUsers"
        :key="user.user_id"
        :title="`${user.profile?.full_name || user.profile?.email} (${user.is_active ? 'active' : 'inactive'})`"
        class="avatar-wrapper"
      >
        <div class="avatar" :class="{ inactive: !user.is_active }">
          {{ getInitials(user.profile?.full_name || user.profile?.email || 'U') }}
        </div>
        <div class="activity-indicator" :class="{ active: user.is_active }"></div>
      </div>
    </div>
    <span class="presence-count">{{ activeUsers.length }} online</span>
  </div>
</template>

<script setup lang="ts">
import type { UserPresence } from '../../../shared/types'

defineProps<{
  activeUsers: UserPresence[]
}>()

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<style scoped>
.presence {
  display: flex;
  align-items: center;
  gap: 12px;
}

.presence-avatars {
  display: flex;
  gap: 8px;
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: opacity 0.3s;
}

.avatar.inactive {
  opacity: 0.5;
}

.activity-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9ca3af;
  border: 2px solid white;
  transition: background 0.3s;
}

.activity-indicator.active {
  background: #10b981;
}

.presence-count {
  font-size: 14px;
  color: #6b7280;
}
</style>
