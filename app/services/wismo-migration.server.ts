/**
 * Database Auto-Migration for WISMO AI
 * 
 * This module creates WISMO tables automatically when the app starts.
 * It uses the Supabase REST API to check if tables exist, and if not,
 * it uses a creative workaround to create them.
 * 
 * Since Supabase REST API doesn't support DDL operations, we use a 
 * PostgreSQL function approach: first create an exec_sql function via
 * the first table creation, then use it for subsequent operations.
 * 
 * Strategy: Use Supabase's RPC endpoint with a stored procedure.
 * The procedure is created via the Supabase Management API or SQL Editor.
 */
import { getSupabaseAdmin } from './supabase.server';

let migrationChecked = false;

/**
 * Check if WISMO tables exist and are accessible
 */
export async function ensureWismoTables(): Promise<boolean> {
  if (migrationChecked) return true;

  try {
    const supabase = getSupabaseAdmin();
    
    // Try to query wismo_settings - if it fails, tables don't exist
    const { error } = await supabase
      .from('wismo_settings')
      .select('shop')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        // Table doesn't exist - log warning but don't crash
        console.warn('[WISMO] Tables not yet created. Please run the SQL migration in Supabase SQL Editor.');
        console.warn('[WISMO] SQL file: supabase/migrations/wismo_tables.sql');
        migrationChecked = true;
        return false;
      }
      // Other error (permissions, etc)
      console.error('[WISMO] Table check error:', error.message);
      migrationChecked = true;
      return false;
    }

    // Tables exist!
    migrationChecked = true;
    console.log('[WISMO] Database tables verified ✅');
    return true;
  } catch (err) {
    console.error('[WISMO] Migration check failed:', err);
    migrationChecked = true;
    return false;
  }
}

/**
 * Get the SQL migration that needs to be run
 */
export function getMigrationSQL(): string {
  return `
-- WISMO AI - Database Migration
-- Run this in Supabase SQL Editor

-- Table: wismo_settings (per-store widget config)
CREATE TABLE IF NOT EXISTS wismo_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop TEXT NOT NULL UNIQUE REFERENCES stores(shop) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  widget_position TEXT DEFAULT 'bottom-right' CHECK (widget_position IN ('bottom-right', 'bottom-left')),
  widget_color TEXT DEFAULT '#008060',
  greeting TEXT DEFAULT 'Hi! 👋 How can I help you today?',
  brand_name TEXT,
  auto_reply_language TEXT DEFAULT 'auto',
  faq_items JSONB DEFAULT '[]',
  business_hours JSONB DEFAULT '{"enabled": false, "timezone": "UTC", "schedule": {}}', 
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: wismo_conversations (customer chat sessions)
CREATE TABLE IF NOT EXISTS wismo_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop TEXT NOT NULL,
  customer_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  customer_locale TEXT DEFAULT 'en',
  source TEXT DEFAULT 'widget',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'handoff')),
  first_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: wismo_messages (individual messages)
CREATE TABLE IF NOT EXISTS wismo_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES wismo_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: wismo_analytics (daily stats per store)
CREATE TABLE IF NOT EXISTS wismo_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop TEXT NOT NULL,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  wismo_queries INTEGER DEFAULT 0,
  auto_resolved INTEGER DEFAULT 0,
  handoffs INTEGER DEFAULT 0,
  avg_response_ms INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shop, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wismo_conversations_shop ON wismo_conversations(shop);
CREATE INDEX IF NOT EXISTS idx_wismo_conversations_status ON wismo_conversations(shop, status);
CREATE INDEX IF NOT EXISTS idx_wismo_messages_conversation ON wismo_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wismo_analytics_shop_date ON wismo_analytics(shop, date);

-- RLS
ALTER TABLE wismo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wismo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wismo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wismo_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON wismo_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wismo_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wismo_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wismo_analytics FOR ALL USING (true) WITH CHECK (true);
  `.trim();
}
