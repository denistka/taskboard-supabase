<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { 
  DeltaTimeCalculator, 
  ParticleManager, 
  WebGLRenderer, 
  initWebGL,
  type AnimationConfig 
} from './index'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const webglSupported = ref(true)  // Start as true to render canvas initially

const deltaTimeCalculator = new DeltaTimeCalculator()
const particleManager = new ParticleManager()
let webglRenderer: WebGLRenderer | null = null
let animationId: number | null = null

const props = withDefaults(defineProps<{ currentSpeed?: number }>(), {
  currentSpeed: 1,
})

const animationConfig = computed((): AnimationConfig => {
      return { opacity: 0.25, scale: 1.4, speed: 1.0 }
})

const backgroundClasses = computed(() => {
      return 'bg-gradient-board-page-light-dark'
})

const brightnessClasses = computed(() => {
      return 'bg-gradient-to-br from-blue-200 via-blue-100 to-green-200 dark:bg-none'
})

const render = (time: number) => {
  if (!webglRenderer || !canvasRef.value) return
  
  const deltaTime = deltaTimeCalculator.getCurrentSpeed()
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

onMounted(() => {
  deltaTimeCalculator.startMagneticSystem()
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
  deltaTimeCalculator.cleanup()
})

watch(
  () => props.currentSpeed,
  (newSpeed) => {
    if (typeof newSpeed === 'number') {
      deltaTimeCalculator.setCurrentSpeed(newSpeed)
    }
  },
  { immediate: true }
)
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
