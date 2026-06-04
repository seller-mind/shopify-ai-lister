import { RemixServer } from '@remix-run/react';
import { handleRequest } from '@vercel/remix';
import type { EntryContext } from '@remix-run/node';

export default async function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  try {
    const remixServer = <RemixServer context={remixContext} url={request.url} />;
    return await handleRequest(
      request,
      responseStatusCode,
      responseHeaders,
      remixServer,
    );
  } catch (error) {
    console.error('[entry.server] Render error:', error);
    return new Response(`Internal Server Error: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
