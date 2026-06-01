/**
 * 安装引导页面
 * 
 * 用户首次访问时的引导流程
 */
import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
} from '@shopify/polaris';
import { authenticate } from '~/shopify.server';

export async function loader({ request }: LoaderFunctionArgs) {
  // 确保用户已安装
  const { session } = await authenticate.admin(request);
  
  return json({
    shop: session.shop,
  });
}

export default function InstallPage() {
  const { shop } = useLoaderData<typeof loader>();
  
  return (
    <Page title="Haimo AI Lister - 欢迎使用">
      <Layout>
        <Layout.Section>
          <Card>
            <Card.Section>
              <BlockStack gap="600" align="center">
                {/* Logo */}
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 16, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text variant="headingXl" as="span" tone="inverse">
                    AI
                  </Text>
                </div>
                
                {/* 标题 */}
                <BlockStack gap="200" align="center">
                  <Text variant="headingLg">欢迎使用 Haimo AI Lister</Text>
                  <Text tone="secondary" alignment="center">
                    专为跨境卖家设计的AI产品描述生成器
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card.Section>
            
            <Card.Section>
              <BlockStack gap="300">
                <Text variant="bodyMd" fontWeight="semibold">
                  🌟 您的店铺 {shop} 已成功安装！
                </Text>
                
                <Text variant="bodyMd">
                  接下来，您可以：
                </Text>
                
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center">
                    <Text variant="bodyMd" fontWeight="bold">1.</Text>
                    <Text variant="bodyMd">前往「AI生成」开始生成产品描述</Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Text variant="bodyMd" fontWeight="bold">2.</Text>
                    <Text variant="bodyMd">在「设置」中配置您的偏好</Text>
                  </InlineStack>
                  <InlineStack gap="200" blockAlign="center">
                    <Text variant="bodyMd" fontWeight="bold">3.</Text>
                    <Text variant="bodyMd">升级到付费计划解锁更多功能</Text>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card.Section>
            
            <Card.Section>
              <InlineStack gap="200">
                <Link to="/app">
                  <Button variant="primary" size="large">
                    立即开始
                  </Button>
                </Link>
                <Link to="/app/billing">
                  <Button variant="secondary">
                    查看定价
                  </Button>
                </Link>
              </InlineStack>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
