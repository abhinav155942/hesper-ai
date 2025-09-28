// Provide Tailwind-aware className merge utility used across UI components
import type { ClassValue } from "clsx"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default cn