import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticateAdmin } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticateAdmin(request);
  return json({ shop: session.shop });
}

export default function Billing() {
  return (
    <div className="page">
      <h1>Subscription Plans</h1>
      <div className="plans">
        <div className="plan-card">
          <h2>Free</h2>
          <div className="price">$0/month</div>
          <ul>
            <li>5 generations/month</li>
            <li>Amazon format</li>
            <li>Basic keywords</li>
          </ul>
        </div>
        <div className="plan-card featured">
          <h2>Starter</h2>
          <div className="price">$19/month</div>
          <ul>
            <li>100 generations/month</li>
            <li>Amazon + Shopify</li>
            <li>Batch generate (10)</li>
            <li>7-day free trial</li>
          </ul>
        </div>
        <div className="plan-card">
          <h2>Pro</h2>
          <div className="price">$39/month</div>
          <ul>
            <li>Unlimited generations</li>
            <li>All platforms</li>
            <li>Brand voice</li>
            <li>Priority support</li>
            <li>7-day free trial</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
