/**
 * Shopify GraphQL Admin API 服务
 * 
 * 使用GraphQL API读写Shopify产品数据
 * 注意：2025年4月起REST API已废弃，所有新App必须使用GraphQL
 */
import type { ShopifyProduct, ProductVariant } from '~/types';

/**
 * 获取店铺产品列表
 */
export async function getProducts(admin: any, first = 50): Promise<ShopifyProduct[]> {
  const response = await admin.graphql(`
    query GetProducts($first: Int!) {
      products(first: $first) {
        nodes {
          id
          title
          handle
          descriptionHtml
          tags
          vendor
          productType
          createdAt
          updatedAt
          images(first: 1) {
            nodes {
              url
              altText
            }
          }
          variants(first: 10) {
            nodes {
              id
              title
              price
              sku
              quantityAvailable
            }
          }
        }
      }
    }
  `, { variables: { first } });
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  
  return data.data.products.nodes.map((product: any) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    descriptionHtml: product.descriptionHtml,
    tags: product.tags,
    vendor: product.vendor,
    productType: product.productType,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    images: product.images.nodes,
    variants: product.variants.nodes.map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      sku: v.sku,
      inventoryQuantity: v.quantityAvailable,
    })),
  }));
}

/**
 * 获取单个产品详情
 */
export async function getProduct(admin: any, productId: string): Promise<ShopifyProduct | null> {
  const response = await admin.graphql(`
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        handle
        descriptionHtml
        tags
        vendor
        productType
        createdAt
        updatedAt
        images(first: 5) {
          nodes {
            url
            altText
          }
        }
        variants(first: 20) {
          nodes {
            id
            title
            price
            sku
            quantityAvailable
          }
        }
      }
    }
  `, { variables: { id: productId } });
  
  const data = await response.json();
  
  if (data.errors || !data.data.product) {
    return null;
  }
  
  const product = data.data.product;
  
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    descriptionHtml: product.descriptionHtml,
    tags: product.tags,
    vendor: product.vendor,
    productType: product.productType,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    images: product.images.nodes,
    variants: product.variants.nodes.map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
      sku: v.sku,
      inventoryQuantity: v.quantityAvailable,
    })),
  };
}

/**
 * 更新产品描述
 */
export async function updateProductDescription(
  admin: any,
  productId: string,
  descriptionHtml: string
): Promise<{ success: boolean; error?: string }> {
  const response = await admin.graphql(`
    mutation UpdateProduct($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          descriptionHtml
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      input: {
        id: productId,
        descriptionHtml,
      },
    },
  });
  
  const data = await response.json();
  
  if (data.errors) {
    return { success: false, error: data.errors[0].message };
  }
  
  const { userErrors } = data.data.productUpdate;
  
  if (userErrors.length > 0) {
    return { success: false, error: userErrors[0].message };
  }
  
  return { success: true };
}

/**
 * 更新产品Metafield（用于存储SEO关键词）
 */
export async function updateProductMetafield(
  admin: any,
  productId: string,
  keywords: string[]
): Promise<{ success: boolean; error?: string }> {
  const metafieldNamespace = 'haimo_ai';
  const metafieldKey = 'seo_keywords';
  
  const response = await admin.graphql(`
    mutation UpdateProductMetafield($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      input: {
        id: productId,
        metafields: [
          {
            namespace: metafieldNamespace,
            key: metafieldKey,
            type: 'single_line_text_field',
            value: keywords.join(', '),
          },
        ],
      },
    },
  });
  
  const data = await response.json();
  
  if (data.errors) {
    return { success: false, error: data.errors[0].message };
  }
  
  const { userErrors } = data.data.productUpdate;
  
  if (userErrors.length > 0) {
    return { success: false, error: userErrors[0].message };
  }
  
  return { success: true };
}

/**
 * 批量更新产品描述
 */
export async function batchUpdateProductDescriptions(
  admin: any,
  updates: { productId: string; descriptionHtml: string }[],
  onProgress?: (index: number, total: number) => void
): Promise<{
  success: number;
  failed: { productId: string; error: string }[];
}> {
  const failed: { productId: string; error: string }[] = [];
  let successCount = 0;
  
  for (let i = 0; i < updates.length; i++) {
    const { productId, descriptionHtml } = updates[i];
    
    const result = await updateProductDescription(admin, productId, descriptionHtml);
    
    if (result.success) {
      successCount++;
    } else {
      failed.push({ productId, error: result.error || 'Unknown error' });
    }
    
    if (onProgress) {
      onProgress(i + 1, updates.length);
    }
    
    // 避免API限流
    if (i < updates.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return { success: successCount, failed };
}

/**
 * 获取店铺基本信息
 */
export async function getShopInfo(admin: any): Promise<{
  name: string;
  email: string;
  domain: string;
  plan: { name: string };
} | null> {
  const response = await admin.graphql(`
    query {
      shop {
        name
        email
        domain
        plan {
          displayName
        }
      }
    }
  `);
  
  const data = await response.json();
  
  if (data.errors || !data.data.shop) {
    return null;
  }
  
  return {
    name: data.data.shop.name,
    email: data.data.shop.email,
    domain: data.data.shop.domain,
    plan: { name: data.data.shop.plan.displayName },
  };
}

/**
 * 搜索产品
 */
export async function searchProducts(
  admin: any,
  query: string,
  first = 20
): Promise<ShopifyProduct[]> {
  const response = await admin.graphql(`
    query SearchProducts($query: String!, $first: Int!) {
      products(first: $first, query: $query) {
        nodes {
          id
          title
          handle
          descriptionHtml
          tags
          vendor
          productType
          updatedAt
          variants(first: 5) {
            nodes {
              id
              title
              price
            }
          }
        }
      }
    }
  `, { variables: { query, first } });
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  
  return data.data.products.nodes.map((product: any) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    descriptionHtml: product.descriptionHtml,
    tags: product.tags,
    vendor: product.vendor,
    productType: product.productType,
    createdAt: '',
    updatedAt: product.updatedAt,
    variants: product.variants.nodes.map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.price,
    })),
  }));
}
