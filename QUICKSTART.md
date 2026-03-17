# Quick Deployment Guide

## 🚀 Deploy Your Wikipedia MCP Server to Vercel in 3 Steps

### Step 1: Get Your Code Ready

Download the `wikipedia-mcp-vercel` folder and navigate to it:

```bash
cd wikipedia-mcp-vercel
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Option B: Using GitHub + Vercel Dashboard**

1. Create a new GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
3. Go to https://vercel.com/new
4. Import your GitHub repository
5. Click "Deploy"

---

## 📝 After Deployment

You'll get a URL like: `https://your-project.vercel.app`

### Configure Your MCP Client

**For Claude Desktop:**

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
Or: `%APPDATA%/Claude/claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "wikipedia": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

**For Cursor:**

Edit: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "wikipedia": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

---

## 🧪 Test Your Server

### Using MCP Inspector (Local Testing)

```bash
# Start your dev server
npm run dev

# In another terminal, run the inspector
npx @modelcontextprotocol/inspector@latest http://localhost:3000
```

Then open `http://127.0.0.1:6274` in your browser.

---

## ✨ Available Tools

Once deployed and configured, you can ask your AI:

- "Search Wikipedia for quantum computing"
- "Get me information about the Eiffel Tower from Wikipedia"
- "What are the coordinates of Tokyo?"
- "Find related topics to artificial intelligence"
- "Search Japanese Wikipedia for information about anime"

---

## 🆘 Troubleshooting

**Can't connect to MCP server?**
- Verify the URL ends with `/api/mcp`
- Check your deployment status on Vercel dashboard
- Restart your MCP client

**Tools not appearing?**
- Restart your MCP client after configuration
- Check the JSON syntax in your config file
- Look at MCP client logs for errors

---

## 📚 Resources

- Full README: See `README.md` for detailed documentation
- Vercel Docs: https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel
- MCP Specification: https://modelcontextprotocol.io/

---

**Need help?** Check the README.md file for more detailed instructions!
