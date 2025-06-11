import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""
  
  // Ensure at least one of each required character type
  password += charset.match(/[a-z]/)?.[0] || "a" // lowercase
  password += charset.match(/[A-Z]/)?.[0] || "A" // uppercase
  password += charset.match(/[0-9]/)?.[0] || "0" // number
  password += charset.match(/[!@#$%^&*]/)?.[0] || "!" // special

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}
