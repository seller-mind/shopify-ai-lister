import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  AppProvider,
  Loading,
  TopBar,
  Icon,
  Navigation,
  Box,
} from '@shopify/polaris';
import { HomeIcon, WandIcon, SettingsIcon, BillingIcon } from '@shopify/polaris-icons';
import { shopify } from '~/shopify.server';

/**
 * 根布局组件
 * 
 * 提供Polaris AppProvider和App Bridge配置
 * 管理全局导航和加载状态
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // 认证检查 - 确保用户已安装应用
  await shopify.authenticate.admin(request);
  
  return json({
    apiKey: process.env.SHOPIFY_API_KEY!,
    shop: process.env.SHOPIFY_APP_URL!,
  });
}

/**
 * 导航菜单配置
 */
const navigationMarkup = (
  <Navigation location="/">
    <Navigation.Section
      items={[
        {
          label: '首页仪表盘',
          icon: HomeIcon,
          url: '/app',
        },
        {
          label: 'AI生成描述',
          icon: WandIcon,
          url: '/app/generate',
        },
        {
          label: '订阅管理',
          icon: BillingIcon,
          url: '/app/billing',
        },
        {
          label: '设置',
          icon: SettingsIcon,
          url: '/app/settings',
        },
      ]}
    />
    <Navigation.Section
      title="Haimo Tech"
      items={[
        {
          label: '帮助与支持',
          url: 'https://haimotech.com/support',
          external: true,
        },
      ]}
    />
  </Navigation>
);

const topBarMarkup = (
  <TopBar
    showNavigationToggle
    title="Haimo AI Lister"
  />
);

/**
 * 主应用布局
 */
export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider isEmbeddedApp apiKey={apiKey}>
          <Box background="bg" minHeight="100vh">
            <div style={{ height: '56px' }}>
              {topBarMarkup}
            </div>
            {isLoading && <Loading />}
            <div style={{ display: 'flex' }}>
              <div style={{ width: '240px', flexShrink: 0 }}>
                {navigationMarkup}
              </div>
              <main style={{ flex: 1, padding: '16px' }}>
                <Outlet />
              </main>
            </div>
          </Box>
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * 全局错误边界
 */
export function ErrorBoundary() {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>出错了 - Haimo AI Lister</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#bf0711' }}>出错了</h1>
          <p>抱歉，应用加载时遇到了问题。</p>
          <a href="/app">返回首页</a>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
