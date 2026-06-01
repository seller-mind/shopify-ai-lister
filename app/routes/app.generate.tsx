/**
 * AI生成页面 - 核心功能
 * 
 * 中文输入 → 英文Amazon/Shopify listing生成
 */
import { json, redirect } from '@remix-run/node';
import { useLoaderData, useActionData, Form, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Select,
  Button,
  ChoiceList,
  Divider,
  Banner,
  Loading,
  Modal,
  TextContainer,
  CodeBlock,
  copyable,
} from '@shopify/polaris';
import { WandIcon, RefreshIcon, CheckIcon } from '@shopify/polaris-icons';
import { authenticate } from '~/shopify.server';
import { generateDescription } from '~/services/ai-generator.server';
import { canGenerate } from '~/services/usage-tracker.server';
import { updateProductDescription } from '~/services/shopify-api.server';
import type { GenerationOutput, TargetPlatform } from '~/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  
  // 检查是否可以生成
  const canGenerateResult = await canGenerate(request);
  
  return json({
    canGenerate: canGenerateResult,
    remainingGenerations: canGenerateResult.remainingGenerations,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  
  // 检查配额
  const canGen = await canGenerate(request);
  if (!canGen.allowed) {
    return json({
      error: canGen.reason,
      redirectTo: '/app/billing',
    });
  }
  
  // 获取表单数据
  const formData = await request.formData();
  
  const input = {
    productName: formData.get('productName') as string,
    category: formData.get('category') as string || undefined,
    features: formData.get('features') as string || undefined,
    keywords: formData.get('keywords') as string || undefined,
    competitorReferences: formData.get('competitorReferences') as string || undefined,
    brandName: formData.get('brandName') as string || undefined,
    material: formData.get('material') as string || undefined,
    packageContents: formData.get('packageContents') as string || undefined,
    targetPlatform: (formData.get('targetPlatform') as TargetPlatform) || 'both',
  };
  
  // 验证必填字段
  if (!input.productName) {
    return json({ error: '请输入产品名称' });
  }
  
  // 调用AI生成
  const result = await generateDescription(input, session.shop);
  
  if (!result.success) {
    return json({ error: result.error || '生成失败' });
  }
  
  return json({
    success: true,
    output: result.output,
    tokensUsed: result.tokensUsed,
  });
}

export default function GeneratePage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isGenerating = navigation.state === 'submitting';
  
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);
  
  // 监听action结果
  const hasResult = actionData && 'output' in actionData && actionData.output;
  
  if (hasResult) {
    setShowResultModal(true);
  }
  
  return (
    <Page title="AI生成产品描述">
      <Layout>
        {/* 用量提示 */}
        {!loaderData.canGenerate.allowed && (
          <Layout.Section>
            <Banner
              title={loaderData.canGenerate.reason}
              tone="warning"
              action={{ content: '升级计划', url: '/app/billing' }}
            >
              <p>本月免费次数已用完，升级到付费计划解锁更多生成次数</p>
            </Banner>
          </Layout.Section>
        )}
        
        <Layout.Section>
          <Form method="post">
            <BlockStack gap="400">
              {/* 基础信息 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">📝 产品基本信息</Text>
                </Card.Section>
                <Card.Section>
                  <BlockStack gap="400">
                    <TextField
                      name="productName"
                      label="产品名称"
                      placeholder="例如：智能手表无线充电器"
                      requiredIndicator
                      autoComplete="off"
                    />
                    
                    <InlineStack gap="400" wrap={false}>
                      <TextField
                        name="category"
                        label="产品类别"
                        placeholder="例如：电子产品 > 配件"
                        autoComplete="off"
                      />
                      
                      <TextField
                        name="brandName"
                        label="品牌名称"
                        placeholder="您的品牌名"
                        autoComplete="off"
                      />
                    </InlineStack>
                  </BlockStack>
                </Card.Section>
              </Card>
              
              {/* 产品详情 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">✨ 产品特点与关键词</Text>
                </Card.Section>
                <Card.Section>
                  <BlockStack gap="400">
                    <TextField
                      name="features"
                      label="产品特点"
                      placeholder="每行一个特点&#10;例如：&#10;3000mAh大容量&#10;15W快速充电&#10;兼容多款智能手表"
                      multiline={4}
                      autoComplete="off"
                      helpText="详细的产品特点有助于生成更精准的描述"
                    />
                    
                    <TextField
                      name="keywords"
                      label="目标关键词"
                      placeholder="用英文逗号分隔，例如：smartwatch charger, wireless charging dock"
                      autoComplete="off"
                      helpText="想被搜索到的核心关键词"
                    />
                    
                    <TextField
                      name="competitorReferences"
                      label="竞品参考（可选）"
                      placeholder="输入知名竞品名称或链接"
                      autoComplete="off"
                      helpText="帮助AI了解市场定位和差异化"
                    />
                  </BlockStack>
                </Card.Section>
              </Card>
              
              {/* 规格与包装 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">📦 规格与包装</Text>
                </Card.Section>
                <Card.Section>
                  <InlineStack gap="400" wrap={false}>
                    <TextField
                      name="material"
                      label="材质规格"
                      placeholder="例如：ABS塑料外壳，铝合金底座"
                      autoComplete="off"
                    />
                    
                    <TextField
                      name="packageContents"
                      label="包装内容"
                      placeholder="例如：1x充电器，1x数据线，1x说明书"
                      autoComplete="off"
                    />
                  </InlineStack>
                </Card.Section>
              </Card>
              
              {/* 目标平台 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">🎯 目标平台</Text>
                </Card.Section>
                <Card.Section>
                  <BlockStack gap="200">
                    <ChoiceList
                      name="targetPlatform"
                      title="选择目标平台"
                      titleHidden
                      allowMultiple={false}
                      choices={[
                        { 
                          label: 'Amazon - 优化为Amazon搜索算法', 
                          value: 'amazon',
                          renderChildren: (isSelected) => isSelected && (
                            <Text tone="success" variant="bodySm">
                              ✓ 符合Amazon SEO最佳实践
                            </Text>
                          )
                        },
                        { 
                          label: 'Shopify - 适合Shopify SEO', 
                          value: 'shopify',
                          renderChildren: (isSelected) => isSelected && (
                            <Text tone="success" variant="bodySm">
                              ✓ 适合产品页面展示
                            </Text>
                          )
                        },
                        { 
                          label: '双平台优化 - 同时适合两个平台', 
                          value: 'both',
                          renderChildren: (isSelected) => isSelected && (
                            <Text tone="success" variant="bodySm">
                              ✓ 一份内容，多平台使用
                            </Text>
                          )
                        },
                      ]}
                      selected={['both']}
                    />
                  </BlockStack>
                </Card.Section>
              </Card>
              
              {/* 错误提示 */}
              {actionData && 'error' in actionData && actionData.error && (
                <Banner tone="critical" title="生成失败">
                  <p>{actionData.error}</p>
                </Banner>
              )}
              
              {/* 提交按钮 */}
              <InlineStack gap="200">
                <Button
                  type="submit"
                  variant="primary"
                  icon={isGenerating ? undefined : WandIcon}
                  disabled={isGenerating || !loaderData.canGenerate.allowed}
                  loading={isGenerating}
                >
                  {isGenerating ? '生成中...' : '✨ 生成英文描述'}
                </Button>
                
                <Text tone="secondary">
                  剩余 {loaderData.remainingGenerations} 次生成机会
                </Text>
              </InlineStack>
            </BlockStack>
          </Form>
        </Layout.Section>
      </Layout>
      
      {/* 结果预览Modal */}
      {hasResult && actionData && 'output' in actionData && actionData.output && (
        <ResultModal
          open={showResultModal}
          onClose={() => setShowResultModal(false)}
          output={actionData.output}
        />
      )}
    </Page>
  );
}

// 结果预览组件
function ResultModal({ 
  open, 
  onClose, 
  output 
}: { 
  open: boolean; 
  onClose: () => void; 
  output: GenerationOutput;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="✨ AI生成结果"
      primaryAction={{
        content: '复制全部',
        onAction: () => {
          const text = `
Short Title:
${output.shortTitle}

Bullet Points:
${output.bulletPoints.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Product Description:
${output.productDescription}

SEO Keywords:
${output.seoKeywords.join(', ')}

Backend Search Terms:
${output.backendSearchTerms}
          `.trim();
          navigator.clipboard.writeText(text);
        },
      }}
      secondaryActions={[
        {
          content: '关闭',
          onAction: onClose,
        },
      ]}
      sectioned
    >
      <BlockStack gap="400">
        {/* Short Title */}
        <BlockStack gap="200">
          <Text variant="headingSm">📌 简短标题 (Short Title)</Text>
          <TextContainer>
            <CodeBlock code={output.shortTitle} language="text" />
          </TextContainer>
        </BlockStack>
        
        {/* Bullet Points */}
        <BlockStack gap="200">
          <Text variant="headingSm">📋 5点产品要点 (Bullet Points)</Text>
          <BlockStack gap="100">
            {output.bulletPoints.map((point, index) => (
              <InlineStack key={index} gap="100" blockAlign="center">
                <Text variant="bodyMd" fontWeight="semibold">{index + 1}.</Text>
                <Text variant="bodyMd">{point}</Text>
              </InlineStack>
            ))}
          </BlockStack>
        </BlockStack>
        
        {/* Product Description */}
        <BlockStack gap="200">
          <Text variant="headingSm">📄 产品描述 (Product Description)</Text>
          <TextContainer>
            <p style={{ whiteSpace: 'pre-wrap' }}>{output.productDescription}</p>
          </TextContainer>
        </BlockStack>
        
        {/* SEO Keywords */}
        <BlockStack gap="200">
          <Text variant="headingSm">🔍 SEO关键词</Text>
          <InlineStack gap="100" wrap={false}>
            {output.seoKeywords.map((keyword, index) => (
              <Text key={index} as="span" variant="bodySm">
                {keyword}{index < output.seoKeywords.length - 1 ? ' · ' : ''}
              </Text>
            ))}
          </InlineStack>
        </BlockStack>
        
        {/* Backend Search Terms */}
        <BlockStack gap="200">
          <Text variant="headingSm">⚙️ 后端搜索词</Text>
          <TextContainer>
            <Text variant="bodySm" as="span" tone="secondary">
              {output.backendSearchTerms}
            </Text>
          </TextContainer>
        </BlockStack>
      </BlockStack>
    </Modal>
  );
}
