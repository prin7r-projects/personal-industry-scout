/**
 * [SCOUT_CN] tiny class merge helper. Used by the vendored shadcn primitives
 * so the source matches the upstream signature.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
