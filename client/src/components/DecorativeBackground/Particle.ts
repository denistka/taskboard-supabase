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
    this.size = 120 + Math.random() * 80
    this.color = color
    this.life = 0
    this.maxLife = 1
    this.angle = Math.random() * Math.PI * 2
    this.distance = 120 + Math.random() * 180
    this.pattern = pattern
    this.speed = speed * 1.0
    this.phase = Math.random() * Math.PI * 2
    
    if (pattern === 'orbit') {
      this.size = 20 + Math.random() * 20
    }
  }

  update(deltaTime: number) {
    this.life += deltaTime * this.speed
    this.phase += deltaTime * this.speed * 3.2

    const centerX = 0
    const centerY = 0

    switch (this.pattern) {
      case 'orbit':
        this.angle += deltaTime * this.speed * 0.5
        
        const maxDistance = 300
        const minDistance = 20
        const shrinkSpeed = deltaTime * this.speed * 0.1
        
        if (this.distance > minDistance) {
          this.distance = Math.max(minDistance, this.distance - shrinkSpeed)
        }
        
        const sizeRatio = 1 - (this.distance - minDistance) / (maxDistance - minDistance)
        const minSize = 20
        const maxSize = 100
        this.size = minSize + (maxSize - minSize) * Math.max(0, sizeRatio)
        
        this.x = centerX + Math.cos(this.angle) * this.distance
        this.y = centerY + Math.sin(this.angle) * this.distance
        break
      
      case 'drift':
        this.x = centerX - Math.cos(this.angle) * this.distance * 1.2 
        this.y = centerY - Math.sin(this.angle) * this.distance * 1.2
        break
      
      case 'float1':
        this.x = centerX + Math.cos(this.phase) * this.distance * 0.9
        this.y = centerY + Math.sin(this.phase * 0.8) * this.distance * 0.7
        break
      
      case 'float2':
        this.x = centerX + Math.cos(this.phase) * this.distance * 0.9
        this.y = centerY - Math.sin(this.phase * 0.8) * this.distance * 0.7
        break
    }

    if (this.pattern !== 'orbit') {
      const baseSize = 200 + Math.random() * 20
      const pulseFactor = 0.7 + 0.3 * Math.sin(this.life * 0.2)
      const randomFactor = 0.8 + 0.4 * Math.sin(this.life * 0.1 + this.phase)
      this.size = baseSize * pulseFactor * randomFactor
    }
  }
}
