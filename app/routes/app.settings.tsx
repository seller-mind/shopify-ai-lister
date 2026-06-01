/**
 * 设置页面
 * 
 * 管理应用偏好设置
 */
import { json } from '@remix-run/node';
import { useLoaderData, Form, useActionData } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  TextField,
  Select,
  ChoiceList,
  Button,
  Banner,
  Divider,
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';
import { getStore, upsertStore } from '~/services/supabase.server';
import type { AppSettings } from '~/types';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // 获取店铺设置
  const store = await getStore(session.shop);
  const settings = store?.settings || getDefaultSettings();
  
  return json({
    shop: session.shop,
    settings,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  const formData = await request.formData();
  
  // 更新设置
  const settings: AppSettings = {
    defaultPlatform: (formData.get('defaultPlatform') as any) || 'both',
    autoApplyToShopify: formData.get('autoApplyToShopify') === 'true',
    defaultTone: (formData.get('defaultTone') as any) || 'professional',
    brandVoice: (formData.get('brandVoice') as string) || undefined,
    preferredKeywords: formData.get('preferredKeywords')?.toString().split(',').map(k => k.trim()) || [],
  };
  
  // 保存到数据库
  const supabase = await import('~/services/supabase.server').then(m => m.getSupabaseAdmin());
  const store = await getStore(session.shop);
  
  if (store) {
    await supabase
      .from('stores')
      .update({ settings })
      .eq('id', store.id);
  }
  
  return json({ success: true });
}

function getDefaultSettings(): AppSettings {
  return {
    defaultPlatform: 'both',
    autoApplyToShopify: false,
    defaultTone: 'professional',
    preferredKeywords: [],
  };
}

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  return (
    <Page title="应用设置">
      <Layout>
        {/* 成功提示 */}
        {actionData && 'success' in actionData && actionData.success && (
          <Layout.Section>
            <Banner tone="success" title="设置已保存">
              <p>您的偏好设置已成功更新</p>
            </Banner>
          </Layout.Section>
        )}
        
        <Form method="post">
          <Layout.Section>
            <BlockStack gap="400">
              {/* 默认平台设置 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">🎯 默认目标平台</Text>
                  <Text tone="secondary" variant="bodySm">
                    新建生成任务时的默认平台选择
                  </Text>
                </Card.Section>
                <Card.Section>
                  <ChoiceList
                    name="defaultPlatform"
                    titleHidden
                    allowMultiple={false}
                    choices={[
                      { label: 'Amazon', value: 'amazon' },
                      { label: 'Shopify', value: 'shopify' },
                      { label: '双平台（默认）', value: 'both' },
                    ]}
                    selected={[settings.defaultPlatform]}
                  />
                </Card.Section>
              </Card>
              
              {/* 描述风格设置 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">✍️ 默认描述风格</Text>
                  <Text tone="secondary" variant="bodySm">
                    生成描述的语气和风格
                  </Text>
                </Card.Section>
                <Card.Section>
                  <Select
                    name="defaultTone"
                    label="语气风格"
                    labelHidden
                    options={[
                      { value: 'professional', label: '专业商务 (Professional)' },
                      { value: 'casual', label: '休闲随和 (Casual)' },
                      { value: 'luxury', label: '高端奢华 (Luxury)' },
                      { value: 'friendly', label: '亲切友好 (Friendly)' },
                    ]}
                    value={settings.defaultTone}
                  />
                </Card.Section>
              </Card>
              
              {/* 品牌声音 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">🎨 品牌声音（可选）</Text>
                  <Text tone="secondary" variant="bodySm">
                    描述您品牌的独特声音和调性
                  </Text>
                </Card.Section>
                <Card.Section>
                  <TextField
                    name="brandVoice"
                    label="品牌声音描述"
                    labelHidden
                    placeholder="例如：年轻活力、创新科技、环保可持续"
                    multiline={3}
                    autoComplete="off"
                    helpText="AI会参考您的品牌声音来生成描述"
                  />
                </Card.Section>
              </Card>
              
              {/* 常用关键词 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">🔑 常用关键词</Text>
                  <Text tone="secondary" variant="bodySm">
                    每次生成都会自动包含的关键词
                  </Text>
                </Card.Section>
                <Card.Section>
                  <TextField
                    name="preferredKeywords"
                    label="常用关键词"
                    labelHidden
                    placeholder="用英文逗号分隔，例如：premium, eco-friendly, bestseller"
                    autoComplete="off"
                    helpText="这些关键词会始终包含在SEO优化中"
                  />
                </Card.Section>
              </Card>
              
              {/* 自动应用 */}
              <Card>
                <Card.Section>
                  <Text variant="headingMd">⚡ 自动应用设置</Text>
                </Card.Section>
                <Card.Section>
                  <ChoiceList
                    name="autoApplyToShopify"
                    title="生成后自动应用到Shopify"
                    titleHidden
                    allowMultiple={false}
                    choices={[
                      { 
                        label: '开启 - 生成后直接更新产品描述', 
                        value: 'true' 
                      },
                      { 
                        label: '关闭（默认）- 生成后手动确认', 
                        value: 'false' 
                      },
                    ]}
                    selected={[settings.autoApplyToShopify ? 'true' : 'false']}
                  />
                </Card.Section>
              </Card>
              
              <Divider />
              
              {/* 保存按钮 */}
              <Button variant="primary" submit>
                保存设置
              </Button>
            </BlockStack>
          </Layout.Section>
        </Form>
        
        {/* 隐私政策 */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd">📜 隐私政策</Text>
            </Card.Section>
            <Card.Section>
              <Text variant="bodySm" as="p" tone="secondary">
                Haimo AI Lister 重视您的隐私。我们仅使用您提供的产品信息来生成描述，
                所有数据均安全存储，不会与第三方分享。如需了解更多，请查看我们的 
                <a href="https://haimotech.com/privacy" target="_blank" rel="noopener noreferrer">
                  隐私政策
                </a>。
              </Text>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
