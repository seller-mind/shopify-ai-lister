/**
 * 订阅管理页面
 * 
 * 管理Shopify Billing订阅
 */
import { json } from '@remix-run/node';
import { useLoaderData, Form, useNavigation } from '@remix-run/react';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Badge,
  Banner,
  Divider,
  List,
} from '@shopify/polaris';
import { 
  CheckIcon, 
  GiftIcon, 
  UpgradeIcon,
  PlansIcon,
} from '@shopify/polaris-icons';
import { authenticate } from '~/shopify.server';
import { checkSubscription, getAvailablePlans, requestSubscription } from '~/services/billing.server';
import { formatUsageDisplay, getUsageStats } from '~/services/usage-tracker.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  
  // 获取订阅信息
  const subscription = await checkSubscription(request);
  const usageStats = await getUsageStats(request);
  const usageDisplay = formatUsageDisplay(usageStats);
  const plans = getAvailablePlans();
  
  return json({
    shop: session.shop,
    subscription,
    usageStats,
    usageDisplay,
    plans,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const plan = formData.get('plan') as string;
  
  if (plan === 'STARTER' || plan === 'PRO') {
    // 发起订阅请求
    return requestSubscription(request, plan as any);
  }
  
  return json({ error: 'Invalid plan' });
}

export default function BillingPage() {
  const { subscription, usageStats, usageDisplay, plans } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isUpgrading = navigation.state === 'submitting';
  
  const currentPlanIndex = plans.findIndex(
    p => p.name.toUpperCase() === subscription.plan
  );
  
  return (
    <Page title="订阅管理">
      <Layout>
        {/* 当前状态 */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingMd">当前计划</Text>
                  <InlineStack gap="200" blockAlign="center">
                    <Badge 
                      tone={getBadgeTone(subscription.status)}
                      size="large"
                    >
                      {plans.find(p => p.name.toUpperCase() === subscription.plan)?.name || 'Free'}
                    </Badge>
                    {subscription.status === 'trialing' && (
                      <Badge tone="highlight">试用期</Badge>
                    )}
                    {subscription.status === 'active' && (
                      <Badge tone="success">已激活</Badge>
                    )}
                  </InlineStack>
                </BlockStack>
                
                <BlockStack gap="100" align="end">
                  <Text variant="headingLg">
                    {subscription.plan === 'FREE' ? '$0' : 
                     subscription.plan === 'STARTER' ? '$19' : '$39'}/月
                  </Text>
                  <Text tone="secondary" variant="bodySm">
                    {usageDisplay.used} / {usageDisplay.total} 次生成
                  </Text>
                </BlockStack>
              </InlineStack>
            </Card.Section>
            
            {/* 试用提示 */}
            {subscription.status === 'trialing' && subscription.trialEndsAt && (
              <Card.Section>
                <Banner tone="info" title="您有7天免费试用">
                  <p>
                    试用期将在 {formatDate(subscription.trialEndsAt)} 结束。
                    在此之前取消不会收取任何费用。
                  </p>
                </Banner>
              </Card.Section>
            )}
            
            {/* 升级提示（免费用户） */}
            {subscription.plan === 'FREE' && (
              <Card.Section>
                <Banner 
                  tone="success" 
                  title="升级到付费计划解锁更多功能"
                  action={{ content: '立即升级', url: '#plans' }}
                >
                  <p>Premium用户享受无限次生成和高级功能</p>
                </Banner>
              </Card.Section>
            )}
          </Card>
        </Layout.Section>
        
        {/* 定价计划 */}
        <Layout.Section id="plans">
          <Card>
            <Card.Section>
              <Text variant="headingMd">选择计划</Text>
            </Card.Section>
            <Card.Section>
              <InlineStack gap="400" wrap={false} blockAlign="start">
                {plans.map((plan, index) => {
                  const isCurrentPlan = index === currentPlanIndex;
                  const isRecommended = index === 1; // Starter推荐
                  
                  return (
                    <Card 
                      key={plan.name}
                      sectioned
                      style={{ 
                        flex: 1,
                        border: isRecommended ? '2px solid var(--p-color-bg-fill-success)' : undefined,
                        borderRadius: isRecommended ? 12 : undefined,
                      }}
                    >
                      <BlockStack gap="300">
                        {/* 计划名称 */}
                        <InlineStack align="space-between" blockAlign="center">
                          <Text variant="headingLg">{plan.name}</Text>
                          {isRecommended && (
                            <Badge tone="success">推荐</Badge>
                          )}
                          {isCurrentPlan && (
                            <Badge tone="info">当前</Badge>
                          )}
                        </InlineStack>
                        
                        {/* 价格 */}
                        <BlockStack gap="100">
                          <InlineStack gap="100" blockAlign="end">
                            <Text variant="headingXl" fontWeight="bold">
                              ${plan.price}
                            </Text>
                            <Text tone="secondary">/月</Text>
                          </InlineStack>
                          {plan.price > 0 && (
                            <Text variant="bodySm" tone="success">
                              <GiftIcon width={16} height={16} /> 7天免费试用
                            </Text>
                          )}
                        </BlockStack>
                        
                        <Divider />
                        
                        {/* 功能列表 */}
                        <List type="bullet">
                          {plan.features.map((feature, i) => (
                            <List.Item key={i}>
                              <InlineStack gap="100" blockAlign="center">
                                <CheckIcon tone="success" width={16} height={16} />
                                <Text variant="bodySm">{feature}</Text>
                              </InlineStack>
                            </List.Item>
                          ))}
                        </List>
                        
                        {/* 限制说明 */}
                        <Text variant="bodySm" tone="secondary">
                          每月 {plan.limits.generations === Infinity ? '无限' : plan.limits.generations} 次生成
                        </Text>
                        
                        {/* 操作按钮 */}
                        <BlockStack gap="200">
                          {isCurrentPlan ? (
                            subscription.plan === 'FREE' ? (
                              <Button
                                variant="primary"
                                url="#plans"
                                disabled={index <= currentPlanIndex}
                              >
                                {index === 0 ? '当前计划' : '升级'}
                              </Button>
                            ) : (
                              <Button disabled>
                                当前计划
                              </Button>
                            )
                          ) : index > currentPlanIndex ? (
                            <Form method="post">
                              <input type="hidden" name="plan" value={plan.name.toUpperCase()} />
                              <Button
                                variant="primary"
                                submit
                                loading={isUpgrading}
                                icon={isRecommended ? UpgradeIcon : undefined}
                              >
                                升级到 {plan.name}
                              </Button>
                            </Form>
                          ) : (
                            <Button disabled>
                              不可降级
                            </Button>
                          )}
                        </BlockStack>
                      </BlockStack>
                    </Card>
                  );
                })}
              </InlineStack>
            </Card.Section>
          </Card>
        </Layout.Section>
        
        {/* FAQ */}
        <Layout.Section>
          <Card>
            <Card.Section>
              <Text variant="headingMd">常见问题</Text>
            </Card.Section>
            <Card.Section>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold">
                    试用期结束后会自动扣费吗？
                  </Text>
                  <Text variant="bodySm" tone="secondary">
                    是的，7天免费试用结束后会自动按月续费。您可以随时在设置中取消订阅。
                  </Text>
                </BlockStack>
                
                <Divider />
                
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold">
                    未使用的生成次数会累积到下月吗？
                  </Text>
                  <Text variant="bodySm" tone="secondary">
                    不会，每月用量在月初重置。建议按需使用或升级到更高配额的计划。
                  </Text>
                </BlockStack>
                
                <Divider />
                
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold">
                    如何取消订阅？
                  </Text>
                  <Text variant="bodySm" tone="secondary">
                    您可以随时在订阅管理页面取消订阅。取消后，您仍可使用已付费的期限。
                  </Text>
                </BlockStack>
                
                <Divider />
                
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold">
                    支持哪些支付方式？
                  </Text>
                  <Text variant="bodySm" tone="secondary">
                    Shopify Billing支持所有Shopify支持的支付方式，包括信用卡、PayPal等。
                  </Text>
                </BlockStack>
              </BlockStack>
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
    case 'active': return 'success';
    case 'trialing': return 'highlight';
    case 'past_due': return 'critical';
    default: return 'info';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
