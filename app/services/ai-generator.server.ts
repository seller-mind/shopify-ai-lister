/**
 * AI Generator Service - Claude API调用
 * 
 * 使用Claude生成高质量的Amazon/Shopify产品描述
 */
import Anthropic from '@anthropic-ai/sdk';
import type { GenerationInput, GenerationOutput } from '~/types';
import { getListingPrompt } from '~/prompts/listing-generator';

// 初始化Claude客户端
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Claude模型配置
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;

/**
 * 生成产品描述
 * 
 * @param input - 中文输入信息
 * @param shopDomain - 店铺域名（用于记录）
 * @returns 生成的英文描述
 */
export async function generateDescription(
  input: GenerationInput,
  shopDomain: string
): Promise<{
  success: boolean;
  output?: GenerationOutput;
  tokensUsed?: number;
  error?: string;
}> {
  try {
    // 构建prompt
    const prompt = getListingPrompt(input);
    
    // 调用Claude API
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    
    // 解析响应
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    // 解析生成的描述
    const output = parseGeneratedContent(responseText);
    
    // 计算token使用量
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;
    
    // 记录生成历史
    await recordGeneration(shopDomain, input, output, 'completed', tokensUsed);
    
    return {
      success: true,
      output,
      tokensUsed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating description:', error);
    
    // 记录失败
    await recordGeneration(shopDomain, input, null, 'failed', 0, errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 解析Claude生成的文本内容
 */
function parseGeneratedContent(text: string): GenerationOutput {
  // 尝试提取各部分内容
  let shortTitle = '';
  let bulletPoints: string[] = [];
  let productDescription = '';
  let seoKeywords: string[] = [];
  let backendSearchTerms = '';
  
  const lines = text.split('\n');
  let currentSection = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检测section headers
    if (trimmedLine.toLowerCase().includes('short title') || 
        trimmedLine.toLowerCase().includes('title:')) {
      currentSection = 'title';
      continue;
    }
    if (trimmedLine.toLowerCase().includes('bullet') || 
        trimmedLine.toLowerCase().includes('feature')) {
      currentSection = 'bullet';
      continue;
    }
    if (trimmedLine.toLowerCase().includes('description') || 
        trimmedLine.toLowerCase().includes('product detail')) {
      currentSection = 'description';
      continue;
    }
    if (trimmedLine.toLowerCase().includes('seo') || 
        trimmedLine.toLowerCase().includes('keyword')) {
      currentSection = 'seo';
      continue;
    }
    if (trimmedLine.toLowerCase().includes('backend') || 
        trimmedLine.toLowerCase().includes('search term')) {
      currentSection = 'backend';
      continue;
    }
    
    // 解析内容
    if (currentSection === 'title' && trimmedLine) {
      shortTitle = trimmedLine.replace(/^[-•*]\s*/, '');
    } else if (currentSection === 'bullet' && trimmedLine) {
      const bullet = trimmedLine.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '');
      if (bullet) bulletPoints.push(bullet);
    } else if (currentSection === 'description' && trimmedLine) {
      productDescription += trimmedLine + ' ';
    } else if (currentSection === 'seo' && trimmedLine) {
      const keywords = trimmedLine.split(/[,;|]/).map(k => k.trim()).filter(Boolean);
      seoKeywords.push(...keywords);
    } else if (currentSection === 'backend' && trimmedLine) {
      backendSearchTerms += trimmedLine + ' ';
    }
  }
  
  // 如果解析失败，使用默认格式
  if (!shortTitle && !productDescription) {
    // 假设整个文本是描述
    productDescription = text;
  }
  
  // 确保有bullet points
  if (bulletPoints.length === 0) {
    bulletPoints = [
      'High-quality product with excellent craftsmanship',
      'Perfect for everyday use',
      'Durable and long-lasting materials',
      'Easy to use and maintain',
      'Great value for money',
    ];
  }
  
  return {
    shortTitle: shortTitle || 'Premium Product - Best Choice',
    bulletPoints: bulletPoints.slice(0, 5), // 限制5个
    productDescription: productDescription.trim(),
    seoKeywords: seoKeywords.slice(0, 10),
    backendSearchTerms: backendSearchTerms.trim() || seoKeywords.slice(0, 5).join(' '),
  };
}

/**
 * 记录生成历史到数据库
 */
async function recordGeneration(
  shopDomain: string,
  input: GenerationInput,
  output: GenerationOutput | null,
  status: string,
  tokensUsed: number,
  errorMessage?: string
): Promise<void> {
  try {
    const { recordGeneration: saveRecord, getStore } = await import('./supabase.server');
    const store = await getStore(shopDomain);
    
    if (store) {
      await saveRecord({
        storeId: store.id,
        shopDomain,
        productTitle: input.productName,
        input: input as unknown as Record<string, unknown>,
        output: output as unknown as Record<string, unknown>,
        status,
        model: CLAUDE_MODEL,
        tokensUsed,
        errorMessage,
      });
    }
  } catch (error) {
    console.error('Error recording generation:', error);
  }
}

/**
 * 批量生成描述
 */
export async function batchGenerateDescriptions(
  inputs: GenerationInput[],
  shopDomain: string,
  onProgress?: (index: number, total: number) => void
): Promise<{
  results: { index: number; success: boolean; output?: GenerationOutput; error?: string }[];
  totalTokens: number;
}> {
  const results: { index: number; success: boolean; output?: GenerationOutput; error?: string }[] = [];
  let totalTokens = 0;
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const result = await generateDescription(input, shopDomain);
    
    results.push({
      index: i,
      success: result.success,
      output: result.output,
      error: result.error,
    });
    
    if (result.tokensUsed) {
      totalTokens += result.tokensUsed;
    }
    
    // 回调进度
    if (onProgress) {
      onProgress(i + 1, inputs.length);
    }
    
    // 添加延迟避免API限流
    if (i < inputs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { results, totalTokens };
}
