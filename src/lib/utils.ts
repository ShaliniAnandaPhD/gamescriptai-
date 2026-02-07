import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl() {
  if (typeof window !== "undefined" && window.location.origin.includes("localhost")) {
    // In local dev, Vite is on 8080 or 5173, Express is usually on 5174
    return window.location.origin.replace(/:[0-9]+/, ":5174");
  }
  return ""; // Relative path for Vercel production
}
