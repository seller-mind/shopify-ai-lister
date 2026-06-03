/**
 * AI产品描述生成 Prompt 模板
 * 
 * Generate optimized Amazon/Shopify listings
 * Any language input → Native English output
 */
import type { GenerationInput, TargetPlatform } from '~/types';

/**
 * 构建完整的生成Prompt
 */
export function getListingPrompt(input: GenerationInput): string {
  const platformInstruction = getPlatformInstruction(input.targetPlatform);
  
  return `
# AI Product Description Generation Task

## Product Information (any language — we will convert to native English)
- **Product Name**: ${input.productName}
${input.category ? `- **产品类别**: ${input.category}` : ''}
${input.features ? `- **产品特点**:\n${formatFeatures(input.features)}` : ''}
${input.keywords ? `- **目标关键词**: ${input.keywords}` : ''}
${input.brandName ? `- **品牌名称**: ${input.brandName}` : ''}
${input.material ? `- **材质规格**: ${input.material}` : ''}
${input.packageContents ? `- **包装内容**: ${input.packageContents}` : ''}
${input.competitorReferences ? `- **竞品参考**: ${input.competitorReferences}` : ''}

## 平台优化要求
${platformInstruction}

## Output Requirements

Generate ALL output in native, polished English:

### 1. Short Title
- 最多150字符
- 包含核心关键词
- 突出产品卖点
- 适合搜索排名

### 2. Bullet Points (5 key points)
Each bullet point:
- Start with a capital letter
- Include key feature or user benefit
- Max 200 characters
- Use numbers or symbols for emphasis

### 3. Product Description
- 200-500 words
- Paragraph format, easy to read
- Include use cases, target users, unique selling points
- SEO-friendly natural language
- Include a call to action (CTA)

### 4. SEO Keywords
- List 10-15 keywords
- Cover different search intents
- Include long-tail keywords

### 5. Backend Search Terms
- 250 bytes limit (Amazon)
- Comma-separated
- Include variants and synonyms
- Do not repeat front-end keywords

## Style Requirements
- Professional yet accessible
- Targeted at North American/European consumers
- Avoid exaggeration or unsubstantiated claims
- Use natural, native English — never translated-sounding text
- If the input is in a non-English language (Chinese, Japanese, Spanish, etc.), translate the meaning naturally, not literally
- Include culturally appropriate expressions and idioms that resonate with English-speaking buyers

Please output in the format above.
`;
}

/**
 * 获取平台特定的优化指令
 */
function getPlatformInstruction(platform: TargetPlatform): string {
  const baseInstruction = `
- Meet cross-border e-commerce standards
- Keyword strategy optimized for English search engines
- Consider target market cultural habits and expressions
`;

  switch (platform) {
    case 'amazon':
      return `
## Amazon Platform Optimization
${baseInstruction}
- Follow Amazon listing best practices
- Align with Amazon SEO algorithm preferences
- Title format: Brand + Core Keyword + Features + Specs
- Emphasize functionality and practicality in bullet points
- Backend search terms within 250 bytes
`;

    case 'shopify':
      return `
## Shopify Platform Optimization
${baseInstruction}
- Optimized for Shopify SEO
- Concise and impactful titles
- Descriptions suited for product page display
- Include storytelling and emotional connection
- Support rich text formatting
`;

    case 'both':
      return `
## Amazon + Shopify Dual Platform Optimization
${baseInstruction}
- Generate versatile high-quality content
- Optimized for both platforms
- Provide two sets of backend search terms (if different)
- Descriptions usable on both platforms
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
${p.category ? `- **Category**: ${p.category}` : ''}
${p.features ? `- **特点**: ${p.features}` : ''}
${p.keywords ? `- **关键词**: ${p.keywords}` : ''}
`)
    .join('\n');

  return `
# Batch AI Product Description Generation

Generate descriptions for the following${products.length} products. Output each product in the following format:

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

## Products to Generate
${productsList}

## 平台: ${platform.toUpperCase()}

Please generate content for each product in order.
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
# AI Product Description Edit Task

## Original Description
${originalDescription}

## Edit Instructions
${instructions}

## Requirements
- Preserve core information
- Improve expression and structure
- Optimize SEO
- Output complete new description

Please output the complete revised description.
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
# Cross-border E-commerce Keyword Research

## Product Information
- **Product Name**: ${productName}
${category ? `- **Category**: ${category}` : ''}
${targetMarket ? `- **Target Market**: ${targetMarket}` : ''}

## Task
Provide the following keyword research:

### 1. High-Volume Core Keywords (5)
Keywords with the highest search volume

### 2. Long-Tail Keywords (10)
More specific, higher-conversion keywords

### 3. Competitor Brand Keywords (3-5)
Related brands consumers might search for

### 4. Use Case Keywords (5)
Keywords describing usage scenarios

### 5. Attribute/Feature Keywords (5)
Keywords related to specific product features

## Output Format
List each keyword by category with a brief explanation of search intent.

Target: North American English market.
`;
}
