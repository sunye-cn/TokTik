import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(path: string | null | undefined) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `http://localhost:3000/${path}`;
}
