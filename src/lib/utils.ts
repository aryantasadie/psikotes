import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Menggabungkan class name secara kondisional dan menyelesaikan konflik Tailwind utility class
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
