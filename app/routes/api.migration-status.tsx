/**
 * GET /api/migration-status - Check if WISMO tables exist
 * POST /api/migration-status - Get the SQL to run
 */
import { json } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { getSupabaseAdmin } from '~/services/supabase.server';
import { getMigrationSQL } from '~/services/wismo-migration.server';

const MIGRATION_KEY = 'wismo_migrate_2026';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  if (key !== MIGRATION_KEY) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  const tables = ['wismo_settings', 'wismo_conversations', 'wismo_messages', 'wismo_analytics'];
  const results: Record<string, boolean> = {};

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      results[table] = !error;
    } catch {
      results[table] = false;
    }
  }

  const allExist = Object.values(results).every(Boolean);

  return json({
    allTablesExist: allExist,
    tables: results,
    sqlUrl: allExist ? null : 'https://supabase.com/dashboard/project/sdeduzqplvsyttvnolxm/sql/new',
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  if (key !== MIGRATION_KEY) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  return json({
    sql: getMigrationSQL(),
    instructions: 'Copy the SQL above and run it in the Supabase SQL Editor at https://supabase.com/dashboard/project/sdeduzqplvsyttvnolxm/sql/new',
  });
}
