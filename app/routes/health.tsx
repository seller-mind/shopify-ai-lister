import { json } from '@remix-run/node';

/**
 * Health check endpoint
 * Only exposes status — no sensitive information
 */
export async function loader() {
  // Basic health check without exposing any environment details
  const isHealthy = !!(process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_SECRET && process.env.SUPABASE_URL);
  
  return json({ 
    status: isHealthy ? 'ok' : 'degraded', 
    timestamp: new Date().toISOString(),
  });
}

export default function HealthPage() {
  return <div>Health check - see JSON response</div>;
}
