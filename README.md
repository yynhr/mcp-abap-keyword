# MCP ABAP Keyword Server

A Model Context Protocol (MCP) server for accessing ABAP Keyword Documentation from SAP's official documentation site (https://help.sap.com).

> 📚 **Available Languages:**
> - English (this file)
> - [日本語](README.ja.md) (Japanese)

## Features

- 🔍 Search for ABAP keywords in the official ABAP Index
- 📖 Look up terms in the ABAP Glossary  
- 📚 Browse ABAP topics (Dictionary, CDS, Programming Language, RAP, etc.)
- 🗂️ Navigate the main documentation structure
- ⚡ Intelligent caching system for fast repeated queries (1-year cache TTL)
- 🚀 Up to 44x faster response times for cached content

## Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- TypeScript 5.3.0 or higher

## Node.js Setup Guide

### macOS

#### Option 1: Using Homebrew (Recommended)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

#### Option 2: Direct Download
1. Visit https://nodejs.org/
2. Download the LTS (Long Term Support) version for macOS
3. Run the installer and follow the prompts
4. Verify installation by opening Terminal and running:
```bash
node --version
npm --version
```

### Windows

#### Option 1: Using Installer (Recommended)
1. Visit https://nodejs.org/
2. Download the LTS version for Windows
3. Run the `.msi` installer
4. Follow the installation wizard (accept default settings)
5. Open Command Prompt and verify:
```bash
node --version
npm --version
```

#### Option 2: Using Chocolatey
```powershell
# If Chocolatey is installed
choco install nodejs

# Verify installation
node --version
npm --version
```

#### Option 3: Using Windows Package Manager
```powershell
winget install OpenJS.NodeJS

# Verify installation
node --version
npm --version
```

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

### Cline (VS Code Extension)

To use this MCP server with [Cline](https://github.com/cline/cline), follow these steps:

#### macOS

1. Install the Cline extension in VS Code
2. Open VS Code settings (Code > Preferences > Settings or Cmd+,)
3. Search for "Cline" and find the MCP settings section
4. Add the server configuration to your `settings.json`:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-abap-keyword/build/index.js"]
    }
  }
}
```

Alternatively, edit `.vscode/settings.json` in your workspace:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["${workspaceFolder}/../mcp-abap-keyword/build/index.js"]
    }
  }
}
```

#### Windows

1. Install the Cline extension in VS Code
2. Open VS Code settings (File > Preferences > Settings or Ctrl+,)
3. Search for "Cline" and find the MCP settings section
4. Add the server configuration to your `settings.json`:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\mcp-abap-keyword\\build\\index.js"]
    }
  }
}
```

Alternatively, edit `.vscode\settings.json` in your workspace:

```json
{
  "cline.mcpServers": {
    "mcp-abap-keyword": {
      "command": "node",
      "args": ["${workspaceFolder}\\..\\mcp-abap-keyword\\build\\index.js"]
    }
  }
}
```

Make sure to replace the path with the actual absolute path to your project's build directory.

## Data Source

All information is retrieved from SAP's official ABAP Keyword Documentation:
https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABENABAP.html

## Caching

The server implements an efficient file-based caching system to improve performance:

- **Cache Location**: `cache/` directory (relative to the script location)
- **Cache Format**: Gzip-compressed HTML files (`.html.gz`)
- **File Naming**: SHA256 hashes of page URLs (12-character hex) + `.html.gz` extension
- **Cache TTL**: 365 days (1 year) - configurable
- **HTML Cleaning**: Automatically removes unnecessary elements before caching:
  - External scripts (`<script src>`)
  - Stylesheet links (`<link>` tags)
  - Metadata (`<meta>` tags)
  - Inline styles (`<style>` tags)
  - Noscript fallbacks (`<noscript>` tags)
  - HTML comments
- **Compression**: Uses gzip with maximum compression (level 9) for efficient storage
- **Automatic Management**: No manual cache management required
- **Cache Invalidation**: Automatic after 365 days
- **Performance**: Up to 44x faster response times for cached content

To clear the cache manually:
```bash
rm -rf cache
```

## License

MIT
