# MCP ABAP Keyword Server

A Model Context Protocol (MCP) server for accessing ABAP Keyword Documentation from SAP's official documentation site (https://help.sap.com).

## Features

- 🔍 Search for ABAP keywords in the official ABAP Index
- 📖 Look up terms in the ABAP Glossary  
- 📚 Browse ABAP topics (Dictionary, CDS, Programming Language, RAP, etc.)
- 🗂️ Navigate the main documentation structure
- ⚡ Intelligent caching system for fast repeated queries (24-hour cache TTL)
- 🚀 Up to 44x faster response times for cached content

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Development

```bash
npm run dev
```

## Testing

Test scripts are located in the `test/` directory (excluded from version control).

```bash
# Run cache performance test
node test/test-cache.js

# Run RAP behavior definition test
node test/test-rap-detailed.js

# Run basic functionality tests
node test/test.js
```

See [test/README.md](test/README.md) for more details.

## Available Tools

### 1. search_abap_keyword

Search for ABAP keywords in the official ABAP Index.

**Parameters:**
- `keyword` (required): The ABAP keyword to search for (e.g., 'SELECT', 'DATA', 'CLASS')

**Example:**
```json
{
  "keyword": "SELECT"
}
```

### 2. lookup_glossary

Look up a term in the ABAP Glossary to get its definition and explanation.

**Parameters:**
- `term` (required): The term to look up (e.g., 'ABAP Objects', 'CDS', 'RAP')

**Example:**
```json
{
  "term": "ABAP Objects"
}
```

### 3. get_abap_topic

Get detailed information about a specific ABAP topic area.

**Parameters:**
- `topic` (required): The topic to explore. Available topics:
  - `dictionary` or `ddic` - ABAP Dictionary
  - `cds` - ABAP Core Data Services
  - `programming` or `language` - ABAP Programming Language
  - `rap` or `restful` - ABAP RESTful Application Programming Model
  - `examples` - ABAP Examples
  - `news` or `releases` - Release News

**Example:**
```json
{
  "topic": "cds"
}
```

### 4. browse_main_topics

Browse all main topics in the ABAP Keyword Documentation. Returns a categorized overview of available documentation sections.

**Parameters:** None

## Configuration

To use this server with Claude Desktop or other MCP clients, add the following to your MCP settings configuration file:

### Claude Desktop (macOS)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-abap-keyword/build/index.js"]
    }
  }
}
```

### Claude Desktop (Windows)

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\mcp-abap-keyword\\build\\index.js"]
    }
  }
}
```

Make sure to replace the path with the actual absolute path to your project's build directory.

## Data Source

All information is retrieved from SAP's official ABAP Keyword Documentation:
https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABENABAP.html

## Caching

The server implements an intelligent file-based caching system with human-readable files:
- **Cache Location**: `.cache/` directory in the project root
- **Cache Format**: Human-readable markdown `.md` files (for viewing) + raw `.html` files (for parsing)
- **File Names**: Descriptive names like `ap-index.md`, `cds.md` (easy to browse)
- **Cache TTL**: 24 hours (configurable)
- **Performance**: 20-40x faster for cached responses
- **Automatic**: No manual cache management required
- **Cache Invalidation**: Automatic after 24 hours

To clear the cache manually:
```bash
rm -rf .cache
```

## License

MIT
