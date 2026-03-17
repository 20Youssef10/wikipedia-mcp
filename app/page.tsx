export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Wikipedia MCP Server</h1>
        <p className="text-xl mb-8">Model Context Protocol server for Wikipedia</p>
        
        <div className="bg-gray-100 p-6 rounded-lg max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">Available Tools</h2>
          <ul className="text-left space-y-2">
            <li>🔍 <strong>search_wikipedia</strong> - Search Wikipedia articles</li>
            <li>📄 <strong>get_article</strong> - Get full article content</li>
            <li>📝 <strong>get_summary</strong> - Get article summary</li>
            <li>📑 <strong>get_sections</strong> - Get article sections</li>
            <li>🌍 <strong>get_coordinates</strong> - Get geographic coordinates</li>
            <li>🔗 <strong>get_related_topics</strong> - Get related topics</li>
          </ul>
        </div>
        
        <div className="mt-8 text-sm text-gray-600">
          <p>MCP Endpoint: <code className="bg-gray-100 px-2 py-1 rounded">/api/mcp</code></p>
        </div>
      </div>
    </main>
  );
}
