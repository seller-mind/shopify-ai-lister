# Haimo AI Lister - Shopify App

> 🚀 AI产品描述生成器，专为跨境卖家设计（中文输入 → 英文Amazon/Shopify listing）

## 产品概述

Haimo AI Lister 是一款嵌入Shopify Admin的AI应用，帮助中国跨境电商卖家快速生成优化的英文产品描述。

### 核心功能

- 📝 **中文输入** - 直接输入中文产品信息
- 🌐 **双平台优化** - Amazon + Shopify双平台listing
- ⚡ **AI智能生成** - 基于Claude的英文描述生成
- 🔍 **SEO优化** - 内置跨境电商关键词策略
- 📊 **批量处理** - 支持批量生成（付费版）
- 💰 **灵活定价** - Free/Starter $19/Pro $39

## 技术栈

- **框架**: Shopify Remix App (React Router v7)
- **UI**: Shopify Polaris Design System
- **API**: Shopify GraphQL Admin API
- **数据库**: Supabase PostgreSQL
- **AI**: Claude API (Anthropic)
- **支付**: Shopify Billing API

## 项目结构

```
shopify-ai-lister/
├── app/
│   ├── routes/           # Remix路由
│   │   ├── app._index.tsx      # 首页仪表盘
│   │   ├── app.generate.tsx    # AI生成页面
│   │   ├── app.settings.tsx    # 设置页面
│   │   ├── app.billing.tsx     # 订阅管理
│   │   ├── auth.tsx            # OAuth回调
│   │   └── webhooks.*.ts       # GDPR Webhooks
│   ├── services/         # 业务服务
│   │   ├── ai-generator.server.ts    # Claude API
│   │   ├── shopify-api.server.ts     # GraphQL API
│   │   ├── billing.server.ts         # 计费
│   │   ├── usage-tracker.server.ts   # 用量追踪
│   │   └── supabase.server.ts         # 数据库
│   ├── types/             # TypeScript类型
│   ├── prompts/           # AI Prompt模板
│   ├── shopify.server.ts # Shopify配置
│   └── root.tsx           # 应用入口
├── prisma/
│   └── schema.prisma      # 数据库模型
├── package.json
├── shopify.app.toml       # Shopify配置
└── .env.example           # 环境变量示例
```

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- npm >= 10.0.0
- Shopify Partner账号
- Shopify开发商店
- Supabase项目
- Anthropic API Key

### 安装

```bash
# 克隆项目
git clone <repo-url>
cd shopify-ai-lister

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env

# 编辑.env配置
# SHOPIFY_API_KEY=your_api_key
# SHOPIFY_API_SECRET=your_api_secret
# ANTHROPIC_API_KEY=sk-ant-...
# SUPABASE_URL=https://sdeduzqplvsyttvnolxm.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_key

# 链接Shopify Partner配置
npm run config:link

# 启动开发服务器
npm run dev
```

### Shopify App初始化

```bash
# 使用Shopify CLI创建应用
shopify app init

# 选择 "Build a Remix app"
# 选择 TypeScript
```

## 环境变量

```bash
# Shopify
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
SHOPIFY_APP_URL=https://your-app-url.com
SCOPES=read_products,write_products

# Claude AI
ANTHROPIC_API_KEY=sk-ant-your_key

# Supabase
SUPABASE_URL=https://sdeduzqplvsyttvnolxm.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 数据库设置

Supabase项目已配置，连接地址：`sdeduzqplvsyttvnolxm.supabase.co`

需要创建的表：

```sql
-- stores表
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'FREE',
  settings JSONB,
  installed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- generations表
CREATE TABLE generations (
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

-- shopify_sessions表
CREATE TABLE shopify_sessions (
  id TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  state TEXT NOT NULL,
  is_online BOOLEAN DEFAULT false,
  access_token TEXT NOT NULL,
  scope TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_generations_store_id ON generations(store_id);
CREATE INDEX idx_generations_shop_domain ON generations(shop_domain);
CREATE INDEX idx_generations_created_at ON generations(created_at);
CREATE INDEX idx_stores_shop ON stores(shop);
CREATE INDEX idx_sessions_shop ON shopify_sessions(shop);
```

## 开发命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run deploy` | 部署到生产环境 |
| `npm run lint` | 运行ESLint |
| `npm run typecheck` | TypeScript类型检查 |

## 订阅计划

| 计划 | 价格 | 月生成次数 | 批量上限 |
|------|------|------------|----------|
| Free | $0 | 5次 | 1个 |
| Starter | $19/月 | 100次 | 10个 |
| Pro | $39/月 | 无限 | 50个 |

## GDPR合规

本应用已实现所有GDPR合规Webhook：

- ✅ `customers/data_request` - 客户数据导出请求
- ✅ `customers/redact` - 客户数据删除请求
- ✅ `shop/redact` - 店铺数据删除请求
- ✅ `app/uninstalled` - 应用卸载处理

## 部署

### Vercel

```bash
npm run build
vercel --prod
```

### Railway

```bash
railway up
```

## 文档

- [Shopify App 开发指南](./Shopify_App_开发指南.md)
- [Shopify Remix文档](https://shopify.dev/docs/apps/tools/remix)
- [Polaris设计系统](https://polaris.shopify.com/)

## 品牌

**Haimo Tech** - 赋能跨境卖家，AI驱动增长

## License

Private - All Rights Reserved
