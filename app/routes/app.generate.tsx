import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { useLoaderData, Form } from '@remix-run/react';
import { authenticateAdmin } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticateAdmin(request);
  return json({ shop: session.shop });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticateAdmin(request);
  const formData = await request.formData();
  
  const productName = formData.get('productName') as string;
  const features = formData.get('features') as string;
  const keywords = formData.get('keywords') as string;
  const targetPlatform = formData.get('targetPlatform') as string;
  
  // Call AI to generate listing
  const { generateListing } = await import('~/services/ai-generator.server');
  const result = await generateListing({
    productName,
    features,
    keywords,
    targetPlatform: targetPlatform || 'shopify',
  });
  
  return json({ result });
}

export default function Generate() {
  const { shop } = useLoaderData<typeof loader>();
  
  return (
    <div className="page">
      <h1>AI Product Description Generator</h1>
      <p className="subtitle">Chinese input → English Amazon/Shopify listing</p>
      
      <Form method="post" className="form">
        <div className="form-group">
          <label>Product Name (Chinese)</label>
          <input type="text" name="productName" required placeholder="e.g. 无线蓝牙耳机" />
        </div>
        
        <div className="form-group">
          <label>Key Features (Chinese)</label>
          <textarea name="features" rows={4} placeholder="e.g. 降噪功能、续航30小时、IPX7防水" />
        </div>
        
        <div className="form-group">
          <label>Target Keywords (Optional)</label>
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
    </div>
  );
}
