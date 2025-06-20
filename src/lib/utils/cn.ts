import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 * This is the standard utility for conditional className handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
