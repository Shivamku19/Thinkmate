/**
 * ThinkMate Web Search Service
 * Provides real-time internet search capabilities to ground AI answers
 * and prevent hallucinations on current, temporal, or factual queries.
 */

/**
 * Clean raw HTML tags and common HTML entities from scraped snippets/titles
 */
function cleanHtmlText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Decode DuckDuckGo redirected URL if wrapped in /l/?uddg=...
 */
function extractTargetUrl(rawUrl) {
  if (!rawUrl) return "";
  if (rawUrl.includes("uddg=")) {
    const match = rawUrl.match(/uddg=([^&]+)/);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }
  if (rawUrl.startsWith("//")) {
    return `https:${rawUrl}`;
  }
  return rawUrl;
}

/**
 * Free zero-config DuckDuckGo Lite Search
 * Extracts organic search results directly without requiring an API key.
 */
export async function searchDuckDuckGoLite(query, maxResults = 5) {
  try {
    const response = await fetch("https://lite.duckduckgo.com/lite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: `q=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.warn(`DuckDuckGo Lite returned HTTP status ${response.status}`);
      return [];
    }

    const html = await response.text();
    const results = [];

    // DDG Lite matches
    const linkMatches = [
      ...html.matchAll(
        /<a[^>]+href=['"]([^'"]+)['"][^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi
      ),
    ];
    const snippetMatches = [
      ...html.matchAll(
        /<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi
      ),
    ];

    const count = Math.min(
      linkMatches.length,
      snippetMatches.length,
      maxResults
    );

    for (let i = 0; i < count; i++) {
      const url = extractTargetUrl(linkMatches[i][1]);
      const title = cleanHtmlText(linkMatches[i][2]);
      const snippet = cleanHtmlText(snippetMatches[i][1]);

      if (title && snippet && url && !url.includes("duckduckgo.com/feedback")) {
        results.push({
          title,
          url,
          snippet,
          source: "DuckDuckGo",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("DuckDuckGo Lite search error:", error.message);
    return [];
  }
}
