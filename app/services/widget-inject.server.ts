/**
 * Widget Auto-Injection Service
 * 
 * Injects a tiny loader script into the store's theme.liquid via Shopify Asset API.
 * The loader sets window.__wismo_config and loads the actual widget JS from our CDN.
 * 
 * Benefits over the old approach (inline everything):
 * - Widget JS is a proper static file, debuggable in browser DevTools
 * - No template-literal escaping issues
 * - Update widget by deploying new JS file, no need to re-inject theme.liquid
 * - Loader is ~200 bytes, not ~7000 bytes
 */
import { shopifyREST } from '~/shopify.server';

const WISMO_MARKER_START = '<!-- WISMO_AI_WIDGET_START -->';
const WISMO_MARKER_END = '<!-- WISMO_AI_WIDGET_END -->';

// Legacy markers from v11 inline widget (before auto-injection)
const LEGACY_MARKER_START = '<!-- WISMO AI Widget v11 (Inline) -->';
const LEGACY_MARKER_END = '<!-- End WISMO AI Widget v11 -->';

const WIDGET_VERSION = '3.5.5';

/**
 * Build the tiny loader script that goes into theme.liquid
 * Just sets config and loads the external JS file
 */
function buildWidgetCode(config: {
  shop: string;
  apiEndpoint: string;
  position: string;
  color: string;
  greeting: string;
  brandName: string;
}): string {
  const pos = config.position === 'bottom-left' ? 'left' : 'right';
  const baseUrl = config.apiEndpoint.replace('/chat', '');
  
  // Sanitize config values for safe JSON embedding
  const safeGreeting = config.greeting
    .replace(/\\/g, '\\\\')
    .replace(/<[^>]*>/g, '')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
  const safeBrand = config.brandName
    .replace(/\\/g, '\\\\')
    .replace(/<[^>]*>/g, '')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
  
  return `${WISMO_MARKER_START}
<script>
window.__wismo_config={"shop":"${config.shop}","api":"${config.apiEndpoint}","pos":"${pos}","color":"${config.color}","greeting":"${safeGreeting}","brand":"${safeBrand}"};
(function(){var s=document.createElement('script');s.src='${baseUrl}/wismo-widget.js?v=${WIDGET_VERSION}';s.async=true;document.head.appendChild(s)})();
</script>
${WISMO_MARKER_END}`;
}

/**
 * Get the active (published) theme ID for a shop
 */
async function getActiveThemeId(shop: string, accessToken: string): Promise<number | null> {
  try {
    const themes = await shopifyREST(shop, accessToken, '/themes.json');
    const active = themes?.themes?.find((t: any) => t.role === 'main');
    return active?.id || null;
  } catch (e) {
    console.error('[WidgetInject] Failed to get active theme:', e);
    return null;
  }
}

/**
 * Get the current theme.liquid content
 */
async function getThemeLiquid(shop: string, accessToken: string, themeId: number): Promise<string | null> {
  try {
    const result = await shopifyREST(
      shop, accessToken,
      `/themes/${themeId}/assets.json?asset[key]=layout/theme.liquid`
    );
    return result?.asset?.value || null;
  } catch (e) {
    console.error('[WidgetInject] Failed to get theme.liquid:', e);
    return null;
  }
}

/**
 * Update the theme.liquid with the widget code
 */
async function updateThemeLiquid(shop: string, accessToken: string, themeId: number, content: string): Promise<boolean> {
  try {
    const result = await fetch(`https://${shop}/admin/api/2026-04/themes/${themeId}/assets.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: {
          key: 'layout/theme.liquid',
          value: content,
        },
      }),
    });
    return result.ok;
  } catch (e) {
    console.error('[WidgetInject] Failed to update theme.liquid:', e);
    return false;
  }
}

/**
 * Inject or update the WISMO widget in the store's theme.liquid
 */
export async function injectWidget(config: {
  shop: string;
  accessToken: string;
  position?: string;
  color?: string;
  greeting?: string;
  brandName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { shop, accessToken } = config;
  
  const themeId = await getActiveThemeId(shop, accessToken);
  if (!themeId) {
    return { success: false, error: 'Could not find active theme' };
  }
  
  const currentContent = await getThemeLiquid(shop, accessToken, themeId);
  if (!currentContent) {
    return { success: false, error: 'Could not read theme.liquid' };
  }
  
  const apiEndpoint = `${process.env.SHOPIFY_APP_URL || 'https://shopify-ai-lister-tau.vercel.app'}/api/chat`;
  const widgetCode = buildWidgetCode({
    shop,
    apiEndpoint,
    position: config.position || 'bottom-right',
    color: config.color || '#008060',
    greeting: config.greeting || 'Track your order in seconds',
    brandName: config.brandName || '',
  });
  
  let newContent: string;
  
  // Remove legacy v11 widget code
  if (currentContent.includes(LEGACY_MARKER_START)) {
    const legacyStart = currentContent.indexOf(LEGACY_MARKER_START);
    const legacyEndMarker = currentContent.indexOf(LEGACY_MARKER_END);
    if (legacyEndMarker > -1) {
      const legacyEnd = legacyEndMarker + LEGACY_MARKER_END.length;
      currentContent = currentContent.substring(0, legacyStart).trimEnd() + '\n' + currentContent.substring(legacyEnd).trimStart();
    } else {
      const scriptEnd = currentContent.indexOf('</script>', legacyStart) + '</script>'.length;
      currentContent = currentContent.substring(0, legacyStart).trimEnd() + '\n' + currentContent.substring(scriptEnd).trimStart();
    }
  }
  
  if (currentContent.includes(WISMO_MARKER_START)) {
    const startIdx = currentContent.indexOf(WISMO_MARKER_START);
    const endIdx = currentContent.indexOf(WISMO_MARKER_END) + WISMO_MARKER_END.length;
    newContent = currentContent.substring(0, startIdx) + widgetCode + currentContent.substring(endIdx);
  } else {
    const bodyCloseIdx = currentContent.lastIndexOf('</body>');
    if (bodyCloseIdx === -1) {
      return { success: false, error: 'Could not find </body> in theme.liquid' };
    }
    newContent = currentContent.substring(0, bodyCloseIdx) + '\n' + widgetCode + '\n' + currentContent.substring(bodyCloseIdx);
  }
  
  const success = await updateThemeLiquid(shop, accessToken, themeId, newContent);
  if (!success) {
    return { success: false, error: 'Failed to update theme.liquid' };
  }
  
  console.log(`[WidgetInject] ✅ Widget loader injected for ${shop} (theme ${themeId})`);
  return { success: true };
}

/**
 * Remove the WISMO widget from the store's theme.liquid
 */
export async function removeWidget(shop: string, accessToken: string): Promise<boolean> {
  const themeId = await getActiveThemeId(shop, accessToken);
  if (!themeId) return false;
  
  const currentContent = await getThemeLiquid(shop, accessToken, themeId);
  if (!currentContent) return false;
  
  let newContent = currentContent;
  
  if (newContent.includes(WISMO_MARKER_START)) {
    const startIdx = newContent.indexOf(WISMO_MARKER_START);
    const endIdx = newContent.indexOf(WISMO_MARKER_END) + WISMO_MARKER_END.length;
    newContent = newContent.substring(0, startIdx).trimEnd() + '\n' + newContent.substring(endIdx).trimStart();
  }
  
  if (newContent.includes(LEGACY_MARKER_START)) {
    const legacyStart = newContent.indexOf(LEGACY_MARKER_START);
    const legacyEndMarker = newContent.indexOf(LEGACY_MARKER_END);
    if (legacyEndMarker > -1) {
      const legacyEnd = legacyEndMarker + LEGACY_MARKER_END.length;
      newContent = newContent.substring(0, legacyStart).trimEnd() + '\n' + newContent.substring(legacyEnd).trimStart();
    } else {
      const scriptEnd = newContent.indexOf('</script>', legacyStart) + '</script>'.length;
      newContent = newContent.substring(0, legacyStart).trimEnd() + '\n' + newContent.substring(scriptEnd).trimStart();
    }
  }
  
  if (newContent === currentContent) return true;
  return await updateThemeLiquid(shop, accessToken, themeId, newContent);
}
