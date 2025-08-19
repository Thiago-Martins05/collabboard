// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge de classes Tailwind com suporte a condicionais. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Slug simples e estável para URLs. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD") // remove acentos
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
