<template>
  <div class="relative py-14 box-border flex flex-col" style="min-height: calc(100vh - 7rem);">
    
    <!-- Skeleton overlay (показывается при загрузке) -->
    <div v-if="$slots['page-skeleton']" class="absolute inset-0 z-10 px-14">
      <slot name="page-skeleton"></slot>
    </div>

    <!-- Основной контент -->
    <div class="relative z-20 flex flex-col items-center justify-center flex-1">
      <slot name="content"></slot>
    </div>

    <!-- Loading спиннер (поверх всего) -->
    <div v-if="$slots['loading']" class="fixed inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/20 backdrop-blur-sm">
      <div class="pointer-events-auto">
        <slot name="loading"></slot>
      </div>
    </div>
    
  </div>
</template>