<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const webglSupported = ref(true)  // Start as true to render canvas initially

const currentPage = computed(() => route.name as string)
const routerNavigating = ref(false)

const deltaTimeCalculator = new DeltaTimeCalculator()
const particleManager = new ParticleManager()
let webglRenderer: WebGLRenderer | null = null
let animationId: number | null = null

const animationConfig = computed((): AnimationConfig => {
  switch (currentPage.value) {
    case 'home':
    case 'welcome':
      return { opacity: 0.3, scale: 1.4, speed: 1.0 }
    case 'login':
      return { opacity: 0.15, scale: 1.0, speed: 1.0 }
    case 'boards':
    case 'board':
      return { opacity: 0.25, scale: 1.4, speed: 1.0 }
    default:
      return { opacity: 0.3, scale: 1.2, speed: 1.0 }
  }
})

const backgroundClasses = computed(() => {
  switch (currentPage.value) {
    case 'home':
    case 'welcome':
      return 'bg-gradient-home-page-light-dark'
    case 'login':
      return 'bg-gradient-auth-page-light-dark'
    case 'boards':
    case 'board':
      return 'bg-gradient-board-page-light-dark'
    default:
      return 'bg-gradient-home-page-light-dark'
  }
})

const brightnessClasses = computed(() => {
  switch (currentPage.value) {
    case 'home':
    case 'welcome':
    case 'login':
    case 'boards':
    case 'board':
      return 'bg-gradient-to-br from-blue-200 via-blue-100 to-green-200 dark:bg-none'
    default:
      return 'bg-gradient-to-br from-blue-200 via-blue-100 to-green-200 dark:bg-none'
  }
})

const render = (time: number) => {
  if (!webglRenderer || !canvasRef.value) return
  
  const deltaTime = deltaTimeCalculator.calculateDeltaTime(routerNavigating, 0)
  particleManager.updateParticles(deltaTime)
  
  webglRenderer.render(time, particleManager.getParticles(), animationConfig.value)
  
  animationId = requestAnimationFrame(render)
}

const startAnimation = () => {
  if (!canvasRef.value) return
  
  const { gl, program } = initWebGL(canvasRef.value)
  if (!gl || !program) {
    webglSupported.value = false
    return
  }
  
  webglSupported.value = true
  webglRenderer = new WebGLRenderer(gl, program)
  particleManager.initParticles(100)
  render(0)
}

const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

router.beforeEach((_to, _from, next) => {
  routerNavigating.value = true
  next()
})

router.afterEach(() => {
  routerNavigating.value = false
  deltaTimeCalculator.startRouterEndCountdown(0)
})

onMounted(() => {
  deltaTimeCalculator.startMagneticSystem()
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
  deltaTimeCalculator.cleanup()
})
</script>

<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none" :class="backgroundClasses">
    <div class="absolute inset-0 opacity-50" :class="brightnessClasses"></div>
    <canvas
      v-if="webglSupported"
      ref="canvasRef"
      class="w-full h-full"
    ></canvas>
  </div>
</template>
