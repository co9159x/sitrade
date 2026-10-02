export function validateFullName(value: string) {
  const name = value.trim()
  if (name.length < 2) return 'Enter your full name.'
  if (name.length > 80) return 'Name must be 80 characters or fewer.'
  return null
}

export function validateEmail(value: string) {
  const email = value.trim()
  if (!email) return 'Enter your email address.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
  return null
}

export function validatePassword(value: string) {
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[a-z]/.test(value)) return 'Include a lowercase letter.'
  if (!/[A-Z]/.test(value)) return 'Include an uppercase letter.'
  if (!/[0-9]/.test(value)) return 'Include a number.'
  return null
}

export function passwordRules(value: string) {
  return [
    { label: 'At least 8 characters', ok: value.length >= 8 },
    { label: 'One lowercase letter', ok: /[a-z]/.test(value) },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(value) },
    { label: 'One number', ok: /[0-9]/.test(value) },
  ]
}
