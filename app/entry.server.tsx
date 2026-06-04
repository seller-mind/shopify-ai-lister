import { RemixServer } from '@remix-run/react';
import { handleRequest } from '@vercel/remix';
import type { EntryContext } from '@remix-run/node';

export default async function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const remixServer = <RemixServer context={remixContext} url={request.url} />;
  return handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixServer,
  );
}
