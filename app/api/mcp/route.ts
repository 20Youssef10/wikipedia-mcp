import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';

function getWikipediaAPI(language: string = 'en') {
  return `https://${language}.wikipedia.org/w/api.php`;
}

async function wikipediaRequest(language: string, params: Record<string, string>) {
  const url = new URL(getWikipediaAPI(language));
  url.searchParams.append('format', 'json');
  url.searchParams.append('origin', '*');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  return response.json();
}

function getFirstPage(data: any) {
  const pages = data?.query?.pages;
  if (!pages) return null;
  return Object.values(pages)[0] as any;
}

function textResponse(payload: unknown, isError = false) {
  return {
    content: [{
      type: 'text' as const,
      text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)
    }],
    ...(isError ? { isError: true } : {})
  };
}

function extractInfobox(wikitext: string): { raw: string; fields: Record<string, string> } | null {
  const marker = '{{Infobox';
  const start = wikitext.indexOf(marker);
  if (start === -1) return null;

  let depth = 0;
  let end = -1;

  for (let i = start; i < wikitext.length - 1; i++) {
    const pair = wikitext.slice(i, i + 2);
    if (pair === '{{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (pair === '}}') {
      depth -= 1;
      i += 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) return null;

  const raw = wikitext.slice(start, end + 1);
  const fields: Record<string, string> = {};
  const lines = raw.split('\n').map((line) => line.trim());

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const withoutPrefix = line.slice(1);
    const separatorIndex = withoutPrefix.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = withoutPrefix.slice(0, separatorIndex).trim();
    const value = withoutPrefix.slice(separatorIndex + 1).trim();
    if (key) fields[key] = value;
  }

  return { raw, fields };
}

function extractReferences(html: string, limit: number) {
  const refs = new Set<string>();
  const hrefRegex = /<a[^>]*href="([^"]+)"[^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://')) {
      refs.add(href);
      if (refs.size >= limit) break;
    }
  }

  return Array.from(refs);
}

const handler = createMcpHandler(
  (server) => {
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
          const data = await wikipediaRequest(language, {
            action: 'opensearch',
            search: query,
            limit: limit.toString()
          });

          const [, titles, descriptions, urls] = data;
          const results = titles.map((title: string, i: number) => ({
            title,
            description: descriptions[i],
            url: urls[i]
          }));

          return textResponse({ query, results, count: results.length });
        } catch (error) {
          return textResponse(`Error searching Wikipedia: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_article',
      'Get the full content of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'query',
            titles: title,
            prop: 'extracts|categories|links|info',
            explaintext: '1',
            inprop: 'url'
          });

          const page = getFirstPage(data);
          if (!page || page.missing) {
            return textResponse(`Article "${title}" not found on ${language} Wikipedia`, true);
          }

          return textResponse({
            title: page.title,
            pageid: page.pageid,
            content: page.extract,
            url: page.fullurl,
            categories: page.categories?.map((c: any) => c.title) || [],
            links: page.links?.slice(0, 20).map((l: any) => l.title) || []
          });
        } catch (error) {
          return textResponse(`Error fetching article: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_article_by_pageid',
      'Get the full content of a Wikipedia article using a page ID',
      {
        pageid: z.number().int().positive().describe('Wikipedia page ID'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ pageid, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'query',
            pageids: pageid.toString(),
            prop: 'extracts|categories|info',
            explaintext: '1',
            inprop: 'url'
          });

          const page = getFirstPage(data);
          if (!page || page.missing) {
            return textResponse(`Page ID "${pageid}" was not found on ${language} Wikipedia`, true);
          }

          return textResponse({
            title: page.title,
            pageid: page.pageid,
            content: page.extract,
            url: page.fullurl,
            categories: page.categories?.map((c: any) => c.title) || []
          });
        } catch (error) {
          return textResponse(`Error fetching article by page ID: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_summary',
      'Get a concise summary of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'query',
            titles: title,
            prop: 'extracts',
            exintro: '1',
            explaintext: '1'
          });

          const page = getFirstPage(data);
          if (!page || page.missing) {
            return textResponse(`Article "${title}" not found`, true);
          }

          return textResponse({ title: page.title, summary: page.extract });
        } catch (error) {
          return textResponse(`Error fetching summary: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_sections',
      'Get the sections of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'parse',
            page: title,
            prop: 'sections'
          });

          if (data.error) {
            return textResponse(`Error: ${data.error.info}`, true);
          }

          const sections = data.parse.sections.map((s: any) => ({
            level: s.level,
            title: s.line,
            index: s.index
          }));

          return textResponse({ title: data.parse.title, sections });
        } catch (error) {
          return textResponse(`Error fetching sections: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_coordinates',
      'Get the geographic coordinates of a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'query',
            titles: title,
            prop: 'coordinates'
          });

          const page = getFirstPage(data);
          if (!page || page.missing) {
            return textResponse(`Article "${title}" not found`, true);
          }

          if (!page.coordinates || page.coordinates.length === 0) {
            return textResponse({
              title: page.title,
              message: 'No coordinates available for this article'
            });
          }

          return textResponse({
            title: page.title,
            pageid: page.pageid,
            coordinates: page.coordinates
          });
        } catch (error) {
          return textResponse(`Error fetching coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

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
          const data = await wikipediaRequest(language, {
            action: 'query',
            titles: title,
            prop: 'links',
            pllimit: limit.toString()
          });

          const page = getFirstPage(data);
          if (!page || page.missing) {
            return textResponse(`Article "${title}" not found`, true);
          }

          const relatedTopics = page.links?.map((l: any) => l.title) || [];
          return textResponse({ title: page.title, relatedTopics, count: relatedTopics.length });
        } catch (error) {
          return textResponse(`Error fetching related topics: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_page_links',
      'Get internal links from a Wikipedia article with pagination support',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        limit: z.number().int().min(1).max(500).optional().default(100).describe('Maximum links per page'),
        continueToken: z.string().optional().describe('Continuation token from previous response'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, limit, continueToken, language }) => {
        try {
          const params: Record<string, string> = {
            action: 'query',
            titles: title,
            prop: 'links',
            pllimit: limit.toString()
          };

          if (continueToken) {
            params.plcontinue = continueToken;
          }

          const data = await wikipediaRequest(language, params);
          const page = getFirstPage(data);

          if (!page || page.missing) {
            return textResponse(`Article "${title}" not found`, true);
          }

          const links = page.links?.map((l: any) => l.title) || [];

          return textResponse({
            title: page.title,
            links,
            count: links.length,
            nextContinueToken: data.continue?.plcontinue || null
          });
        } catch (error) {
          return textResponse(`Error fetching page links: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_page_revisions',
      'Get recent revision history for a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        limit: z.number().int().min(1).max(50).optional().default(10).describe('Maximum number of revisions'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, limit, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'query',
            titles: title,
            prop: 'revisions',
            rvprop: 'ids|timestamp|user|comment',
            rvlimit: limit.toString()
          });

          const page = getFirstPage(data);
          if (!page || page.missing) {
            return textResponse(`Article "${title}" not found`, true);
          }

          const revisions = (page.revisions || []).map((r: any) => ({
            revid: r.revid,
            parentid: r.parentid,
            timestamp: r.timestamp,
            user: r.user,
            comment: r.comment || ''
          }));

          return textResponse({ title: page.title, pageid: page.pageid, revisions, count: revisions.length });
        } catch (error) {
          return textResponse(`Error fetching revisions: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_citations',
      'Extract citation URLs and references from a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        limit: z.number().int().min(1).max(200).optional().default(50).describe('Maximum citations to return'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, limit, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'parse',
            page: title,
            prop: 'externallinks|text'
          });

          if (data.error) {
            return textResponse(`Error: ${data.error.info}`, true);
          }

          const externalLinks = (data.parse?.externallinks || []).slice(0, limit);
          const html = data.parse?.text?.['*'] || '';
          const htmlRefs = extractReferences(html, limit);

          const all = Array.from(new Set([...externalLinks, ...htmlRefs])).slice(0, limit);

          return textResponse({
            title: data.parse?.title || title,
            citations: all,
            count: all.length,
            truncated: all.length >= limit
          });
        } catch (error) {
          return textResponse(`Error fetching citations: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_infobox',
      'Extract infobox key-value facts from a Wikipedia article',
      {
        title: z.string().describe('The title of the Wikipedia article'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'parse',
            page: title,
            prop: 'wikitext'
          });

          if (data.error) {
            return textResponse(`Error: ${data.error.info}`, true);
          }

          const wikitext: string = data.parse?.wikitext?.['*'] || '';
          const infobox = extractInfobox(wikitext);

          if (!infobox) {
            return textResponse({
              title: data.parse?.title || title,
              message: 'No infobox found',
              infobox: {},
              rawInfobox: ''
            });
          }

          return textResponse({
            title: data.parse?.title || title,
            infobox: infobox.fields,
            rawInfobox: infobox.raw
          });
        } catch (error) {
          return textResponse(`Error fetching infobox: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );

    server.tool(
      'get_disambiguation_options',
      'Resolve whether a title is a disambiguation page and return candidate options',
      {
        title: z.string().describe('The title to resolve'),
        limit: z.number().int().min(1).max(50).optional().default(20).describe('Maximum candidate options'),
        language: z.string().optional().default('en').describe('Wikipedia language code')
      },
      async ({ title, limit, language }) => {
        try {
          const data = await wikipediaRequest(language, {
            action: 'query',
            titles: title,
            redirects: '1',
            prop: 'pageprops|description|links',
            pllimit: limit.toString()
          });

          const page = getFirstPage(data);
          if (!page || page.missing) {
            return textResponse(`Title "${title}" not found`, true);
          }

          const isDisambiguation = Boolean(page.pageprops?.disambiguation) || /\(disambiguation\)$/i.test(page.title || '');
          if (!isDisambiguation) {
            return textResponse({
              title: page.title,
              isDisambiguation: false,
              message: 'Title resolves to a direct article'
            });
          }

          const options = (page.links || []).map((l: any) => ({ title: l.title })).slice(0, limit);

          return textResponse({
            title: page.title,
            isDisambiguation: true,
            options,
            count: options.length
          });
        } catch (error) {
          return textResponse(`Error resolving disambiguation: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
    );
  },
  {},
  { basePath: '/api' }
);

export { handler as GET, handler as POST, handler as DELETE };
