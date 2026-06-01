/**
 * 首页仪表盘
 * 
 * 显示使用统计、最近生成、快速入口
 */
import { json } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  ProgressBar,
  Badge,
  EmptyState,
  List,
} from '@shopify/polaris';
import { WandIcon, PlusIcon, ChartIcon } from '@shopify/polaris-icons';
import { authenticate } from '~/shopify.server';
import { getUsageStats, formatUsageDisplay } from '~/services/usage-tracker.server';
import { getGenerations } from '~/services/supabase.server';
import { getShopInfo } from '~/services/shopify-api.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // 并行获取数据
  const [usageStats, generations, shopInfo] = await Promise.all([
    getUsageStats(request),
    getGenerations(session.shop, 5),
    authenticate.admin(request).then(({ admin }) => getShopInfo(admin)),
  ]);
  
  const usageDisplay = formatUsageDisplay(usageStats);
  
  return json({
    shopName: shopInfo?.name || session.shop,
    usageStats,
    usageDisplay,
    recentGenerations: generations,
  });
}

export default function Dashboard() {
  const { shopName, usageStats, usageDisplay, recentGenerations } = useLoaderData<typeof loader>();
  
  return (
    <Page title={`欢迎回来，${shopName}`}>
      <Layout>
        {/* 用量概览 */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd">本月用量</Text>
                  <Badge tone={getBadgeTone(usageDisplay.status)}>
                    {usageStats.planType} 计划
                  </Badge>
                </InlineStack>
                
                <InlineStack gap="200" blockAlign="center">
                  <Text variant="headingLg">{usageDisplay.used}</Text>
                  <Text variant="bodyMd" tone="secondary">/ {usageDisplay.total} 次生成</Text>
                </InlineStack>
                
                <ProgressBar 
                  progress={usageDisplay.percentage} 
                  color={getProgressColor(usageDisplay.status)}
                  size="small"
                />
                
                {usageStats.trialEndsAt && (
                  <Text variant="bodySm" tone="success">
                    试用剩余 {formatTrialDays(usageStats.trialEndsAt)} 天
                  </Text>
                )}
              </BlockStack>
            </Card.Section>
            
            <Card.Section>
              <InlineStack gap="200" wrap={false}>
                <Button 
                  variant="primary" 
                  icon={PlusIcon} 
                  url="/app/generate"
                >
                  生成新描述
                </Button>
                <Button 
                  variant="secondary" 
                  icon={WandIcon} 
                  url="/app/billing"
                >
                  {usageStats.planType === 'FREE' ? '升级计划' : '管理订阅'}
                </Button>
              </InlineStack>
            </Card.Section>
          </Card>
        </Layout.Section>
        
        {/* 快速开始 */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd" fontWeight="semibold">快速开始</Text>
            </Card.Section>
            <Card.Section>
              <BlockStack gap="300">
                <InlineStack gap="300" wrap={false}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 8, 
                    background: 'var(--p-color-bg-fill-success)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Text variant="headingLg">1</Text>
                  </div>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" fontWeight="semibold">输入中文产品信息</Text>
                    <Text variant="bodySm" tone="secondary">
                      填写产品名称、特点、目标关键词
                    </Text>
                  </BlockStack>
                </InlineStack>
                
                <InlineStack gap="300" wrap={false}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 8, 
                    background: 'var(--p-color-bg-fill-info)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Text variant="headingLg">2</Text>
                  </div>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" fontWeight="semibold">AI智能生成</Text>
                    <Text variant="bodySm" tone="secondary">
                      瞬间生成优化的英文描述
                    </Text>
                  </BlockStack>
                </InlineStack>
                
                <InlineStack gap="300" wrap={false}>
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 8, 
                    background: 'var(--p-color-bg-fill-warning)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <Text variant="headingLg">3</Text>
                  </div>
                  <BlockStack gap="100">
                    <Text variant="bodyMd" fontWeight="semibold">一键应用到Shopify</Text>
                    <Text variant="bodySm" tone="secondary">
                      编辑确认后直接更新产品
                    </Text>
                  </BlockStack>
                </InlineStack>
              </BlockStack>
            </Card.Section>
          </Card>
        </Layout.Section>
        
        {/* 最近生成 */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd">最近生成</Text>
                <Link to="/app/generate/history">
                  <Text variant="bodySm" tone="primary">查看全部</Text>
                </Link>
              </InlineStack>
            </Card.Section>
            
            {recentGenerations.length > 0 ? (
              <Card.Section>
                <List>
                  {recentGenerations.map((gen) => (
                    <List.Item key={gen.id}>
                      <InlineStack align="space-between" blockAlign="center">
                        <Text variant="bodyMd" truncate>
                          {gen.productTitle || '未命名产品'}
                        </Text>
                        <InlineStack gap="200">
                          <Badge tone={gen.status === 'completed' ? 'success' : 'critical'}>
                            {gen.status === 'completed' ? '完成' : '失败'}
                          </Badge>
                          <Text variant="bodySm" tone="secondary">
                            {formatDate(gen.createdAt)}
                          </Text>
                        </InlineStack>
                      </InlineStack>
                    </List.Item>
                  ))}
                </List>
              </Card.Section>
            ) : (
              <Card.Section>
                <EmptyState
                  heading="还没有生成记录"
                  action={{
                    content: '开始生成',
                    onAction: () => window.location.href = '/app/generate',
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>使用AI为您的产品生成优化的英文描述</p>
                </EmptyState>
              </Card.Section>
            )}
          </Card>
        </Layout.Section>
        
        {/* 提示与技巧 */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd" fontWeight="semibold">💡 优化技巧</Text>
            </Card.Section>
            <Card.Section>
              <List type="bullet">
                <List.Item>
                  <Text variant="bodySm">在产品特点中包含材质、尺寸、用途等信息</Text>
                </List.Item>
                <List.Item>
                  <Text variant="bodySm">添加目标关键词可获得更精准的SEO优化</Text>
                </List>
                <List.Item>
                  <Text variant="bodySm">竞品参考有助于AI理解市场定位</Text>
                </List.Item>
                <List.Item>
                  <Text variant="bodySm">定期查看生成历史，不断优化输入信息</Text>
                </List.Item>
              </List>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// 辅助函数
function getBadgeTone(status: string): "success" | "warning" | "critical" | "info" | "new" | "attention" | undefined {
  switch (status) {
    case 'ok': return 'success';
    case 'warning': return 'warning';
    case 'critical': return 'critical';
    default: return 'info';
  }
}

function getProgressColor(status: string): "success" | "warning" | "critical" | "primary" | undefined {
  switch (status) {
    case 'ok': return 'success';
    case 'warning': return 'warning';
    case 'critical': return 'critical';
    case 'exceeded': return 'critical';
    default: return 'primary';
  }
}

function formatTrialDays(trialEnd: string): number {
  const end = new Date(trialEnd);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  if (hours < 48) return '昨天';
  
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
