import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Same `cn`/`hlm` helper spartan-ng's own components use internally:
 * merges conditional class lists and resolves conflicting Tailwind
 * utility classes (e.g. a later `px-4` wins over an earlier `px-2`).
 */
export function hlm(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
