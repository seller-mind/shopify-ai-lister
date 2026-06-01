/**
 * AI产品描述生成 Prompt 模板
 * 
 * 为跨境电商卖家生成优化的Amazon/Shopify listing
 * 中文输入 → 英文输出
 */
import type { GenerationInput, TargetPlatform } from '~/types';

/**
 * 构建完整的生成Prompt
 */
export function getListingPrompt(input: GenerationInput): string {
  const platformInstruction = getPlatformInstruction(input.targetPlatform);
  
  return `
# AI产品描述生成任务

## 产品信息（中文）
- **产品名称**: ${input.productName}
${input.category ? `- **产品类别**: ${input.category}` : ''}
${input.features ? `- **产品特点**:\n${formatFeatures(input.features)}` : ''}
${input.keywords ? `- **目标关键词**: ${input.keywords}` : ''}
${input.brandName ? `- **品牌名称**: ${input.brandName}` : ''}
${input.material ? `- **材质规格**: ${input.material}` : ''}
${input.packageContents ? `- **包装内容**: ${input.packageContents}` : ''}
${input.competitorReferences ? `- **竞品参考**: ${input.competitorReferences}` : ''}

## 平台优化要求
${platformInstruction}

## 输出要求

请生成以下内容，全部使用英文：

### 1. Short Title（简短标题）
- 最多150字符
- 包含核心关键词
- 突出产品卖点
- 适合搜索排名

### 2. Bullet Points（5点产品要点）
每个要点：
- 开头使用大写字母
- 包含关键特征或用户利益
- 最多200字符
- 使用数字或符号强调重点

### 3. Product Description（产品描述）
- 200-500词
- 段落式，易于阅读
- 包含使用场景、目标用户、独特卖点
- SEO友好的自然语言
- 包含行动号召（CTA）

### 4. SEO Keywords（SEO关键词）
- 列出10-15个关键词
- 涵盖不同搜索意图
- 包含长尾关键词

### 5. Backend Search Terms（后端搜索词）
- 250字节限制（Amazon）
- 用逗号分隔
- 包含变体和同义词
- 不要重复前端关键词

## 风格要求
- 专业但易于理解
- 面向北美/欧洲消费者
- 避免夸大宣传
- 使用自然语言

请按以上格式输出。
`;
}

/**
 * 获取平台特定的优化指令
 */
function getPlatformInstruction(platform: TargetPlatform): string {
  const baseInstruction = `
- 符合跨境电商行业标准
- 关键词策略针对英文搜索引擎优化
- 考虑目标市场的文化习惯和表达方式
`;

  switch (platform) {
    case 'amazon':
      return `
## Amazon平台优化
${baseInstruction}
- 遵循Amazon listing最佳实践
- 符合Amazon SEO算法偏好
- 标题格式：品牌 + 核心词 + 特点 + 规格
- 要点突出功能性和实用性
- 后端搜索词不超250字节
`;

    case 'shopify':
      return `
## Shopify平台优化
${baseInstruction}
- 适合Shopify SEO
- 标题简洁有力
- 描述适合产品页面展示
- 包含故事性和情感连接
- 支持富文本格式
`;

    case 'both':
      return `
## Amazon + Shopify双平台优化
${baseInstruction}
- 生成通用高质量内容
- 针对两个平台都进行了优化
- 提供两套后端搜索词（如有差异）
- 描述可以同时用于两个平台
`;

    default:
      return baseInstruction;
  }
}

/**
 * 格式化特点列表
 */
function formatFeatures(features: string): string {
  return features
    .split('\n')
    .map(f => `  - ${f.trim()}`)
    .join('\n');
}

/**
 * 获取批量生成的Prompt
 */
export function getBatchPrompt(
  products: GenerationInput[],
  platform: TargetPlatform
): string {
  const productsList = products
    .map((p, i) => `
### 产品 ${i + 1}
- **名称**: ${p.productName}
${p.category ? `- **类别**: ${p.category}` : ''}
${p.features ? `- **特点**: ${p.features}` : ''}
${p.keywords ? `- **关键词**: ${p.keywords}` : ''}
`)
    .join('\n');

  return `
# 批量AI产品描述生成任务

请为以下${products.length}个产品生成描述。每个产品请按以下格式输出：

---

## 产品 N
### Short Title:
[标题]

### Bullet Points:
1. [要点1]
2. [要点2]
3. [要点3]
4. [要点4]
5. [要点5]

### Product Description:
[描述段落]

### SEO Keywords:
[关键词列表]

### Backend Search Terms:
[后端搜索词]

---

## 待生成产品
${productsList}

## 平台: ${platform.toUpperCase()}

请按顺序为每个产品生成内容。
`;
}

/**
 * 获取编辑已有描述的Prompt
 */
export function getEditPrompt(
  originalDescription: string,
  instructions: string
): string {
  return `
# AI产品描述编辑任务

## 原文描述
${originalDescription}

## 编辑要求
${instructions}

## 要求
- 保持原有核心信息
- 改进表达和结构
- 优化SEO
- 输出完整的新描述

请输出修改后的完整描述。
`;
}

/**
 * 获取关键词研究Prompt
 */
export function getKeywordResearchPrompt(
  productName: string,
  category?: string,
  targetMarket?: string
): string {
  return `
# 跨境电商关键词研究

## 产品信息
- **产品名称**: ${productName}
${category ? `- **类别**: ${category}` : ''}
${targetMarket ? `- **目标市场**: ${targetMarket}` : ''}

## 任务
请提供以下类型的关键词研究：

### 1. 高流量核心关键词（5个）
这些是搜索量最高的词

### 2. 长尾关键词（10个）
这些是更具体、转化率更高的词

### 3. 竞品品牌词（3-5个）
消费者可能搜索的相关品牌

### 4. 场景/用途词（5个）
描述使用场景的关键词

### 5. 属性/特征词（5个）
产品具体特征相关词

## 输出格式
请按类别列出每个关键词，并简要说明搜索意图。

针对北美英语市场。
`;
}
