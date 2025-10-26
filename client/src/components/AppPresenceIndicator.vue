<template>
  <div class="presence">
    <div class="presence-avatars">
      <div
        v-for="user in onlineUsers"
        :key="user.user_id"
        :title="`${user.profile?.full_name || user.profile?.email} (${user.is_active ? 'active' : 'idle'})`"
        class="avatar-wrapper"
      >
        <div class="avatar" :class="{ inactive: !user.is_active }">
          <img 
            v-if="user.profile?.avatar_url" 
            :src="user.profile.avatar_url" 
            :alt="user.profile?.full_name || user.profile?.email"
            class="avatar-img"
          />
          <span v-else class="avatar-initials">
            {{ getInitials(user.profile?.full_name || user.profile?.email || 'U') }}
          </span>
        </div>
        <div class="activity-indicator" :class="{ active: user.is_active }"></div>
      </div>
    </div>
    <span class="presence-count">{{ onlineUsers.length }} online</span>
  </div>
</template>

<script setup lang="ts">
import type { AppPresence } from '../../../shared/types'

defineProps<{
  onlineUsers: AppPresence[]
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
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: opacity 0.3s;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
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
  font-weight: 500;
}
</style>
