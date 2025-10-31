import { vertexShaderSource, fragmentShaderSource } from './shaders'

export const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
  const shader = gl.createShader(type)
  if (!shader) {
    console.error('Failed to create shader')
    return null
  }
  
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const shaderType = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT'
    console.error(`${shaderType} shader compilation error:`, gl.getShaderInfoLog(shader))
    console.error('Shader source:', source)
    gl.deleteShader(shader)
    return null
  }
  
  return shader
}

export const createProgram = (gl: WebGLRenderingContext): WebGLProgram | null => {
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

export const initWebGL = (canvas: HTMLCanvasElement): { gl: WebGLRenderingContext | null, program: WebGLProgram | null } => {
  // Try standard webgl first, then experimental for Safari/older browsers
  let gl = canvas.getContext('webgl') as WebGLRenderingContext | null
  
  if (!gl) {
    console.log('Standard webgl not available, trying experimental-webgl')
    gl = canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  }
  
  if (!gl) {
    console.warn('WebGL not supported in this browser')
    return { gl: null, program: null }
  }
  
  console.log('WebGL context obtained successfully')
  
  const program = createProgram(gl)
  if (!program) {
    console.error('Failed to create WebGL program')
    return { gl, program: null }
  }
  
  console.log('WebGL program created successfully')
  
  gl.useProgram(program)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  
  return { gl, program }
}
