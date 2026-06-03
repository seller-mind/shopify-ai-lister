/**
 * AI Generator Service - DeepSeek API (OpenAI-compatible)
 * 
 * Generate high-quality Amazon/Shopify product descriptions using DeepSeek
 * DeepSeek API is OpenAI-compatible, no extra SDK needed
 */
import type { GenerationInput, GenerationOutput } from '~/types';
import { getListingPrompt } from '~/prompts/listing-generator';

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';
const MAX_TOKENS = 2048;

/**
 * 生成产品描述
 * 
 * @param input - Product information in any language
 * @param shopDomain - 店铺域名（用于记录）
 * @returns Generated native English description
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
    
    // 调用DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce copywriter specializing in creating high-converting product listings for Amazon and Shopify. You take product information in ANY language (Chinese, Japanese, Spanish, German, English, etc.) and produce polished, native English listings that sell. Never output translated-sounding text — always write as if English is your first language. Understand cultural nuances and include expressions that resonate with English-speaking buyers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', response.status, errorData);
      return {
        success: false,
        error: `AI API error: ${response.status}`,
      };
    }
    
    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    
    // 解析生成的描述
    const output = parseGeneratedContent(responseText);
    
    // 计算token使用量
    const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
    
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
 * 解析AI生成的文本内容
 */
function parseGeneratedContent(text: string): GenerationOutput {
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
    if (trimmedLine.match(/^#{1,3}\s*(short title|title)/i) || 
        trimmedLine.match(/^\*{0,2}(short title|title)\*{0,2}:?$/i)) {
      currentSection = 'title';
      continue;
    }
    if (trimmedLine.match(/^#{1,3}\s*(bullet|feature|key point)/i) || 
        trimmedLine.match(/^\*{0,2}(bullet|feature|key point)/i)) {
      currentSection = 'bullet';
      continue;
    }
    if (trimmedLine.match(/^#{1,3}\s*(description|product detail)/i) || 
        trimmedLine.match(/^\*{0,2}(description|product detail)/i)) {
      currentSection = 'description';
      continue;
    }
    if (trimmedLine.match(/^#{1,3}\s*(seo|keyword)/i) || 
        trimmedLine.match(/^\*{0,2}(seo|keyword)/i)) {
      currentSection = 'seo';
      continue;
    }
    if (trimmedLine.match(/^#{1,3}\s*(backend|search term)/i) || 
        trimmedLine.match(/^\*{0,2}(backend|search term)/i)) {
      currentSection = 'backend';
      continue;
    }
    
    // 跳过空行和分隔线
    if (!trimmedLine || trimmedLine.match(/^[-=*]{3,}$/)) continue;
    
    // 解析内容
    if (currentSection === 'title' && trimmedLine) {
      shortTitle = trimmedLine.replace(/^[-•*]\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '');
    } else if (currentSection === 'bullet' && trimmedLine) {
      const bullet = trimmedLine.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '');
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
  if (!shortTitle && !productDescription && bulletPoints.length === 0) {
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
    bulletPoints: bulletPoints.slice(0, 5),
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
        model: DEEPSEEK_MODEL,
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
