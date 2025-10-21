export type ParticlePattern = 'orbit' | 'drift' | 'float1' | 'float2'
export type ParticleColor = [number, number, number, number]

export class Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: ParticleColor
  life: number
  maxLife: number
  angle: number
  distance: number
  pattern: ParticlePattern
  speed: number
  phase: number

  constructor(
    x: number, 
    y: number, 
    color: ParticleColor, 
    pattern: ParticlePattern,
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
    this.speed = speed * 1.0 // Use full speed for better deltaTime responsiveness
    this.phase = Math.random() * Math.PI * 2
    
    // For orbit pattern, start with smaller size for electron-like effect
    if (pattern === 'orbit') {
      this.size = 20 + Math.random() * 20 // Start small like electrons
    }
  }


  update(deltaTime: number) {
    this.life += deltaTime * this.speed
    this.phase += deltaTime * this.speed * 3.2 // Even slower phase change

    const centerX = 0
    const centerY = 0

    switch (this.pattern) {
      case 'orbit':
        this.angle += deltaTime * this.speed * 0.5 // More responsive to deltaTime changes
        
        // Slowly decrease orbit radius toward center (electron-like behavior)
        const maxDistance = 300 // Maximum orbit radius
        const minDistance = 20  // Minimum orbit radius
        const shrinkSpeed = deltaTime * this.speed * 0.1 // How fast radius shrinks
        
        if (this.distance > minDistance) {
          this.distance = Math.max(minDistance, this.distance - shrinkSpeed)
        }
        
        // Grow particle size as orbit gets smaller
        const sizeRatio = 1 - (this.distance - minDistance) / (maxDistance - minDistance)
        const minSize = 20
        const maxSize = 100
        this.size = minSize + (maxSize - minSize) * Math.max(0, sizeRatio)
        
        this.x = centerX + Math.cos(this.angle) * this.distance
        this.y = centerY + Math.sin(this.angle) * this.distance
        break
      
      case 'drift':
        // More responsive drift movement
        this.x = centerX - Math.cos(this.angle) * this.distance * 1.2 
        this.y = centerY - Math.sin(this.angle) * this.distance * 1.2
        break
      
      case 'float1':
        // Smooth figure-8 with larger radius, more responsive to deltaTime
        this.x = centerX + Math.cos(this.phase) * this.distance * 0.9
        this.y = centerY + Math.sin(this.phase * 0.8) * this.distance * 0.7
        break
      
      case 'float2':
        // Smooth figure-8 with larger radius, more responsive to deltaTime
        this.x = centerX + Math.cos(this.phase) * this.distance * 0.9
        this.y = centerY - Math.sin(this.phase * 0.8) * this.distance * 0.7
        break
    }

    // Random size changes with extremely slow, barely perceptible transitions
    // Only apply to non-orbit particles (orbit particles have their own size logic)
    if (this.pattern !== 'orbit') {
      const baseSize = 200 + Math.random() * 20
      const pulseFactor = 0.7 + 0.3 * Math.sin(this.life * 0.2) // Extremely slow pulsing - barely noticeable
      const randomFactor = 0.8 + 0.4 * Math.sin(this.life * 0.1 + this.phase) // Almost imperceptible size variation
      this.size = baseSize * pulseFactor * randomFactor
    }
  }
}
