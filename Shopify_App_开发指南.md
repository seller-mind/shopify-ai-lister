# Shopify App 开发指南

> **目标产品**：AI产品描述生成器（中文输入→英文Amazon/Shopify listing），面向中国跨境电商卖家
> **文档版本**：2026年6月
> **信息来源**：Shopify官方文档、开发者博客、行业分析报告

---

## 目录

1. [开发框架](#1-shopify-app开发框架)
2. [OAuth和安装流程](#2-oauth和安装流程)
3. [App Bridge](#3-app-bridge)
4. [Billing API](#4-billing-api)
5. [数据访问](#5-数据访问)
6. [上架流程](#6-上架流程)
7. [技术架构](#7-技术架构)
8. [竞品分析](#8-竞品分析)
9. [差异化机会](#9-差异化机会)

---

## 1. Shopify App开发框架

### 1.1 官方推荐框架：Remix (React Router v7)

**2025-2026年最新状态**：

Shopify已于2024年宣布将**Remix作为官方推荐的App开发框架**，并在2025年持续深化这一策略。Remix已被整合进React Router v7（Shopify于2022年收购了Remix团队）。

| 维度 | 详情 |
|------|------|
| **推荐模板** | `@shopify/create-app` 生成Remix应用 |
| **官方包** | `@shopify/shopify-app-remix` (2026年4月最新版本2026.4.0) |
| **API版本** | 日历版本制（2026.4.0 = 2026年4月发布） |
| **React版本** | React Router v7 |

**为什么选择Remix而非Next.js**：
- **原生集成**：Remix模板预置OAuth、Session管理、API客户端
- **SSR优化**：服务器端渲染适合Shopify嵌入式App的iframe场景
- **loader/action模式**：与GraphQL请求/变更完美对应
- **官方支持**：所有新功能、文档、最佳实践都以Remix为准

### 1.2 Shopify CLI 使用方法

**安装**：
```bash
npm install -g @shopify/cli@latest
```

**核心命令**：

| 命令 | 用途 |
|------|------|
| `shopify app init` | 创建新App（选择Remix模板） |
| `shopify app dev` | 启动本地开发服务器 |
| `shopify app deploy` | 部署到生产环境 |
| `shopify app config link` | 链接配置文件 |
| `shopify app env show` | 查看环境变量 |
| `shopify app webhook trigger` | 测试Webhook触发 |

**初始化项目**：
```bash
shopify app init
# 输入App名称
# 选择 "Build a Remix app"
# 选择 TypeScript
```

**配置文件结构**：
```toml
# shopify.app.toml
name = "ai-lister"
client_id = "your-api-key"
application_url = "https://your-app-url.com"
embedded = true

[access_scopes]
scopes = "read_products,write_products"

[auth]
redirect_urls = ["https://your-app-url.com/auth/callback"]

[webhooks]
api_version = "2025-10"
```

### 1.3 2025-2026最佳实践

1. **使用Shopify Managed Installation**：由Shopify管理安装流程，减少OAuth复杂度
2. **启用Token Exchange**：`unstable_newEmbeddedAuthStrategy: true`（消除嵌入式App的OAuth重定向）
3. **使用Polaris组件**：App Store审核要求App界面使用Polaris设计系统
4. **GDPR Webhook**：必须在配置中注册GDPR合规Webhook

---

## 2. OAuth和安装流程

### 2.1 完整OAuth流程

```
商家浏览器 → 访问App安装URL → Shopify授权页面 → 商家点击"安装"
→ Shopify重定向到/callback + code → App后端用code换access_token
→ 返回access_token → App嵌入Shopify Admin
```

### 2.2 使用Remix的authenticate.admin

**推荐方式**：使用官方包处理OAuth，**不要手动实现**

```typescript
// app/shopify.server.ts
import '@shopify/shopify-app-remix/server/adapters/node';
import { shopifyApp } from '@shopify/shopify-app-remix/server';

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  appUrl: process.env.SHOPIFY_APP_URL!,
  scopes: ['read_products', 'write_products'],
  isEmbeddedApp: true,
  future: {
    unstable_newEmbeddedAuthStrategy: true, // 推荐：消除重定向
  },
});

export default shopify;
```

```typescript
// 在Route中使用
import { authenticate } from '~/shopify.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  // 使用 admin.graphql() 调用API
  // session包含shop和accessToken
};
```

### 2.3 Access Token类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| **Offline Token** | 离线Token，商家安装后永久有效 | 大多数App后台任务 |
| **Online Token** | 与商家登录会话绑定，有过期时间 | 需要代表特定用户操作 |

---

## 3. App Bridge

### 3.1 什么是App Bridge

App Bridge是Shopify的JavaScript SDK，用于：
- 将App嵌入Shopify Admin界面
- 与Shopify Admin通信（导航、模态框、Toast等）
- 使用Session Token进行身份验证

### 3.2 嵌入Shopify Admin

**步骤1：在App Provider中初始化**

```tsx
// app/root.tsx
import { AppProvider } from '@shopify/shopify-app-remix/react';
import shopify from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await shopify.authenticate.admin(request);
  return json({ apiKey: process.env.SHOPIFY_API_KEY });
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  return (
    <AppProvider apiKey={apiKey} isEmbeddedApp>
      <Outlet />
    </AppProvider>
  );
}
```

### 3.3 Polaris组件库

**2025年10月重要更新**：Polaris正式GA（General Availability），基于Web Components重构。

**基本使用**：

```tsx
import { Page, Layout, Card, Button, Text } from '@shopify/polaris';

function ProductPage() {
  return (
    <Page title="AI产品描述生成器">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text variant="headingMd">生成描述</Text>
            <Button primary>开始生成</Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

**必须使用Polaris的原因**：App Store审核要求App界面与Shopify Admin风格一致。

---

## 4. Billing API

### 4.1 收费模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **Subscription (定期订阅)** | 按月/年收费 | 主流模式，大多数App采用 |
| **Usage-based (按用量)** | 基于API调用次数等 | 消耗型服务 |
| **One-time Purchase** | 一次性买断 | 工具类App |

### 4.2 实现按月收费

```typescript
// app/shopify.server.ts
import { BillingInterval } from '@shopify/shopify-app-remix/server';

const shopify = shopifyApp({
  billing: {
    'STARTER_PLAN': {
      amount: 19,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
    'PRO_PLAN': {
      amount: 39,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
    },
  },
});
```

**请求支付**：

```typescript
export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const billingCheck = await billing.check({ plans: ['STARTER_PLAN'] });
  if (!billingCheck.hasActivePayment) {
    const confirmUrl = await billing.request({ plan: 'STARTER_PLAN' });
    return redirect(confirmUrl);
  }
};
```

### 4.3 Shopify收费分成比例（2026年最新政策）

| 收入层级 | 分成比例 | 开发者获得 |
|----------|----------|------------|
| **前$1,000,000终身收入** | 0% | 100% |
| **超过$1,000,000** | 15% | 85% |

**关键说明**：
- 2025年6月16日变更：从"每年重置"改为"终身累计"
- 额外费用：所有账单收取2.9%处理费
- 年收入≥$20M或公司收入≥$100M：全段15%，无0%区间

### 4.4 免费试用期实现

```typescript
'STARTER_PLAN': {
  amount: 19,
  currencyCode: 'USD',
  interval: BillingInterval.Every30Days,
  trialDays: 7,  // 7天免费试用
},
```

---

## 5. 数据访问

### 5.1 GraphQL Admin API vs REST Admin API

**重要更新**：自2024年10月起，REST Admin API标记为legacy。**2025年4月1日起，所有新提交到App Store的App必须使用GraphQL**。

| 维度 | GraphQL (推荐) | REST (Legacy) |
|------|----------------|---------------|
| **数据获取** | 按需获取精确字段 | 返回固定数据集 |
| **关联数据** | 单次查询获取关联数据 | 需要多次请求 |
| **速率限制** | 基于成本（更高效） | 请求数限制 |
| **App Store** | 必须使用 | 不可用于新App |

### 5.2 读写Shopify产品数据

**读取产品**：

```typescript
const response = await admin.graphql(`
  #graphql
  query GetProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        descriptionHtml
        handle
        variants(first: 5) {
          nodes { id title price }
        }
        tags
      }
    }
  }
`, { variables: { first: 50 } });
```

**更新产品描述**：

```typescript
const response = await admin.graphql(`
  #graphql
  mutation UpdateProduct($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id title descriptionHtml }
      userErrors { field message }
    }
  }
`, {
  variables: { input: { id: productId, descriptionHtml: description } }
});
```

### 5.3 Webhook使用

**必须实现的Webhook**：

| Topic | 触发时机 | 用途 |
|-------|----------|------|
| `app/uninstalled` | 商家卸载App | 清理数据 |
| `products/create` | 创建新产品 | 可自动生成描述 |
| `customers/data_request` | GDPR数据请求 | 必须实现 |
| `customers/redact` | GDPR数据删除 | 必须实现 |
| `shop/redact` | GDPR店铺删除 | 必须实现 |

---

## 6. 上架流程

### 6.1 App Store审核要求

1. **功能完整性**：App必须是完整、可测试的
2. **性能要求**：Lighthouse性能分数下降不超过10分
3. **设计规范**：使用Polaris组件库
4. **隐私合规**：必须实现GDPR合规Webhook + 隐私政策页面

### 6.2 审核周期和常见被拒原因

**审核周期**：2-7个工作日

| 被拒原因 | 占比 | 解决方案 |
|----------|------|----------|
| 缺失隐私政策 | ~25% | 添加完整隐私政策页面 |
| OAuth流程问题 | ~20% | 确保嵌入式OAuth正确处理 |
| 未处理app_uninstalled | ~15% | 实现Webhook清理逻辑 |
| GDPR Webhook缺失 | ~15% | 注册三个合规Webhook |
| UI/UX不符合Polaris | ~10% | 使用Polaris组件重写 |

### 6.3 提交前检查清单

- [ ] 三个GDPR Webhook已注册
- [ ] HMAC验证已实现
- [ ] OAuth流程正常
- [ ] 卸载后数据清理
- [ ] 隐私政策页面存在
- [ ] Polaris组件使用
- [ ] 演示视频准备
- [ ] 测试账号/数据准备

---

## 7. 技术架构

### 7.1 部署平台选择

| 平台 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Vercel** | 自动部署，SSR支持好 | 背景任务处理较弱 | ⭐⭐⭐⭐ |
| **Railway** | 简单易用，支持后台任务 | 成本略高 | ⭐⭐⭐⭐ |
| **Render** | 免费层友好 | 冷启动慢 | ⭐⭐⭐ |

**推荐架构**：
- **App服务器**：Vercel或Railway（SSR Remix应用）
- **数据库**：PostgreSQL（Supabase或Railway Postgres）
- **AI调用**：异步处理，避免超时

### 7.2 数据库设计

**推荐：PostgreSQL + Prisma**

```prisma
model Store {
  id          String   @id @default(cuid())
  shop        String   @unique  // mystore.myshopify.com
  accessToken String   // 加密存储
  plan        String?
  createdAt   DateTime @default(now())
  products    Product[]
  generations Generation[]
}

model Generation {
  id        String   @id @default(cuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id])
  inputZh   String   // 中文输入
  outputEn  String   // 英文输出
  model     String   // 使用的AI模型
  tokens    Int
  createdAt DateTime @default(now())
}
```

### 7.3 AI API集成（Claude）

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateDescription(productInfo: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `你是一个专业的跨境电商产品描述撰写专家。
请根据以下中文产品信息，撰写适合Amazon和Shopify的英文产品描述。

要求：
1. SEO优化，包含关键词
2. 符合目标市场的表达习惯
3. 结构清晰：特点、利益点、规格
4. 吸引目标用户购买

产品信息：
${productInfo}

请直接输出英文描述。`
    }]
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

### 7.4 整体架构图

```
Shopify Admin (嵌入式App)
    ↕ App Bridge
Vercel/Railway (Remix SSR)
    ↕ GraphQL API
Shopify Platform (产品数据读写)
    ↕
Supabase PostgreSQL (用户数据+生成历史)
    ↕
Claude API (AI描述生成)
```

---

## 8. 竞品分析

### 8.1 Shopify App Store上的AI描述生成器

| App名称 | 评分 | 评论 | 定价 | 关键特点 |
|---------|------|------|------|----------|
| **ChatGPT AI Product Description** | 4.9 | 424 | Free+付费 | 最热门，批量生成 |
| **InkBot** | - | - | Free/$9/$39/$99 | DeepSeek V3，111语言，Built for Shopify |
| **Avada AI** | 5.0 | 151 | 免费 | 模板定制，多语言 |
| **Yodel** | 4.8 | 43 | 付费 | Built for Shopify，自定义指令 |
| **Shopify Magic** | 内置 | - | 免费 | 功能基础，无批量，输出不一致 |

### 8.2 市场空白点

1. **中文化界面缺失**：大多数工具无中文UI
2. **Amazon+Shopify双平台优化**：现有工具通常只针对单一平台
3. **跨境卖家特定需求**：缺乏针对中国卖家的关键词优化
4. **批量生成+人工审核工作流**：缺乏高效的批量→审核→应用流程

---

## 9. 差异化机会

### 9.1 核心差异化定位

> **专为跨境卖家设计的AI产品描述生成器**
> 核心价值：中文输入 → 面向Amazon/Shopify优化的英文描述

### 9.2 差异化功能矩阵

| 功能 | 其他App | 本产品（差异化） |
|------|---------|-----------------|
| **界面语言** | 英文 | 中文（面向中国卖家） |
| **平台优化** | 仅Shopify | Amazon + Shopify双平台 |
| **关键词策略** | 通用SEO | 跨境电商特定关键词 |
| **描述风格** | 统一模板 | Amazon风格/Shopify风格可选 |
| **批量处理** | 有限 | 支持大量产品批量生成 |
| **审核流程** | 直接应用 | 草稿→编辑→确认→批量应用 |

### 9.3 定价策略

| 套餐 | 价格 | 功能 | 目标用户 |
|------|------|------|----------|
| **Free** | 免费 | 每月5个产品描述 | 试用用户 |
| **Starter** | $19/月 | 每月100个描述 | 小型卖家 |
| **Pro** | $39/月 | 无限描述 + 批量生成 | 中大型卖家 |

### 9.4 开发里程碑

| 阶段 | 时间 | 功能 | 优先级 |
|------|------|------|--------|
| **MVP** | 2-3周 | 中文→英文单个描述生成，Shopify直接应用 | P0 |
| **V1.0** | 4-6周 | 批量生成，Amazon格式支持 | P1 |
| **V1.5** | 8-10周 | 品牌声音设置，描述模板，审核流程 | P2 |
| **V2.0** | 12-16周 | API Key支持，团队协作 | P3 |

---

## 附录：环境变量清单

```bash
# .env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_APP_URL=https://your-app-url.com
SCOPES=read_products,write_products

# 数据库
DATABASE_URL=postgresql://...

# AI服务
ANTHROPIC_API_KEY=sk-ant-...
```
