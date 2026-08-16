import type { ReactNode } from "react";

const SEARCH_HIGHLIGHT_CLASS = "rounded bg-yellow-200 px-0.5 text-gray-900";

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

export const tokenizeSearchQuery = (query: string): string[] => {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return Array.from(new Set(normalized.split(" ").filter(Boolean)));
};

export const highlightText = (text: string, terms: string[]): ReactNode[] => {
  if (!text) return [text];

  const normalizedTerms = Array.from(
    new Set(
      terms
        .map((term) => term.trim())
        .filter(Boolean)
        .map((term) => term.toLowerCase())
    )
  ).sort((a, b) => b.length - a.length);

  if (!normalizedTerms.length) return [text];

  const regex = new RegExp(`(${normalizedTerms.map(escapeRegExp).join("|")})`, "ig");
  const parts = text.split(regex);

  return parts
    .filter((part) => part.length > 0)
    .map((part, index) =>
      normalizedTerms.some((term) => part.toLowerCase() === term) ? (
        <mark key={`mark-${index}`} className={SEARCH_HIGHLIGHT_CLASS}>
          {part}
        </mark>
      ) : (
        <span key={`text-${index}`}>{part}</span>
      )
    );
};

export const createSearchSnippet = (text: string, terms: string[], maxLength = 140): string => {
  if (!text) return "";

  const normalizedTerms = Array.from(
    new Set(
      terms
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort((a, b) => b.length - a.length);

  if (!normalizedTerms.length) {
    return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
  }

  const lowerText = text.toLowerCase();
  let matchIndex = -1;

  for (const term of normalizedTerms) {
    const index = lowerText.indexOf(term);
    if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
      matchIndex = index;
    }
  }

  if (matchIndex === -1) {
    return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
  }

  const start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  const end = Math.min(text.length, start + maxLength);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
};
