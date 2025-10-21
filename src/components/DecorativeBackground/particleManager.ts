import { Particle, type ParticleColor } from './Particle'

// Color palette for particles
export const colorPalette: ParticleColor[] = [
  [1.0, 0.8, 0.0, 0.4], // yellow
  [1.0, 0.2, 0.2, 0.4], // red
  [0.2, 0.8, 0.2, 0.4], // green
  [1.0, 0.5, 0.0, 0.4], // orange
  [0.2, 0.4, 1.0, 0.4], // blue
  [0.6, 0.2, 0.8, 0.4], // purple
  [1.0, 0.4, 0.8, 0.4], // pink
  [0.0, 0.8, 0.8, 0.4]  // cyan
]

export class ParticleManager {
  private particles: Particle[] = []

  // Initialize particles
  public initParticles = (count: number = 100) => {
    this.particles = []
    
    let orbitCount = 0
    for (let i = 0; i < count; i++) {
      const color = colorPalette[i % colorPalette.length]
      // Mix of patterns: 50% orbit (electron-like), 25% drift, 25% float
      const patternIndex = i % 6
      const pattern = patternIndex === 0 ? 'orbit' : 
                     patternIndex === 1 ? 'drift' : 
                     patternIndex === 2 ? 'float1' : 'float2'
      const speed = 0.05 + Math.random() * 0.01 // Higher base speeds for more visible slowdown effect
      
      if (pattern === 'orbit') {
        orbitCount++
      }
      
      this.particles.push(new Particle(0, 0, color, pattern, speed))
    }
    
    console.log(`[ParticleManager] Created ${count} particles, ${orbitCount} orbit particles (electron-like)`)
  }

  // Update all particles
  public updateParticles = (deltaTime: number) => {
    this.particles.forEach(particle => {
      particle.update(deltaTime)
    })
  }

  // Get particles for rendering
  public getParticles = (): Particle[] => {
    return this.particles
  }

  // Get particle count
  public getParticleCount = (): number => {
    return this.particles.length
  }
}
