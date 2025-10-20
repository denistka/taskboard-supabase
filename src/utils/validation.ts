export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export const validateTaskTitle = (title: string): ValidationResult => {
  const errors: string[] = []
  
  if (!title || title.trim().length === 0) {
    errors.push('Title is required')
  } else if (title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long')
  } else if (title.trim().length > 100) {
    errors.push('Title must be less than 100 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateTaskDescription = (description: string): ValidationResult => {
  const errors: string[] = []
  
  if (description && description.length > 1000) {
    errors.push('Description must be less than 1000 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = []
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required')
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = []
  
  if (!password || password.length === 0) {
    errors.push('Password is required')
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  } else if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateFullName = (fullName: string): ValidationResult => {
  const errors: string[] = []
  
  if (fullName && fullName.trim().length > 50) {
    errors.push('Full name must be less than 50 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000) // Limit length
}

export const validateTaskData = (title: string, description: string): ValidationResult => {
  const titleValidation = validateTaskTitle(title)
  const descriptionValidation = validateTaskDescription(description)
  
  return {
    isValid: titleValidation.isValid && descriptionValidation.isValid,
    errors: [...titleValidation.errors, ...descriptionValidation.errors]
  }
}
