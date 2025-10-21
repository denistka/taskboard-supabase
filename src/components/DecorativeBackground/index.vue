<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePresenceStore } from '@/stores/presence'
import { 
  DeltaTimeCalculator, 
  ParticleManager, 
  WebGLRenderer, 
  initWebGL,
  type AnimationConfig 
} from './index'

const route = useRoute()
const router = useRouter()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const presenceStore = usePresenceStore()

// Get current page name
const currentPage = computed(() => route.name as string)

// Track router navigation state for deltaTime calculation
const routerNavigating = ref(false)

// Initialize managers
const deltaTimeCalculator = new DeltaTimeCalculator()
const particleManager = new ParticleManager()
let webglRenderer: WebGLRenderer | null = null

// Magnetic Speed System - Easy to extend with new triggers:
// deltaTimeCalculator.triggerSpeedBoost(2.0)     // 2x speed boost
// deltaTimeCalculator.triggerSpeedSlowdown(0.5)   // Half speed
// deltaTimeCalculator.resetToMagneticSpeed()      // Back to 0.01 base speed
//
// Presence data is now handled in this component and passed to DeltaTimeCalculator
// This provides better separation of concerns and makes the system more modular

// Animation state
let animationId: number | null = null

// Animation configuration based on page - magnetic speed system handles speed
const animationConfig = computed((): AnimationConfig => {
  switch (currentPage.value) {
    case 'home':
      return { opacity: 0.3, scale: 1.4, speed: 1.0 } // Magnetic speed system controls actual speed
    case 'auth':
      return { opacity: 0.15, scale: 1.0, speed: 1.0 } // Magnetic speed system controls actual speed
    case 'board':
      return { opacity: 0.25, scale: 1.4, speed: 1.0 } // Magnetic speed system controls actual speed
    default:
      return { opacity: 0.3, scale: 1.2, speed: 1.0 }
  }
})

// Background styling based on page
const backgroundClasses = computed(() => {
  switch (currentPage.value) {
    case 'home':
      return 'bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950'
    case 'auth':
      return 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100 dark:from-slate-950 dark:via-gray-900 dark:to-zinc-950'
    case 'board':
      return 'bg-gradient-to-br from-primary-75 via-accent-75 to-primary-125 dark:from-gray-1000 dark:via-gray-800 dark:to-gray-900'
    default:
      return 'bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950'
  }
})

// Brightness adjustment classes for light and dark themes
const brightnessClasses = computed(() => {
  switch (currentPage.value) {
    case 'home':
      return 'bg-gradient-to-br from-blue-200 via-blue-100 to-green-200 dark:bg-none'
    case 'auth':
      return 'bg-gradient-to-br from-blue-200 via-blue-100 to-green-200 dark:bg-none'
    case 'board':
      return 'bg-gradient-to-br from-blue-200 via-blue-100 to-green-200 dark:bg-none'
    default:
      return 'bg-gradient-to-br from-blue-200 via-blue-100 to-green-200 dark:bg-none'
  }
})

// Render particles
const render = (time: number) => {
  if (!webglRenderer || !canvasRef.value) return
  
  // Get presence event count from store
  const presenceEventCount = presenceStore.getPresenceEventCount(1000)
  
  // Update particles with dynamic timing
  const deltaTime = deltaTimeCalculator.calculateDeltaTime(routerNavigating, presenceEventCount)
  particleManager.updateParticles(deltaTime)
  
  // Render particles
  webglRenderer.render(time, particleManager.getParticles(), animationConfig.value)
  
  animationId = requestAnimationFrame(render)
}

// Start animation
const startAnimation = () => {
  if (!canvasRef.value) return
  
  const { gl, program } = initWebGL(canvasRef.value)
  if (!gl || !program) return
  
  webglRenderer = new WebGLRenderer(gl, program)
  particleManager.initParticles(100)
  render(0)
}

// Stop animation
const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// Router navigation guards
router.beforeEach((_to, _from, next) => {
  routerNavigating.value = true // Router start event
  next()
})

router.afterEach((_to, _from) => {
  routerNavigating.value = false // Router end event
  const presenceEventCount = presenceStore.getPresenceEventCount(5000)
  deltaTimeCalculator.startRouterEndCountdown(presenceEventCount)
})

// Lifecycle hooks
onMounted(() => {
  deltaTimeCalculator.startMagneticSystem() // Start the magnetic speed system
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
  deltaTimeCalculator.cleanup()
})
</script>

<template>
  <!-- Background with WebGL Canvas for Decorative Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none" :class="backgroundClasses">
      <div class="absolute inset-0 opacity-50" :class="brightnessClasses"></div>
    <canvas
      ref="canvasRef"
      class="w-full h-full"
      :style="{ filter: 'blur(3px)' }"
    ></canvas>
  </div>
</template>

<style scoped>
canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
