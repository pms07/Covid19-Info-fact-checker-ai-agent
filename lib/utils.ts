import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAttitudeEmoji(attitude: number): string {
  switch (attitude) {
    case -1:
      return "😠"
    case 0:
      return "😐"
    case 1:
      return "🙂"
    default:
      return "😐"
  }
}

export function getAttitudeLabel(attitude: number): string {
  switch (attitude) {
    case -1:
      return "Resistant"
    case 0:
      return "Neutral"
    case 1:
      return "Likely"
    default:
      return "Neutral"
  }
}
