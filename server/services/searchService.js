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

/**
 * DuckDuckGo Instant Answer API
 * Useful for encyclopedic summaries, definitions, and direct topics
 */
export async function searchDuckDuckGoInstant(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ThinkMate-AI/1.0",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const results = [];

    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || "https://duckduckgo.com/?q=" + encodeURIComponent(query),
        snippet: data.AbstractText,
        source: data.AbstractSource || "DuckDuckGo Instant Answer",
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.slice(0, 80) + "...",
            url: topic.FirstURL,
            snippet: topic.Text,
            source: "DuckDuckGo Related",
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.warn("DuckDuckGo Instant Answer API error:", error.message);
    return [];
  }
}

/**
 * Wikipedia Search API fallback
 */
export async function searchWikipedia(query, maxResults = 3) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&utf8=&format=json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ThinkMate-AI-Assistant/1.0",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data.query || !data.query.search) return [];

    return data.query.search.slice(0, maxResults).map((item) => ({
      title: item.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        item.title.replace(/ /g, "_")
      )}`,
      snippet: cleanHtmlText(item.snippet),
      source: "Wikipedia",
    }));
  } catch (error) {
    console.warn("Wikipedia search error:", error.message);
    return [];
  }
}

/**
 * Optional Tavily AI search if TAVILY_API_KEY is present
 */
export async function searchTavily(query, maxResults = 5) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: maxResults,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results) return null;

    return data.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      source: "Tavily",
    }));
  } catch (err) {
    console.warn("Tavily search failed:", err.message);
    return null;
  }
}

/**
 * Main Web Search Orchestrator
 * Runs primary search with fallback mechanisms and deduplication.
 */
export async function performWebSearch(query, options = {}) {
  const maxResults = options.maxResults || 5;

  // 1. Try Tavily if configured
  const tavilyResults = await searchTavily(query, maxResults);
  if (tavilyResults && tavilyResults.length > 0) {
    return tavilyResults;
  }

  // 2. Try primary DuckDuckGo Lite search
  let results = await searchDuckDuckGoLite(query, maxResults);

  // 3. If DDG Lite gave fewer than 2 results, supplement with Instant Answer and Wikipedia
  if (results.length < 2) {
    const [instantResults, wikiResults] = await Promise.all([
      searchDuckDuckGoInstant(query),
      searchWikipedia(query, 2),
    ]);
    results = [...results, ...instantResults, ...wikiResults];
  }

  // Deduplicate by URL
  const seenUrls = new Set();
  const uniqueResults = [];

  for (const item of results) {
    const normalizedUrl = (item.url || "").toLowerCase().replace(/\/$/, "");
    if (normalizedUrl && !seenUrls.has(normalizedUrl)) {
      seenUrls.add(normalizedUrl);
      uniqueResults.push(item);
    }
    if (uniqueResults.length >= maxResults) break;
  }

  return uniqueResults;
}
