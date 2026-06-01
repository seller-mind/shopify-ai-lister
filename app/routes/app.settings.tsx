import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticateAdmin } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticateAdmin(request);
  return json({ shop: session.shop });
}

export default function Settings() {
  return (
    <div className="page">
      <h1>Settings</h1>
      <div className="card">
        <p>App settings coming soon.</p>
      </div>
    </div>
  );
}
