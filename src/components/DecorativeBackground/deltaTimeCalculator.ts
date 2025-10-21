import { ref, type Ref } from 'vue'

// Magnetic Speed System - KISS approach
export class DeltaTimeCalculator {
  
  // Core magnetic speed system
  private readonly MAGNETIC_SPEED = 0.03 // Always return to this base speed
  private readonly SLOWDOWN_STEP = 0.02 // How fast to slow down (smaller than magnetic speed)
  private readonly SLOWDOWN_INTERVAL = 100 // 100ms intervals for smooth transitions
  
  // Current state
  private currentSpeed: Ref<number> = ref(this.MAGNETIC_SPEED)
  private targetSpeed: Ref<number> = ref(this.MAGNETIC_SPEED)
  private slowdownInterval: ReturnType<typeof setInterval> | null = null
  
  // Debug logging
  private lastDebugTime = 0
  private readonly DEBUG_INTERVAL = 1000 // Log every 300ms

  constructor() {
    // Interval will be started explicitly via startMagneticSystem()
  }

  // Public method to start the magnetic speed system
  public startMagneticSystem = () => {
    this.startSlowdownInterval()
  }

  // Start the magnetic slowdown system
  private startSlowdownInterval = () => {
    if (this.slowdownInterval) {
      clearInterval(this.slowdownInterval)
    }
    
    this.slowdownInterval = setInterval(() => {
        console.log('slowdownInterval', this.currentSpeed.value, this.targetSpeed.value)
      // Move current speed towards target (magnetic effect)
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
      
      // Debug logging every 300ms (presence count will be passed from outside)
      this.logDebugInfo(0) // Default to 0, will be updated by external calls
    }, this.SLOWDOWN_INTERVAL)
  }

  // Set new target speed (triggers gradual magnetic slowdown)
  public setTargetSpeed = (newSpeed: number) => {
    this.targetSpeed.value = newSpeed
    // Don't set currentSpeed immediately - let the interval handle gradual transition
  }

  // Easy way to add new speed triggers - KISS approach
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

  // Calculate speed based on presence events (now passed from outside)
  private calculatePresenceSpeed = (presenceEventCount: number): number => {
    if (presenceEventCount === 0) {
      return this.MAGNETIC_SPEED // No events = magnetic speed
    }
    
    // Presence events = faster speed (0.1 to 1.5 range)
    const calculatedSpeed = this.MAGNETIC_SPEED + (presenceEventCount * 0.15)
    return Math.min(calculatedSpeed, 1.5) // Cap at 1.5
  }

  // Main deltaTime calculation - simplified
  public calculateDeltaTime = (routerNavigating: Ref<boolean>, presenceEventCount: number = 0): number => {
    // Router navigation = very slow
    if (routerNavigating.value) {
      this.setTargetSpeed(0.02)
      return this.currentSpeed.value
    }
    
    // Calculate target based on presence
    const presenceSpeed = this.calculatePresenceSpeed(presenceEventCount)
    this.setTargetSpeed(presenceSpeed)
    
    return this.currentSpeed.value
  }

  // Router end event - start magnetic slowdown to presence-based speed
  public startRouterEndCountdown = (presenceEventCount: number = 0) => {
    const targetSpeed = this.calculatePresenceSpeed(presenceEventCount)
    this.setTargetSpeed(targetSpeed)
  }

  // Debug logging with 300ms intervals
  private logDebugInfo = (presenceEventCount: number = 0) => {
    const now = Date.now()
    if (now - this.lastDebugTime >= this.DEBUG_INTERVAL) {
      console.log(`[MagneticSpeed] Current: ${this.currentSpeed.value.toFixed(3)}, Target: ${this.targetSpeed.value.toFixed(3)}, Presence: ${presenceEventCount}`)
      this.lastDebugTime = now
    }
  }

  // Cleanup
  public cleanup = () => {
    if (this.slowdownInterval) {
      clearInterval(this.slowdownInterval)
      this.slowdownInterval = null
    }
  }
}
