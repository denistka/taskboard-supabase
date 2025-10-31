import { ref, type Ref } from 'vue'

export class DeltaTimeCalculator {
  private readonly INITIAL_SPEED = 1
  private readonly MAGNETIC_SPEED = 0.05
  private readonly SLOWDOWN_STEP = 0.02
  private readonly SLOWDOWN_INTERVAL = 100
  
  private currentSpeed: Ref<number> = ref(this.INITIAL_SPEED)
  private targetSpeed: Ref<number> = ref(this.MAGNETIC_SPEED)
  private slowdownInterval: ReturnType<typeof setInterval> | null = null

  public startMagneticSystem = () => {
    this.startSlowdownInterval()
  }

  private startSlowdownInterval = () => {
    if (this.slowdownInterval) {
      clearInterval(this.slowdownInterval)
    }
    
    this.slowdownInterval = setInterval(() => {
      if (this.currentSpeed.value > this.targetSpeed.value) this.currentSpeed.value = this.currentSpeed.value - this.SLOWDOWN_STEP
      else if (this.currentSpeed.value < this.targetSpeed.value) this.currentSpeed.value = this.currentSpeed.value + this.SLOWDOWN_STEP
    }, this.SLOWDOWN_INTERVAL)
  }

  public getCurrentSpeed = () => {
    return this.currentSpeed.value
  }

  public setCurrentSpeed = (newSpeed: number) => {
    this.currentSpeed.value = Math.max(newSpeed, this.currentSpeed.value)
  }

  public cleanup = () => {
    if (this.slowdownInterval) {
      clearInterval(this.slowdownInterval)
      this.slowdownInterval = null
    }
  }
}
