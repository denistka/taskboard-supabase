import { Particle, type ParticleColor } from './Particle'

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

  public initParticles = (count: number = 100) => {
    this.particles = []
    
    for (let i = 0; i < count; i++) {
      const color = colorPalette[i % colorPalette.length]
      const patternIndex = i % 6
      const pattern = patternIndex === 0 ? 'orbit' : 
                     patternIndex === 1 ? 'drift' : 
                     patternIndex === 2 ? 'float1' : 'float2'
      const speed = 0.05 + Math.random() * 0.01
      
      this.particles.push(new Particle(0, 0, color, pattern, speed))
    }
  }

  public updateParticles = (deltaTime: number) => {
    this.particles.forEach(particle => {
      particle.update(deltaTime)
    })
  }

  public getParticles = (): Particle[] => {
    return this.particles
  }

  public getParticleCount = (): number => {
    return this.particles.length
  }
}
