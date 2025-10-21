import { Particle } from './Particle'

export interface AnimationConfig {
  opacity: number
  scale: number
  speed: number
}

export class WebGLRenderer {
  private gl: WebGLRenderingContext | null = null
  private program: WebGLProgram | null = null

  constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
    this.gl = gl
    this.program = program
  }

  // Render particles
  public render = (time: number, particles: Particle[], animationConfig: AnimationConfig) => {
    if (!this.gl || !this.program) return
    
    const canvas = this.gl.canvas as HTMLCanvasElement
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    this.gl.viewport(0, 0, canvas.width, canvas.height)
    
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    
    // Prepare vertex data
    const positions: number[] = []
    const sizes: number[] = []
    const colors: number[] = []
    
    particles.forEach(particle => {
      const x = (particle.x + width / 2) * window.devicePixelRatio
      const y = (particle.y + height / 2) * window.devicePixelRatio
      
      positions.push(x, y)
      sizes.push(particle.size * animationConfig.scale * 1 * window.devicePixelRatio)
      colors.push(
        particle.color[0] * animationConfig.opacity,
        particle.color[1] * animationConfig.opacity,
        particle.color[2] * animationConfig.opacity,
        particle.color[3] * animationConfig.opacity
      )
    })
    
    // Create buffers
    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW)
    
    const sizeBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(sizes), this.gl.STATIC_DRAW)
    
    const colorBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW)
    
    // Set attributes
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position')
    const sizeLocation = this.gl.getAttribLocation(this.program, 'a_size')
    const colorLocation = this.gl.getAttribLocation(this.program, 'a_color')
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.enableVertexAttribArray(positionLocation)
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0)
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer)
    this.gl.enableVertexAttribArray(sizeLocation)
    this.gl.vertexAttribPointer(sizeLocation, 1, this.gl.FLOAT, false, 0, 0)
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorBuffer)
    this.gl.enableVertexAttribArray(colorLocation)
    this.gl.vertexAttribPointer(colorLocation, 4, this.gl.FLOAT, false, 0, 0)
    
    // Set uniforms
    const resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution')
    const timeLocation = this.gl.getUniformLocation(this.program, 'u_time')
    
    this.gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
    this.gl.uniform1f(timeLocation, time * 0.001)
    
    // Draw particles
    this.gl.drawArrays(this.gl.POINTS, 0, particles.length)
  }
}
