-- Haimo AI Lister - Supabase 数据库建表脚本
-- 在 Supabase Dashboard > SQL Editor 中执行

-- stores表：存储已安装App的店铺信息
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'FREE',
  settings JSONB DEFAULT '{}',
  installed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- generations表：AI生成记录
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  product_id TEXT,
  product_title TEXT,
  input JSONB NOT NULL,
  output JSONB,
  status TEXT DEFAULT 'pending',
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- shopify_sessions表：Shopify OAuth sessions
CREATE TABLE IF NOT EXISTS shopify_sessions (
  id TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  state TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  access_token TEXT NOT NULL,
  scope TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_generations_store_id ON generations(store_id);
CREATE INDEX IF NOT EXISTS idx_generations_shop_domain ON generations(shop_domain);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations(created_at);
CREATE INDEX IF NOT EXISTS idx_stores_shop ON stores(shop);
CREATE INDEX IF NOT EXISTS idx_sessions_shop ON shopify_sessions(shop);

-- RLS策略（允许service_role全量访问）
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on stores" ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on generations" ON generations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on shopify_sessions" ON shopify_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- anon也允许读写（App后端通过service_role操作，anon用于可能的客户端调用）
CREATE POLICY "Anon read access on stores" ON stores FOR SELECT TO anon USING (true);
CREATE POLICY "Anon read access on generations" ON generations FOR SELECT TO anon USING (true);
CREATE POLICY "Anon insert access on shopify_sessions" ON shopify_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon select access on shopify_sessions" ON shopify_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Anon update access on shopify_sessions" ON shopify_sessions FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon delete access on shopify_sessions" ON shopify_sessions FOR DELETE TO anon USING (true);
CREATE POLICY "Anon insert on stores" ON stores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon update on stores" ON stores FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon insert on generations" ON generations FOR INSERT TO anon WITH CHECK (true);
