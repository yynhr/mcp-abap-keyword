# Usage Guide

## Quick Start

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Configure Claude Desktop:**

   Edit your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

   Add this configuration:
   ```json
   {
     "mcpServers": {
       "mcp-abap-keyword": {
         "command": "node",
         "args": ["/Users/yynhr/Projects/mcp-abap-keyword/build/index.js"]
       }
     }
   }
   ```

3. **Restart Claude Desktop** to load the MCP server.

## Example Usage

Once configured, you can use these tools in Claude:

### Search for ABAP Keywords

**Example prompt:**
> "Search for the ABAP keyword SELECT"

This will use the `search_abap_keyword` tool to find documentation about the SELECT statement.

### Look up Glossary Terms

**Example prompt:**
> "What is ABAP Objects?"

This will use the `lookup_glossary` tool to find the definition in the ABAP Glossary.

### Explore ABAP Topics

**Example prompt:**
> "Tell me about ABAP Core Data Services"

or

> "Get information about the CDS topic"

This will use the `get_abap_topic` tool to retrieve information about CDS.

### Browse Documentation Structure

**Example prompt:**
> "What topics are available in the ABAP documentation?"

This will use the `browse_main_topics` tool to show all available documentation sections.

## Available Topics

When using `get_abap_topic`, you can explore these topics:

- **dictionary** or **ddic** - ABAP Dictionary
- **cds** - ABAP Core Data Services  
- **programming** or **language** - ABAP Programming Language
- **rap** or **restful** - ABAP RESTful Application Programming Model
- **examples** - ABAP code examples
- **news** or **releases** - Release notes and new features

## Cache Management

The server automatically caches fetched documentation pages for 24 hours with human-readable file names:

- **Cache location**: `.cache/` directory in the project root
- **Cache format**: Markdown `.md` files (human readable) + raw `.html` files (for parsing)
- **File names**: Descriptive like `abap-index.md`, `cds-annotations.md`, `rap-behavior-definitions.md`
- **Performance improvement**: 20-40x faster for cached queries
- **Automatic cleanup**: Cache entries expire after 24 hours

### Viewing cached documentation

Cache files are human-readable markdown:

```bash
# View a cached document
cat .cache/cds-annotations.md

# List all cached files
ls -1 .cache/*.md
```

You can even edit `.md` files to add personal notes!

### Clear cache manually

To clear all cached documents:

```bash
rm -rf .cache
```

To clear a specific cached document:

```bash
rm .cache/cds-annotations.md .cache/cds-annotations.html
```

To view cache directory info:

```bash
ls -lh .cache/
du -sh .cache/
```

## Troubleshooting

### Server not showing in Claude Desktop

1. Check that the path in the configuration is absolute and correct
2. Ensure the project is built (`npm run build`)
3. Verify Node.js is installed and accessible from command line
4. Restart Claude Desktop completely
5. Check Claude Desktop logs for errors

### Cannot access SAP documentation

The server requires internet access to fetch documentation from:
`https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/`

Make sure your network connection is working and can access SAP's website.

**Note**: After the first request, data is cached locally for 24 hours, so you can work offline for previously accessed pages.

### Slow first-time queries

The first time you query for information, it fetches from SAP's website (300-500ms). Subsequent queries for the same information use the local cache and respond in ~10ms.

## Tips

- Be specific with keyword searches (e.g., "SELECT" not just "select statement")
- Glossary terms are case-insensitive
- Topic names can be abbreviated (e.g., "cds" instead of "Core Data Services")
- Use `browse_main_topics` first to understand the documentation structure
