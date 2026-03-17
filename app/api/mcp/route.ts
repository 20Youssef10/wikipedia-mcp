import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';

// Wikipedia API base URL
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';

// Helper function to make Wikipedia API requests
async function wikipediaRequest(params: Record<string, string>) {
  const url = new URL(WIKIPEDIA_API);
  url.searchParams.append('format', 'json');
  url.searchParams.append('origin', '*');
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  return response.json();
}

// Helper to get language-specific Wikipedia API
function getWikipediaAPI(language: string = 'en') {
  return `https://${language}.wikipedia.org/w/api.php`;
}

const handler = createMcpHandler(
  (server) => {
    // Tool 1: Search Wikipedia
    server.tool(
      'search_wikipedia',
      'Search Wikipedia for articles matching a query',
      {
        query: z.string().describe('The search term'),
        limit: z.number().int().min(1).max(50).optional().default(10).describe('Maximum number of results'),
        language: z.string().optional().default('en').describe('Wikipedia language code (e.g., en, es, fr, ja, zh)')
      },
      async ({ query, limit, language }) => {
        try {
          const apiUrl = getWikipediaAPI(language);
          const url = new URL(apiUrl);
          url.searchParams.append('action', 'opensearch');
          url.searchParams.append('search', query);
          url.searchParams.append('limit', limit.toString());
          url.searchParams.append('format', 'json');
          url.searchParams.append('origin', '*');

          const response = await fetch(url.toString());
          const data = await response.json();

          const [, titles, descriptions, urls] = data;
          const results = titles.map((title: string, i: number) => ({
            title,
            description: descriptions[i],
            url: urls[i]
          }));

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ query, results, count: results.length }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error searching Wikipedia: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 2: Get Article Content
    server.tool(
      'get_article',
      'Get the full content of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const apiUrl = getWikipediaAPI(language);
          const url = new URL(apiUrl);
          url.searchParams.append('action', 'query');
          url.searchParams.append('titles', title);
          url.searchParams.append('prop', 'extracts|categories|links|info');
          url.searchParams.append('explaintext', '1');
          url.searchParams.append('inprop', 'url');
          url.searchParams.append('format', 'json');
          url.searchParams.append('origin', '*');

          const response = await fetch(url.toString());
          const data = await response.json();
          const pages = data.query.pages;
          const page = Object.values(pages)[0] as any;

          if (page.missing) {
            return {
              content: [{
                type: 'text',
                text: `Article "${title}" not found on ${language} Wikipedia`
              }],
              isError: true
            };
          }

          const article = {
            title: page.title,
            pageid: page.pageid,
            content: page.extract,
            url: page.fullurl,
            categories: page.categories?.map((c: any) => c.title) || [],
            links: page.links?.slice(0, 20).map((l: any) => l.title) || []
          };

          return {
            content: [{
              type: 'text',
              text: JSON.stringify(article, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching article: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 3: Get Article Summary
    server.tool(
      'get_summary',
      'Get a concise summary of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const apiUrl = getWikipediaAPI(language);
          const url = new URL(apiUrl);
          url.searchParams.append('action', 'query');
          url.searchParams.append('titles', title);
          url.searchParams.append('prop', 'extracts');
          url.searchParams.append('exintro', '1');
          url.searchParams.append('explaintext', '1');
          url.searchParams.append('format', 'json');
          url.searchParams.append('origin', '*');

          const response = await fetch(url.toString());
          const data = await response.json();
          const pages = data.query.pages;
          const page = Object.values(pages)[0] as any;

          if (page.missing) {
            return {
              content: [{
                type: 'text',
                text: `Article "${title}" not found`
              }],
              isError: true
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                title: page.title,
                summary: page.extract
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching summary: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 4: Get Article Sections
    server.tool(
      'get_sections',
      'Get the sections of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const apiUrl = getWikipediaAPI(language);
          const url = new URL(apiUrl);
          url.searchParams.append('action', 'parse');
          url.searchParams.append('page', title);
          url.searchParams.append('prop', 'sections');
          url.searchParams.append('format', 'json');
          url.searchParams.append('origin', '*');

          const response = await fetch(url.toString());
          const data = await response.json();

          if (data.error) {
            return {
              content: [{
                type: 'text',
                text: `Error: ${data.error.info}`
              }],
              isError: true
            };
          }

          const sections = data.parse.sections.map((s: any) => ({
            level: s.level,
            title: s.line,
            index: s.index
          }));

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                title: data.parse.title,
                sections
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching sections: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 5: Get Article Coordinates
    server.tool(
      'get_coordinates',
      'Get the geographic coordinates of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const apiUrl = getWikipediaAPI(language);
          const url = new URL(apiUrl);
          url.searchParams.append('action', 'query');
          url.searchParams.append('titles', title);
          url.searchParams.append('prop', 'coordinates');
          url.searchParams.append('format', 'json');
          url.searchParams.append('origin', '*');

          const response = await fetch(url.toString());
          const data = await response.json();
          const pages = data.query.pages;
          const page = Object.values(pages)[0] as any;

          if (page.missing) {
            return {
              content: [{
                type: 'text',
                text: `Article "${title}" not found`
              }],
              isError: true
            };
          }

          if (!page.coordinates || page.coordinates.length === 0) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  title: page.title,
                  message: 'No coordinates available for this article'
                }, null, 2)
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                title: page.title,
                pageid: page.pageid,
                coordinates: page.coordinates
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );

    // Tool 6: Get Related Topics
    server.tool(
      'get_related_topics',
      'Get topics related to a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        limit: z.number().int().min(1).max(50).optional().default(10).describe('Maximum number of related topics'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, limit, language }) => {
        try {
          const apiUrl = getWikipediaAPI(language);
          const url = new URL(apiUrl);
          url.searchParams.append('action', 'query');
          url.searchParams.append('titles', title);
          url.searchParams.append('prop', 'links');
          url.searchParams.append('pllimit', limit.toString());
          url.searchParams.append('format', 'json');
          url.searchParams.append('origin', '*');

          const response = await fetch(url.toString());
          const data = await response.json();
          const pages = data.query.pages;
          const page = Object.values(pages)[0] as any;

          if (page.missing) {
            return {
              content: [{
                type: 'text',
                text: `Article "${title}" not found`
              }],
              isError: true
            };
          }

          const relatedTopics = page.links?.map((l: any) => l.title) || [];

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                title: page.title,
                relatedTopics,
                count: relatedTopics.length
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching related topics: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    );
  },
  {},
  { basePath: '/api' }
);

export { handler as GET, handler as POST, handler as DELETE };
