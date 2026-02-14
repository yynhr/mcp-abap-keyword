#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as zlib from "zlib";
import { fileURLToPath } from "url";

// Get the directory where this script is located (works even when run from different cwd)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for ABAP documentation
const ABAP_DOC_BASE = "https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US";

// Cache configuration - use script directory instead of cwd for consistent cache location
const CACHE_DIR = path.join(__dirname, "..", "cache");
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds (configurable)

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}



// Clean HTML by removing unnecessary elements to reduce file size
// Preserves content needed for parsing while removing framework overhead
function cleanHtmlForCache(html: string): string {
  // Use cheerio to safely remove unnecessary elements
  const $ = cheerio.load(html);
  
  // Remove elements that are not needed for content extraction
  $('script[src]').remove();           // External scripts (SAPUI5 framework)
  $('link').remove();                   // Stylesheet links, icons
  $('meta').remove();                   // Meta tags  
  $('style').remove();                  // Inline styles
  $('noscript').remove();               // Noscript fallback content
  
  // Get the cleaned HTML
  let cleaned = $.html() || '';
  
  // Remove HTML comments (can be large)
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove unnecessary whitespace while preserving structure
  cleaned = cleaned
    .replace(/>\s{2,}</g, '><')  // Remove multiple spaces between tags
    .replace(/\n\s*/g, '')       // Remove all newlines and their indentation
    .replace(/  +/g, ' ')        // Collapse multiple spaces to single space
    .trim();
  
  return cleaned;
}

// Ensure cache directory exists
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// Get raw HTML cache file path (gzipped for size reduction)
function getHtmlCacheFilePath(pagePath: string): string {
  const hash = crypto.createHash('sha256').update(pagePath).digest('hex').substring(0, 12);
  return path.join(CACHE_DIR, `${hash}.html.gz`);
}

// Check if cache is valid
function isCacheValid(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    const stats = fs.statSync(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < CACHE_TTL;
  } catch {
    return false;
  }
}

// Read from cache (returns decompressed HTML for parsing)
function readCache(pagePath: string): string | null {
  const htmlPath = getHtmlCacheFilePath(pagePath);
  
  if (!isCacheValid(htmlPath)) {
    return null;
  }
  
  try {
    const compressed = fs.readFileSync(htmlPath);
    const html = zlib.gunzipSync(compressed).toString('utf-8');
    return html;
  } catch {
    return null;
  }
}

// Write to cache (stores cleaned, gzip-compressed HTML)
function writeCache(pagePath: string, html: string): void {
  ensureCacheDir();
  const htmlPath = getHtmlCacheFilePath(pagePath);
  
  try {
    // Clean HTML and compress with gzip for smaller cache files
    const cleanedHtml = cleanHtmlForCache(html);
    const compressed = zlib.gzipSync(cleanedHtml, { level: 9 });
    fs.writeFileSync(htmlPath, compressed);
  } catch (error) {
    // Silently fail - caching is not critical
    console.error("Cache write error:", error);
  }
}

// Helper function to fetch and parse a page (with caching)
async function fetchABAPPage(pagePath: string): Promise<cheerio.CheerioAPI> {
  const url = `${ABAP_DOC_BASE}/${pagePath}`;
  
  // Try to get from cache first
  const cached = readCache(pagePath);
  if (cached) {
    console.error(`[Cache HIT] ${pagePath}`);
    return cheerio.load(cached);
  }
  
  // Fetch from web if not in cache
  console.error(`[Cache MISS] ${pagePath} - Fetching from web...`);
  const response = await axios.get(url);
  const html = response.data;
  
  // Save to cache (raw HTML only)
  writeCache(pagePath, html);
  
  return cheerio.load(html);
}

// Helper function to extract text content from elements
function extractText($: cheerio.CheerioAPI, selector: string): string[] {
  const results: string[] = [];
  $(selector).each((_, element) => {
    const text = $(element).text().trim();
    if (text) {
      results.push(text);
    }
  });
  return results;
}

// Helper function to extract links
function extractLinks($: cheerio.CheerioAPI, selector: string): Array<{title: string, url: string}> {
  const links: Array<{title: string, url: string}> = [];
  $(selector).each((_, element) => {
    const $link = $(element);
    const href = $link.attr('href');
    const title = $link.text().trim();
    if (href && title) {
      const fullUrl = href.startsWith('http') ? href : `${ABAP_DOC_BASE}/${href}`;
      links.push({ title, url: fullUrl });
    }
  });
  return links;
}

// Extract index/subject entries from HTML using regex
// SAP pages embed content in XML data that's not accessible via cheerio
function extractIndexEntries(html: string): Array<{title: string, href: string}> {
  const entries: Array<{title: string, href: string}> = [];
  
  // Pattern: <li><a target='_parent' href='XXX.html' class='blue'>Title</a></li>
  const pattern = /<li><a[^>]*href='([^']+\.html)'[^>]*>([^<]+)<\/a><\/li>/g;
  
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const href = match[1];
    const title = match[2].trim();
    if (href && title) {
      entries.push({ title, href });
    }
  }
  
  return entries;
}

// Fetch raw HTML for a page (with caching, for regex-based extraction)
async function fetchRawHTML(pagePath: string): Promise<string> {
  const url = `${ABAP_DOC_BASE}/${pagePath}`;
  
  // Try to get from cache first
  const cached = readCache(pagePath);
  if (cached) {
    console.error(`[Cache HIT] ${pagePath}`);
    return cached;
  }
  
  // Fetch from web if not in cache
  console.error(`[Cache MISS] ${pagePath} - Fetching from web...`);
  const response = await axios.get(url);
  const html = response.data;
  
  // Save to cache (cleaned version)
  writeCache(pagePath, html);
  
  // Return cleaned version for consistency with cache reads
  return cleanHtmlForCache(html);
}

// Search for ABAP keyword in the index
async function searchABAPKeyword(keyword: string): Promise<string> {
  try {
    const html = await fetchRawHTML('ABENABAP_INDEX.html');
    const entries = extractIndexEntries(html);
    
    const results: string[] = [];
    
    // Search for the keyword in extracted entries
    const matches = entries.filter(entry => 
      entry.title.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (matches.length === 0) {
      return `No results found for keyword "${keyword}"`;
    }
    
    // Format results
    results.push(`Found ${matches.length} result(s) for "${keyword}":\n`);
    matches.slice(0, 20).forEach((entry, index) => {
      const fullUrl = `${ABAP_DOC_BASE}/${entry.href}`;
      results.push(`${index + 1}. ${entry.title}\n   ${fullUrl}`);
    });
    
    if (matches.length > 20) {
      results.push(`\n... and ${matches.length - 20} more results`);
    }
    
    return results.join('\n');
  } catch (error) {
    throw new Error(`Failed to search keyword: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Look up a term in the ABAP glossary
async function lookupGlossary(term: string): Promise<string> {
  try {
    const $ = await fetchABAPPage('ABENABAP_GLOSSARY.html');
    
    const results: string[] = [];
    let found = false;
    
    // Search for the term in glossary entries
    $('dt, dd').each((_, element) => {
      const $elem = $(element);
      const text = $elem.text().trim();
      
      if ($elem.is('dt') && text.toLowerCase().includes(term.toLowerCase())) {
        found = true;
        results.push(`\n**${text}**`);
      } else if (found && $elem.is('dd')) {
        results.push(text);
        found = false;
      }
    });
    
    if (results.length === 0) {
      // Try searching in glossary links
      const links = extractLinks($, 'a');
      const matchingLinks = links.filter(link => 
        link.title.toLowerCase().includes(term.toLowerCase())
      );
      
      if (matchingLinks.length > 0) {
        results.push(`Found ${matchingLinks.length} glossary reference(s):\n`);
        matchingLinks.slice(0, 10).forEach((link, index) => {
          results.push(`${index + 1}. ${link.title}\n   ${link.url}`);
        });
        return results.join('\n');
      }
      
      return `No glossary entry found for "${term}"`;
    }
    
    return results.join('\n');
  } catch (error) {
    throw new Error(`Failed to lookup glossary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get information about a specific ABAP topic
async function getABAPTopic(topic: string): Promise<string> {
  try {
    // Map common topics to their documentation pages
    const topicMap: Record<string, string> = {
      'dictionary': 'ABENABAP_DICTIONARY.html',
      'ddic': 'ABENABAP_DICTIONARY.html',
      'cds': 'ABENCDS.html',
      'programming': 'ABENABAP_REFERENCE.html',
      'language': 'ABENABAP_REFERENCE.html',
      'rap': 'ABENABAP_RAP.html',
      'restful': 'ABENABAP_RAP.html',
      'examples': 'ABENABAP_EXAMPLES.html',
      'news': 'ABENNEWS.html',
      'releases': 'ABENNEWS.html',
    };
    
    const pagePath = topicMap[topic.toLowerCase()] || `ABEN${topic.toUpperCase()}.html`;
    const $ = await fetchABAPPage(pagePath);
    
    // Extract main headings and first paragraphs
    const results: string[] = [];
    results.push(`# ABAP Topic: ${topic}\n`);
    
    $('h1, h2, h3').slice(0, 5).each((_, element) => {
      const $heading = $(element);
      const text = $heading.text().trim();
      if (text) {
        results.push(`\n## ${text}`);
        
        // Get the next paragraph or div content
        const $next = $heading.next('p, div');
        const content = $next.text().trim().substring(0, 300);
        if (content) {
          results.push(content + '...');
        }
      }
    });
    
    // Extract important links
    const links = extractLinks($, 'a[href*="ABEN"]').slice(0, 10);
    if (links.length > 0) {
      results.push('\n## Related Links:');
      links.forEach((link, index) => {
        results.push(`${index + 1}. ${link.title}\n   ${link.url}`);
      });
    }
    
    return results.join('\n');
  } catch (error) {
    throw new Error(`Failed to get topic information: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get the complete ABAP Index for LLM to search
async function getABAPIndex(): Promise<string> {
  try {
    const html = await fetchRawHTML('ABENABAP_INDEX.html');
    const entries = extractIndexEntries(html);
    
    const results: string[] = [];
    results.push(`# ABAP Keyword Index (${entries.length} entries)\n`);
    results.push('Format: Title -> DocumentPage\n');
    
    // Group entries by first letter for better organization
    const grouped = new Map<string, Array<{title: string, href: string}>>();
    
    entries.forEach(entry => {
      const firstChar = entry.title.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!grouped.has(letter)) {
        grouped.set(letter, []);
      }
      grouped.get(letter)!.push(entry);
    });
    
    // Sort letters and output
    const sortedLetters = Array.from(grouped.keys()).sort();
    for (const letter of sortedLetters) {
      results.push(`\n## ${letter}`);
      const letterEntries = grouped.get(letter)!;
      letterEntries.forEach(entry => {
        results.push(`- ${entry.title} -> ${entry.href}`);
      });
    }
    
    return results.join('\n');
  } catch (error) {
    throw new Error(`Failed to get ABAP index: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Get the ABAP Subject Directory for LLM to search
async function getABAPSubjects(): Promise<string> {
  try {
    const html = await fetchRawHTML('ABENABAP_SUBJECTS.html');
    const entries = extractIndexEntries(html);
    
    const results: string[] = [];
    results.push(`# ABAP Subject Directory (${entries.length} entries)\n`);
    results.push('Format: Subject -> DocumentPage\n');
    
    // Group entries by first letter
    const grouped = new Map<string, Array<{title: string, href: string}>>();
    
    entries.forEach(entry => {
      const firstChar = entry.title.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!grouped.has(letter)) {
        grouped.set(letter, []);
      }
      grouped.get(letter)!.push(entry);
    });
    
    // Sort letters and output
    const sortedLetters = Array.from(grouped.keys()).sort();
    for (const letter of sortedLetters) {
      results.push(`\n## ${letter}`);
      const letterEntries = grouped.get(letter)!;
      letterEntries.forEach(entry => {
        results.push(`- ${entry.title} -> ${entry.href}`);
      });
    }
    
    return results.join('\n');
  } catch (error) {
    throw new Error(`Failed to get ABAP subjects: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Browse main topics from the ABAP documentation home
async function browseMainTopics(): Promise<string> {
  try {
    const $ = await fetchABAPPage('ABENABAP.html');
    
    const results: string[] = [];
    results.push('# ABAP Keyword Documentation - Main Topics\n');
    
    // Extract main topic links
    const links = extractLinks($, 'a[href*="ABEN"]');
    
    // Group by category
    const categories: Record<string, Array<{title: string, url: string}>> = {
      'Modeling': [],
      'Programming': [],
      'Directories': [],
      'Other': []
    };
    
    links.forEach(link => {
      const title = link.title.toLowerCase();
      if (title.includes('dictionary') || title.includes('cds')) {
        categories['Modeling'].push(link);
      } else if (title.includes('programming') || title.includes('rap') || title.includes('language')) {
        categories['Programming'].push(link);
      } else if (title.includes('glossary') || title.includes('index') || title.includes('examples')) {
        categories['Directories'].push(link);
      } else {
        categories['Other'].push(link);
      }
    });
    
    Object.entries(categories).forEach(([category, items]) => {
      if (items.length > 0) {
        results.push(`\n## ${category}:`);
        items.forEach((link, index) => {
          results.push(`${index + 1}. ${link.title}\n   ${link.url}`);
        });
      }
    });
    
    return results.join('\n');
  } catch (error) {
    throw new Error(`Failed to browse topics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// MCP server for ABAP Keyword Documentation
const server = new Server(
  {
    name: "mcp-abap-keyword",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_abap_keyword",
        description: "Search for ABAP keywords in the official ABAP Index. Returns matching keywords with links to their documentation.",
        inputSchema: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "The ABAP keyword to search for (e.g., 'SELECT', 'DATA', 'CLASS')",
            },
          },
          required: ["keyword"],
        },
      },
      {
        name: "lookup_glossary",
        description: "Look up a term in the ABAP Glossary to get its definition and explanation.",
        inputSchema: {
          type: "object",
          properties: {
            term: {
              type: "string",
              description: "The term to look up in the glossary (e.g., 'ABAP Objects', 'CDS', 'RAP')",
            },
          },
          required: ["term"],
        },
      },
      {
        name: "get_abap_topic",
        description: "Get detailed information about a specific ABAP topic area (Dictionary, CDS, Programming Language, RAP, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "The topic to explore (e.g., 'dictionary', 'cds', 'programming', 'rap', 'examples')",
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "browse_main_topics",
        description: "Browse all main topics in the ABAP Keyword Documentation. Returns a categorized overview of available documentation sections.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_abap_index",
        description: "Get the complete ABAP Keyword Index with all entries. Returns all keywords/terms with their documentation page references, organized alphabetically. Use this to let the LLM search for specific ABAP keywords.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_abap_subjects",
        description: "Get the complete ABAP Subject Directory with all entries. Returns all subjects/topics with their documentation page references, organized alphabetically. Use this to let the LLM search for specific ABAP subjects.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_abap_keyword") {
      if (!args) {
        throw new Error("Missing arguments");
      }
      const keyword = args.keyword as string;
      const result = await searchABAPKeyword(keyword);
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }

    if (name === "lookup_glossary") {
      if (!args) {
        throw new Error("Missing arguments");
      }
      const term = args.term as string;
      const result = await lookupGlossary(term);
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }

    if (name === "get_abap_topic") {
      if (!args) {
        throw new Error("Missing arguments");
      }
      const topic = args.topic as string;
      const result = await getABAPTopic(topic);
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }

    if (name === "browse_main_topics") {
      const result = await browseMainTopics();
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }

    if (name === "get_abap_index") {
      const result = await getABAPIndex();
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }

    if (name === "get_abap_subjects") {
      const result = await getABAPSubjects();
      
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP ABAP Keyword Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
