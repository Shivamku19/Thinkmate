/**
 * Query Classification & Search Extraction Utility
 * Determines if a query requires live web search to avoid hallucinations
 * and extracts the core search keywords.
 */

// Temporal and real-time trigger keywords
const REALTIME_PATTERNS = [
  /\b(who is|who are|who's)\s+(the\s+)?(current\s+)?(director|ceo|president|prime minister|minister|chairman|head|founder|coach|governor|vice chancellor|vc|dean|principal)\b/i,
  /\b(current|currently|present|latest|recent|recently|today|now|right now|yesterday|this week|this month|this year)\b/i,
  /\b(news|updates|release date|version|score|stock price|weather|announcement|result|election)\b/i,
  /\b(2024|2025|2026|2027)\b/,
  /\b(iiit|iit|nit|bits|university|college|institute|organization)\b/i,
  /\b(when was|when is|what happened to|what is the price of|how much is)\b/i,
  /\b(director of|ceo of|head of|leader of|founder of)\b/i,
];

// Patterns that typically DO NOT require web search (pure coding, translation, math, creative writing)
const NO_SEARCH_PATTERNS = [
  /^(write|create|generate)\s+(a\s+)?(code|function|class|component|script|program|regex|html|css|sql|poem|story|song|essay)/i,
  /^(solve|calculate|evaluate|simplify)\s+[\d\+\-\*\/\(\)\^]+/i,
  /^(translate|convert)\s+/i,
  /^(explain|what is)\s+(a\s+)?(closure|promise|recursion|pointer|polymorphism|interface|async\/await|binary search|bubble sort)\b/i,
];

/**
 * Checks whether a user prompt likely requires live web search
 */
export function requiresWebSearch(prompt, mode = "auto") {
  if (mode === "enabled" || mode === true) return true;
  if (mode === "disabled" || mode === false) return false;

  const trimmed = (prompt || "").trim();
  if (trimmed.length === 0) return false;

  // Check if it's clearly a local task that doesn't need web search
  for (const pattern of NO_SEARCH_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Check if query matches real-time/temporal patterns
  for (const pattern of REALTIME_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Question words about entities often benefit from grounding
  if (/^(who|where|when|what company|which team)\b/i.test(trimmed) && trimmed.length < 150) {
    return true;
  }

  return false;
}

/**
 * Extracts a concise search query from conversational prompts
 * e.g. "Can you tell me who is the current director of iiit bhagalpur please?"
 *  -> "current director of iiit bhagalpur"
 */
export function extractSearchKeywords(prompt) {
  if (!prompt) return "";

  let cleaned = prompt.trim();

  // Strip conversational filler prefixes
  cleaned = cleaned.replace(/^(hey|hi|hello|please|can you|could you|tell me|do you know|i want to know|search for|look up|find out)\s+/gi, "");
  cleaned = cleaned.replace(/^(can you please|could you please|would you please)\s+/gi, "");
  cleaned = cleaned.replace(/\s+(please|thanks|thank you)\s*$/gi, "");
  cleaned = cleaned.replace(/[?!.]+$/g, "");

  return cleaned.trim() || prompt.trim();
}
