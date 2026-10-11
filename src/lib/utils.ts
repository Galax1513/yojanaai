import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Display-only cleanup for imported scheme text, which sometimes
 * carries raw markdown (`**bold**`, `> quote`, `- item`). Keeps line
 * breaks; the stored data is untouched.
 */
export function cleanText(value: string | null | undefined): string {
  if (!value) return ""
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\*\*|__/g, "")
    // single-asterisk emphasis (*word*), but not "* " list bullets
    .replace(/\*(?=\S)|(?<=\S)\*/g, "")
    .replace(/^\s*>\s?/gm, "")
    .trim()
}

/** cleanText, plus leading list markers removed — for one-line snippets. */
export function cleanSnippet(value: string | null | undefined): string {
  return cleanText(value).replace(/^\s*[-•*]\s+/gm, "").replace(/\s*\n\s*/g, " ")
}
