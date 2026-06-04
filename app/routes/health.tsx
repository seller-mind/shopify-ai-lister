import { json } from '@remix-run/node';

export async function loader() {
  return json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasShopifyKey: !!process.env.SHOPIFY_API_KEY,
      hasShopifySecret: !!process.env.SHOPIFY_API_SECRET,
      hasShopifyUrl: !!process.env.SHOPIFY_APP_URL,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasDeepseek: !!process.env.DEEPSEEK_API_KEY,
      shopifyUrl: process.env.SHOPIFY_APP_URL || 'NOT_SET',
    }
  });
}

export default function HealthPage() {
  return <div>Health check - see JSON response</div>;
}
