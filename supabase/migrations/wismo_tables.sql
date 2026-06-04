-- WISMO AI - Database Migration
-- Run this in Supabase SQL Editor

-- ==========================================
-- Table: wismo_settings (per-store widget config)
-- ==========================================
CREATE TABLE IF NOT EXISTS wismo_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop TEXT NOT NULL UNIQUE REFERENCES stores(shop) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  widget_position TEXT DEFAULT 'bottom-right' CHECK (widget_position IN ('bottom-right', 'bottom-left')),
  widget_color TEXT DEFAULT '#008060',
  greeting TEXT DEFAULT 'Hi! 👋 How can I help you today?',
  brand_name TEXT,
  auto_reply_language TEXT DEFAULT 'auto', -- auto-detect or specific language code
  faq_items JSONB DEFAULT '[]', -- [{question: "...", answer: "..."}]
  business_hours JSONB DEFAULT '{"enabled": false, "timezone": "UTC", "schedule": {}}', 
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Table: wismo_conversations (customer chat sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS wismo_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop TEXT NOT NULL,
  customer_id TEXT, -- Shopify customer ID if available
  customer_email TEXT,
  customer_name TEXT,
  customer_locale TEXT DEFAULT 'en',
  source TEXT DEFAULT 'widget', -- widget, email, etc
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'handoff')),
  first_message TEXT, -- preview of first message
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Table: wismo_messages (individual messages)
-- ==========================================
CREATE TABLE IF NOT EXISTS wismo_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES wismo_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('customer', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT, -- wismo, faq, general, handoff
  metadata JSONB DEFAULT '{}', -- order_id, tracking info, etc
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Table: wismo_analytics (daily stats per store)
-- ==========================================
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

-- ==========================================
-- Indexes for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_wismo_conversations_shop ON wismo_conversations(shop);
CREATE INDEX IF NOT EXISTS idx_wismo_conversations_status ON wismo_conversations(shop, status);
CREATE INDEX IF NOT EXISTS idx_wismo_messages_conversation ON wismo_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wismo_analytics_shop_date ON wismo_analytics(shop, date);

-- ==========================================
-- RLS Policies
-- ==========================================
ALTER TABLE wismo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wismo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wismo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wismo_analytics ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by backend)
CREATE POLICY "Service role full access" ON wismo_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wismo_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wismo_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wismo_analytics FOR ALL USING (true) WITH CHECK (true);
