import { ref, type Ref } from 'vue'

export class DeltaTimeCalculator {
  private readonly MAGNETIC_SPEED = 0.03
  private readonly SLOWDOWN_STEP = 0.02
  private readonly SLOWDOWN_INTERVAL = 100
  
  private currentSpeed: Ref<number> = ref(this.MAGNETIC_SPEED)
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
      if (this.currentSpeed.value > this.targetSpeed.value) {
        this.currentSpeed.value = Math.max(
          this.targetSpeed.value,
          this.currentSpeed.value - this.SLOWDOWN_STEP
        )
      } else if (this.currentSpeed.value < this.targetSpeed.value) {
        this.currentSpeed.value = Math.min(
          this.targetSpeed.value,
          this.currentSpeed.value + this.SLOWDOWN_STEP
        )
      }
    }, this.SLOWDOWN_INTERVAL)
  }

  public setTargetSpeed = (newSpeed: number) => {
    this.targetSpeed.value = newSpeed
  }

  public triggerSpeedBoost = (multiplier: number = 2.0) => {
    const boostedSpeed = this.MAGNETIC_SPEED * multiplier
    this.setTargetSpeed(boostedSpeed)
  }

  public triggerSpeedSlowdown = (multiplier: number = 0.5) => {
    const slowedSpeed = this.MAGNETIC_SPEED * multiplier
    this.setTargetSpeed(slowedSpeed)
  }

  public resetToMagneticSpeed = () => {
    this.setTargetSpeed(this.MAGNETIC_SPEED)
  }

  private calculatePresenceSpeed = (presenceEventCount: number): number => {
    if (presenceEventCount === 0) {
      return this.MAGNETIC_SPEED
    }
    
    const calculatedSpeed = this.MAGNETIC_SPEED + (presenceEventCount * 0.15)
    return Math.min(calculatedSpeed, 1.5)
  }

  public calculateDeltaTime = (routerNavigating: Ref<boolean>, presenceEventCount: number = 0): number => {
    if (routerNavigating.value) {
      this.setTargetSpeed(0.02)
      return this.currentSpeed.value
    }
    
    const presenceSpeed = this.calculatePresenceSpeed(presenceEventCount)
    this.setTargetSpeed(presenceSpeed)
    
    return this.currentSpeed.value
  }

  public startRouterEndCountdown = (presenceEventCount: number = 0) => {
    const targetSpeed = this.calculatePresenceSpeed(presenceEventCount)
    this.setTargetSpeed(targetSpeed)
  }

  public cleanup = () => {
    if (this.slowdownInterval) {
      clearInterval(this.slowdownInterval)
      this.slowdownInterval = null
    }
  }
}
