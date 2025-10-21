<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Get current page name
const currentPage = computed(() => route.name as string)

// WebGL context and shader program
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let animationId: number | null = null
let particles: Particle[] = []

// Particle class
class Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: [number, number, number, number]
  life: number
  maxLife: number
  angle: number
  distance: number
  pattern: 'orbit' | 'drift' | 'float'
  speed: number
  phase: number

  constructor(
    x: number, 
    y: number, 
    color: [number, number, number, number], 
    pattern: 'orbit' | 'drift' | 'float',
    speed: number = 1
  ) {
    this.x = x
    this.y = y
    this.vx = 0
    this.vy = 0
    this.size = 120 + Math.random() * 80 // Much bigger circles
    this.color = color
    this.life = 0
    this.maxLife = 1
    this.angle = Math.random() * Math.PI * 2
    this.distance = 120 + Math.random() * 180 // Larger orbit radius
    this.pattern = pattern
    this.speed = speed * 0.3 // Slower, more calming speed
    this.phase = Math.random() * Math.PI * 2
  }

  update(deltaTime: number) {
    this.life += deltaTime * this.speed
    this.phase += deltaTime * this.speed * 3.2 // Even slower phase change

    const centerX = 0
    const centerY = 0

    switch (this.pattern) {
      case 'orbit':
        this.angle += deltaTime * this.speed * 0.1 // Much slower orbit
        this.x = centerX + Math.cos(this.angle) * this.distance
        this.y = centerY + Math.sin(this.angle) * this.distance
        break
      
      case 'drift':
        // Very smooth, gentle drift
        this.x += Math.sin(this.life * 0.2) * 1.1
        this.y += Math.cos(this.life * 0.15) * 3.08
        break
      
      case 'float':
        // Smooth figure-8 with larger radius
        this.x = centerX + Math.cos(this.phase) * this.distance * 0.9
        this.y = centerY + Math.sin(this.phase * 0.8) * this.distance * 0.7
        break
    }

    // Random size changes with extremely slow, barely perceptible transitions
    const baseSize = 200 + Math.random() * 20
    const pulseFactor = 0.7 + 0.3 * Math.sin(this.life * 0.2) // Extremely slow pulsing - barely noticeable
    const randomFactor = 0.8 + 0.4 * Math.sin(this.life * 0.1 + this.phase) // Almost imperceptible size variation
    this.size = baseSize * pulseFactor * randomFactor
  }
}

// Color palette for particles
const colorPalette: [number, number, number, number][] = [
  [1.0, 0.8, 0.0, 0.4], // yellow
  [1.0, 0.2, 0.2, 0.4], // red
  [0.2, 0.8, 0.2, 0.4], // green
  [1.0, 0.5, 0.0, 0.4], // orange
  [0.2, 0.4, 1.0, 0.4], // blue
  [0.6, 0.2, 0.8, 0.4], // purple
  [1.0, 0.4, 0.8, 0.4], // pink
  [0.0, 0.8, 0.8, 0.4]  // cyan
]

// Animation configuration based on page - more calming settings
const animationConfig = computed(() => {
  switch (currentPage.value) {
    case 'home':
      return { opacity: 0.3, scale: 1.4, speed: 33.4 } // Bigger, more transparent, slower
    case 'auth':
      return { opacity: 0.15, scale: 1.0, speed: 0.2 } // Very subtle for auth
    case 'board':
      return { opacity: 0.25, scale: 1.4, speed: 10.4 } // Bigger circles for board
    default:
      return { opacity: 0.3, scale: 1.2, speed: 0.05 }
  }
})

// Initialize particles
const initParticles = () => {
  particles = []
  const count = 40
  
  for (let i = 0; i < count; i++) {
    const color = colorPalette[i % colorPalette.length]
    const pattern = i % 3 === 0 ? 'orbit' : i % 3 === 1 ? 'drift' : 'float'
    const speed = 0.03 + Math.random() * 0.02 // Much slower, more consistent speeds
    
    particles.push(new Particle(0, 0, color, pattern, speed))
  }
}

// WebGL shader source code
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute float a_size;
  attribute vec4 a_color;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  
  varying vec4 v_color;
  varying float v_size;
  
  void main() {
    vec2 position = a_position;
    position = position / u_resolution * 2.0 - 1.0;
    position.y *= -1.0;
    
    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = a_size;
    v_color = a_color;
    v_size = a_size;
  }
`

const fragmentShaderSource = `
  precision mediump float;
  
  varying vec4 v_color;
  varying float v_size;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= v_color.a;
    
    gl_FragColor = vec4(v_color.rgb, alpha);
  }
`

// Create shader
const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type)
  if (!shader) return null
  
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  
  return shader
}

// Create shader program
const createProgram = (gl: WebGLRenderingContext): WebGLProgram | null => {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  
  if (!vertexShader || !fragmentShader) return null
  
  const program = gl.createProgram()
  if (!program) return null
  
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  
  return program
}

// Initialize WebGL
const initWebGL = () => {
  if (!canvasRef.value) return false
  
  gl = canvasRef.value.getContext('webgl')
  if (!gl) return false
  
  program = createProgram(gl)
  if (!program) return false
  
  gl.useProgram(program)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  
  return true
}

// Render particles
const render = (time: number) => {
  if (!gl || !program || !canvasRef.value) return
  
  const canvas = canvasRef.value
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  
  canvas.width = width * window.devicePixelRatio
  canvas.height = height * window.devicePixelRatio
  gl.viewport(0, 0, canvas.width, canvas.height)
  
  gl.clear(gl.COLOR_BUFFER_BIT)
  
  // Update particles with smoother timing
  const deltaTime = 2 // ~100fps
  particles.forEach(particle => {
    particle.update(deltaTime)
  })
  
  // Prepare vertex data
  const positions: number[] = []
  const sizes: number[] = []
  const colors: number[] = []
  
  particles.forEach(particle => {
    const config = animationConfig.value
    const x = (particle.x + width / 2) * window.devicePixelRatio
    const y = (particle.y + height / 2) * window.devicePixelRatio
    
    positions.push(x, y)
    sizes.push(particle.size * config.scale * 1 * window.devicePixelRatio)
    colors.push(
      particle.color[0] * config.opacity,
      particle.color[1] * config.opacity,
      particle.color[2] * config.opacity,
      particle.color[3] * config.opacity
    )
  })
  
  // Create buffers
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  
  const sizeBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW)
  
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
  
  // Set attributes
  const positionLocation = gl.getAttribLocation(program, 'a_position')
  const sizeLocation = gl.getAttribLocation(program, 'a_size')
  const colorLocation = gl.getAttribLocation(program, 'a_color')
  
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
  gl.enableVertexAttribArray(sizeLocation)
  gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0)
  
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.enableVertexAttribArray(colorLocation)
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0)
  
  // Set uniforms
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const timeLocation = gl.getUniformLocation(program, 'u_time')
  
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
  gl.uniform1f(timeLocation, time * 0.001)
  
  // Draw particles
  gl.drawArrays(gl.POINTS, 0, particles.length)
  
  animationId = requestAnimationFrame(render)
}

// Start animation
const startAnimation = () => {
  if (initWebGL()) {
    initParticles()
    render(0)
  }
}

// Stop animation
const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// Watch for page changes
watch(currentPage, () => {
  initParticles()
})

// Lifecycle hooks
onMounted(() => {
  startAnimation()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<template>
  <!-- WebGL Canvas for Decorative Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
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
