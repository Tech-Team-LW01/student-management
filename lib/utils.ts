import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ReactNode } from "react"
import { createElement } from "react"

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

// Function to make URLs clickable in text
export function makeLinksClickable(text: string): (string | ReactNode)[] {
  // URL regex pattern that matches http, https, and www URLs
  const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g

  // Split text into parts with URLs and non-URLs
  const parts = text.split(urlPattern)

  // Process each part
  return parts.map((part, index) => {
    if (!part) return null

    // Check if this part is a URL
    const isUrl = urlPattern.test(part)
    if (isUrl) {
      // Add https:// if the URL starts with www.
      const href = part.startsWith('www.') ? `https://${part}` : part
      
      return createElement('a', {
        key: index,
        href,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-blue-600 hover:text-blue-800 underline break-all",
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        children: part
      })
    }

    // Return regular text
    return part
  })
}

// Function to validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    // If URL starts with www., try with https://
    if (url.startsWith('www.')) {
      try {
        new URL(`https://${url}`)
        return true
      } catch {
        return false
      }
    }
    return false
  }
}
