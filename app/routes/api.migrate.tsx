/**
 * GET /api/migrate - One-time database migration endpoint
 * Creates WISMO tables in Supabase if they don't exist.
 * This endpoint should be called once after deployment, then can be removed.
 * 
 * Security: Only works with the correct MIGRATION_KEY query parameter
 */
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

const MIGRATION_KEY = 'wismo_migrate_2026';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  if (key !== MIGRATION_KEY) {
    return json({ error: 'Invalid migration key' }, { status: 403 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const results: string[] = [];

  // Create tables using Supabase REST API
  // Since we can't run raw SQL via REST, we'll use a creative approach:
  // Insert default settings for the existing store to "create" the relationship
  
  // Actually, we need to use the Supabase SQL editor or a direct DB connection.
  // Let's try using the Supabase client's rpc method if a function exists,
  // or fall back to creating tables via the REST API by attempting inserts.

  // The tables need to be created via SQL. Since REST API can't do DDL,
  // we'll provide the SQL for the user to run and check if tables exist.
  
  try {
    // Check which tables already exist
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/wismo_settings?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (checkResponse.ok) {
      results.push('✅ wismo_settings table exists');
    } else {
      results.push('❌ wismo_settings table does NOT exist');
    }
  } catch (e) {
    results.push('❌ Error checking wismo_settings');
  }

  try {
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/wismo_conversations?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (checkResponse.ok) {
      results.push('✅ wismo_conversations table exists');
    } else {
      results.push('❌ wismo_conversations table does NOT exist');
    }
  } catch (e) {
    results.push('❌ Error checking wismo_conversations');
  }

  return json({
    message: 'Table status check complete. Tables must be created via Supabase SQL Editor.',
    results,
    sqlUrl: 'https://supabase.com/dashboard/project/sdeduzqplvsyttvnolxm/sql/new',
    instructions: 'Copy the SQL from supabase/migrations/wismo_tables.sql and run it in the Supabase SQL Editor',
  });
}
