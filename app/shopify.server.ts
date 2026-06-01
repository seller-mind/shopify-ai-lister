import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion, BillingInterval, Session } from '@shopify/shopify-api';
import { restResources } from '@shopify/shopify-api/rest/admin/2026-04';
import { storeSessionInDB, loadSessionFromDB, deleteSessionFromDB } from '~/services/supabase.server';

/**
 * Shopify App 配置 - 使用 @shopify/shopify-api 直接
 */

// Custom session storage using Supabase
const supabaseSessionStorage = {
  storeSession: async (session: Session): Promise<boolean> => {
    return storeSessionInDB({
      id: session.id,
      shop: session.shop,
      state: session.state,
      isOnline: session.isOnline,
      accessToken: session.accessToken,
      scope: session.scope,
    });
  },
  loadSession: async (sessionId: string): Promise<Session | undefined> => {
    const data = await loadSessionFromDB(sessionId);
    if (!data) return undefined;
    const session = new Session({
      id: data.id,
      shop: data.shop,
      state: data.state,
      isOnline: data.isOnline,
      accessToken: data.accessToken,
      scope: data.scope,
    });
    return session;
  },
  deleteSession: async (sessionId: string): Promise<boolean> => {
    return deleteSessionFromDB(sessionId);
  },
};

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: ApiVersion.January25,
  hostName: process.env.SHOPIFY_APP_URL!.replace(/^https?:\/\//, ''),
  scopes: process.env.SCOPES?.split(',') ?? ['read_products', 'write_products'],
  isEmbeddedApp: true,
  restResources,
  sessionStorage: supabaseSessionStorage,
  billing: {
    'STARTER_PLAN': {
      amount: 19,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
      trialDays: 7,
    },
    'PRO_PLAN': {
      amount: 39,
      currencyCode: 'USD',
      interval: BillingInterval.Every30Days,
      trialDays: 7,
    },
  },
});

export default shopify;

/**
 * 认证辅助函数
 */
export const authenticate = {
  admin: async (request: Request) => {
    const { sessionId } = shopify.session.getCurrentId({
      isOnline: true,
      request,
    });
    
    if (!sessionId) {
      throw new Response('Unauthorized', { status: 401 });
    }
    
    const session = await loadSessionFromDB(sessionId);
    if (!session) {
      throw new Response('Unauthorized', { status: 401 });
    }
    
    const client = new shopify.clients.Rest({
      session: {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        accessToken: session.accessToken,
        scope: session.scope,
      } as Session,
    });
    
    return {
      session: {
        shop: session.shop,
        accessToken: session.accessToken,
      },
      admin: {
        graphql: async (query: string, variables?: any) => {
          const graphqlClient = new shopify.clients.Graphql({
            session: {
              id: session.id,
              shop: session.shop,
              state: session.state,
              isOnline: session.isOnline,
              accessToken: session.accessToken,
              scope: session.scope,
            } as Session,
          });
          return graphqlClient.query({ data: { query, variables } });
        },
      },
    };
  },
};
