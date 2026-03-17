# Wikipedia MCP Server for Vercel

A Model Context Protocol (MCP) server that provides Wikipedia information access through Vercel's serverless functions.

## Features

This MCP server provides the following tools:

- **search_wikipedia** - Search Wikipedia for articles matching a query
- **get_article** - Get the full content of a Wikipedia article
- **get_summary** - Get a concise summary of a Wikipedia article
- **get_sections** - Get the sections of a Wikipedia article
- **get_coordinates** - Get the geographic coordinates of a Wikipedia article
- **get_related_topics** - Get topics related to a Wikipedia article
- **get_article_by_pageid** - Fetch an article using a stable Wikipedia page ID
- **get_page_links** - Get paginated internal links from an article
- **get_page_revisions** - Get recent revision metadata for an article
- **get_citations** - Extract citation/reference URLs from an article
- **get_infobox** - Extract structured infobox key-value facts
- **get_disambiguation_options** - Resolve disambiguation pages into candidate titles

All tools support multi-language Wikipedia by specifying a language code (e.g., 'en', 'es', 'fr', 'ja', 'zh').

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Vercel account (free tier works fine)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Test the MCP server:**
   
   The MCP endpoint will be available at `http://localhost:3000/api/mcp`

4. **Test with MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector@latest http://localhost:3000
   ```

   Then:
   - Open `http://127.0.0.1:6274` in your browser
   - Select "Streamable HTTP" from the dropdown
   - Enter `http://localhost:3000/api/mcp` as the URL
   - Click "Connect"
   - Test the tools under the "Tools" section

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI (if not already installed):**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to an existing project or create a new one
   - Confirm the settings
   - Deploy!

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure everything
   - Click "Deploy"

### Option 3: Deploy via Vercel Dashboard

1. **Create a new project in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository or upload your project

2. **Configure the project:**
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `next build`
   - Output Directory: `.next`

3. **Deploy!**

## Using Your Deployed MCP Server

After deployment, you'll get a URL like `https://your-project.vercel.app`

### Configure in Claude Desktop (or other MCP clients)

Add this to your Claude Desktop configuration file:

**Location of config file:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "wikipedia": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

### Configure in Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "wikipedia": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

### Configure in Windsurf

Add to `mcp_config.json`:

```json
{
  "mcpServers": {
    "wikipedia": {
      "serverUrl": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

## Example Queries

Once connected, you can ask your AI assistant:

- "Search Wikipedia for information about quantum computing"
- "Get me a summary of the article about Claude Shannon"
- "What are the geographic coordinates of Mount Everest?"
- "Find related topics to artificial intelligence on Wikipedia"
- "Search Japanese Wikipedia for information about Tokyo" (the server will handle the language parameter)
- "Get article 186306 from English Wikipedia by page ID"
- "Show me revision history for the article about CRISPR"
- "Extract citations for the article Large language model"
- "List disambiguation options for Mercury"

## API Endpoints

- **GET/POST/DELETE** `/api/mcp` - Main MCP endpoint
- **GET** `/` - Info page about available tools

## Tool Parameters

### search_wikipedia
- `query` (string, required): The search term
- `limit` (number, optional): Maximum results (1-50, default: 10)
- `language` (string, optional): Wikipedia language code (default: 'en')

### get_article
- `title` (string, required): Article title
- `language` (string, optional): Wikipedia language code (default: 'en')

### get_summary
- `title` (string, required): Article title
- `language` (string, optional): Wikipedia language code (default: 'en')

### get_sections
- `title` (string, required): Article title
- `language` (string, optional): Wikipedia language code (default: 'en')

### get_coordinates
- `title` (string, required): Article title
- `language` (string, optional): Wikipedia language code (default: 'en')

### get_related_topics
- `title` (string, required): Article title
- `limit` (number, optional): Maximum results (1-50, default: 10)
- `language` (string, optional): Wikipedia language code (default: 'en')

### get_article_by_pageid
- `pageid` (number, required): Stable Wikipedia page ID
- `language` (string, optional): Wikipedia language code (default: `en`)

### get_page_links
- `title` (string, required): Article title
- `limit` (number, optional): Maximum links per page (1-500, default: 100)
- `continueToken` (string, optional): Continue token from a previous call
- `language` (string, optional): Wikipedia language code (default: `en`)

### get_page_revisions
- `title` (string, required): Article title
- `limit` (number, optional): Maximum revisions (1-50, default: 10)
- `language` (string, optional): Wikipedia language code (default: `en`)

### get_citations
- `title` (string, required): Article title
- `limit` (number, optional): Maximum citations (1-200, default: 50)
- `language` (string, optional): Wikipedia language code (default: `en`)

### get_infobox
- `title` (string, required): Article title
- `language` (string, optional): Wikipedia language code (default: `en`)

### get_disambiguation_options
- `title` (string, required): Possibly ambiguous title
- `limit` (number, optional): Maximum options (1-50, default: 20)
- `language` (string, optional): Wikipedia language code (default: `en`)

## Architecture

This MCP server is built using:
- **Next.js 15** - React framework for production
- **mcp-handler** - Official MCP handler package for Vercel
- **Wikipedia API** - MediaWiki Action API for Wikipedia data
- **Vercel Functions** - Serverless functions with Fluid Compute

## Performance & Scaling

The server leverages Vercel's Fluid Compute features:
- **Optimized Concurrency** - Efficient request handling
- **Dynamic Scaling** - Scales based on demand
- **Minimal Idle Time** - Pay only for what you use

## Troubleshooting

### MCP client can't connect
- Verify your MCP endpoint URL is correct: `https://your-project.vercel.app/api/mcp`
- Check that the deployment is successful in Vercel dashboard
- Try accessing the root URL to see if the server is running

### Tools not showing up
- Restart your MCP client (Claude Desktop, Cursor, etc.)
- Check the MCP client logs for connection errors
- Verify the configuration file syntax is correct

### Wikipedia API errors
- Most errors are due to incorrect article titles (they're case-sensitive)
- Some articles may not exist in the specified language
- Rate limiting may occur with excessive requests

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this in your own projects!

## Credits

Based on the [wikipedia-mcp](https://github.com/Rudra-ravi/wikipedia-mcp) Python implementation by [Rudra-ravi](https://github.com/Rudra-ravi), adapted for Vercel deployment using TypeScript and the `mcp-handler` package.

## Resources

- [Vercel MCP Documentation](https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Wikipedia API Documentation](https://www.mediawiki.org/wiki/API:Main_page)
