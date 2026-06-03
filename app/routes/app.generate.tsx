import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, Form, useActionData } from '@remix-run/react';
import { authenticateAdmin } from '~/shopify.server';
import { generateDescription } from '~/services/ai-generator.server';
import { getMonthlyUsage } from '~/services/supabase.server';
import type { GenerationInput, TargetPlatform } from '~/types';

interface ActionResult {
  error?: string;
  result?: {
    success: boolean;
    output?: {
      shortTitle: string;
      bulletPoints: string[];
      productDescription: string;
      seoKeywords: string[];
      backendSearchTerms: string;
    };
    tokensUsed?: number;
    error?: string;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { session } = await authenticateAdmin(request);
    const usage = await getMonthlyUsage(session.shop);
    return json({ 
      shop: session.shop, 
      status: 'ok' as const,
      usage,
    });
  } catch {
    return json({ shop: null, status: 'unauthenticated' as const, usage: null });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticateAdmin(request);
  const formData = await request.formData();

  const productName = formData.get('productName') as string;
  const features = formData.get('features') as string;
  const keywords = formData.get('keywords') as string;
  const category = formData.get('category') as string;
  const targetPlatform = (formData.get('targetPlatform') as string || 'shopify') as TargetPlatform;

  if (!productName) {
    return json<ActionResult>({ error: 'Product name is required' });
  }

  const input: GenerationInput = {
    productName,
    features: features || undefined,
    keywords: keywords || undefined,
    category: category || undefined,
    targetPlatform,
  };

  const result = await generateDescription(input, session.shop);
  return json<ActionResult>({ result });
}

export default function Generate() {
  const { shop, status, usage } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (status === 'unauthenticated') {
    return (
      <div className="page">
        <h1>AI Product Description Generator</h1>
        <div className="card">
          <p>Please install the app from your Shopify admin to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>AI Product Description Generator</h1>
      <p className="subtitle">Write in your language, get English product descriptions that sell</p>
      <p className="supported-languages">Supports Chinese, Japanese, Korean, Spanish, French, German, Arabic, Hindi, Portuguese, Russian & 20+ more languages</p>

      {usage && (
        <div className="usage-bar">
          Monthly usage: {usage.count}/{usage.limit === Infinity ? '∞' : usage.limit}
        </div>
      )}

      <Form method="post" className="form">
        <div className="form-group">
          <label>Product Name *</label>
          <input type="text" name="productName" required placeholder="e.g. Wireless Bluetooth Earbuds / 无线蓝牙耳机 / ワイヤレスイヤホン" />
        </div>

        <div className="form-group">
          <label>Category (optional)</label>
          <input type="text" name="category" placeholder="e.g. Electronics, Home & Kitchen / 电子产品、家居用品" />
        </div>

        <div className="form-group">
          <label>Key Features</label>
          <textarea name="features" rows={4} placeholder={"e.g. Noise canceling, 30-hour battery, IPX7 waterproof\nOne feature per line, any language"} />
        </div>

        <div className="form-group">
          <label>Target Keywords (optional)</label>
          <input type="text" name="keywords" placeholder="e.g. wireless earbuds, noise canceling" />
        </div>

        <div className="form-group">
          <label>Target Platform</label>
          <select name="targetPlatform">
            <option value="shopify">Shopify</option>
            <option value="amazon">Amazon</option>
            <option value="both">Both</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">Generate Description</button>
      </Form>

      {actionData?.error && (
        <div className="error-card">
          <h3>Error</h3>
          <p>{actionData.error}</p>
        </div>
      )}

      {actionData?.result && (
        <div className="result-card">
          {actionData.result.success ? (
            <>
              <h3>Generated Listing ✅</h3>
              {actionData.result.output?.shortTitle && (
                <div className="result-section">
                  <h4>Short Title</h4>
                  <p className="result-title">{actionData.result.output.shortTitle}</p>
                </div>
              )}
              {actionData.result.output?.bulletPoints && actionData.result.output.bulletPoints.length > 0 && (
                <div className="result-section">
                  <h4>Bullet Points</h4>
                  <ul>
                    {actionData.result.output.bulletPoints.map((bp: string, i: number) => (
                      <li key={i}>{bp}</li>
                    ))}
                  </ul>
                </div>
              )}
              {actionData.result.output?.productDescription && (
                <div className="result-section">
                  <h4>Product Description</h4>
                  <p>{actionData.result.output.productDescription}</p>
                </div>
              )}
              {actionData.result.output?.seoKeywords && actionData.result.output.seoKeywords.length > 0 && (
                <div className="result-section">
                  <h4>SEO Keywords</h4>
                  <div className="keyword-tags">
                    {actionData.result.output.seoKeywords.map((kw: string, i: number) => (
                      <span key={i} className="keyword-tag">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              {actionData.result.output?.backendSearchTerms && (
                <div className="result-section">
                  <h4>Backend Search Terms</h4>
                  <p className="result-small">{actionData.result.output.backendSearchTerms}</p>
                </div>
              )}
              {actionData.result.tokensUsed && (
                <p className="tokens-info">Tokens used: {actionData.result.tokensUsed}</p>
              )}
            </>
          ) : (
            <>
              <h3>Generation Failed ❌</h3>
              <p>{actionData.result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
