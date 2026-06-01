/**
 * Shopify Admin API Service - Using fetch directly
 */

export async function getProducts(shop: string, accessToken: string, first = 50) {
  const response = await fetch(`https://${shop}/admin/api/2026-04/products.json?limit=${first}`, {
    headers: { 'X-Shopify-Access-Token': accessToken },
  });
  const data = await response.json();
  return data.products || [];
}

export async function updateProductDescription(
  shop: string, accessToken: string, productId: string, descriptionHtml: string
) {
  const response = await fetch(`https://${shop}/admin/api/2026-04/products/${productId}.json`, {
    method: 'PUT',
    headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: { id: productId, body_html: descriptionHtml } }),
  });
  return response.ok;
}

export async function getShopInfo(shop: string, accessToken: string) {
  const response = await fetch(`https://${shop}/admin/api/2026-04/shop.json`, {
    headers: { 'X-Shopify-Access-Token': accessToken },
  });
  const data = await response.json();
  return data.shop || null;
}
