/**
 * Widget Auto-Injection Service
 * 
 * Injects/updates the WISMO AI widget code into the store's theme.liquid
 * via Shopify Asset API (requires write_themes scope).
 * 
 * Called when:
 * 1. App is first installed (auth callback)
 * 2. Settings are saved (to update widget config)
 */
import { shopifyREST } from '~/shopify.server';

const WISMO_MARKER_START = '<!-- WISMO_AI_WIDGET_START -->';
const WISMO_MARKER_END = '<!-- WISMO_AI_WIDGET_END -->';

// Legacy markers from v11 inline widget (before auto-injection)
const LEGACY_MARKER_START = '<!-- WISMO AI Widget v11 (Inline) -->';
const LEGACY_MARKER_END = '<!-- End WISMO AI Widget v11 -->';

/**
 * Build the inline widget code that goes into theme.liquid
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
  
  return `${WISMO_MARKER_START}
<script>
(function(){
  var SHOP='${config.shop}';
  var API='${config.apiEndpoint}';
  var POS='${pos}';
  var COLOR='${config.color}';
  var GREETING='${config.greeting.replace(/\\/g, "\\\\").replace(/<[^>]*>/g, "").replace(/'/g, "\\'").replace(/\n/g, " ").replace(/\r/g, "")}';
  var BRAND='${config.brandName.replace(/\\/g, "\\\\").replace(/<[^>]*>/g, "").replace(/'/g, "\\'").replace(/\n/g, " ").replace(/\r/g, "")}';
  if(window.__wismo_booted)return;window.__wismo_booted=true;
  var s=document.createElement('div');s.id='wismo-host';
  var sh=s.attachShadow({mode:'open'});
  sh.innerHTML=\`
<style>
*{box-sizing:border-box;margin:0;padding:0}
:host{position:fixed;bottom:80px;\${POS}:24px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
@media(max-width:480px){:host{bottom:60px;\${POS}:8px}}
.b{width:56px;height:56px;border-radius:50%;background:\${COLOR};border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:transform .2s,box-shadow .2s;position:fixed;bottom:80px;\${POS}:24px}
@media(max-width:480px){.b{bottom:60px;\${POS}:8px;width:48px;height:48px}}
.b:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,.3)}
.b svg{width:26px;height:26px;fill:#fff}
.c{position:fixed;bottom:156px;\${POS}:24px;width:380px;max-height:560px;background:#fff;border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,.18);display:none;flex-direction:column;overflow:hidden}
@media(max-width:480px){.c{bottom:0;\${POS}:0;right:0;width:100%;height:100%;max-height:100%;border-radius:0}}
.ch{background:\${COLOR};color:#fff;padding:16px;display:flex;align-items:center;justify-content:space-between}
.ch h3{font-size:15px;font-weight:700}.ch small{font-size:11px;opacity:.85;display:block;margin-top:2px}
.cx{background:none;border:none;color:#fff;cursor:pointer;padding:4px;border-radius:6px;line-height:1;font-size:20px}
.cx:hover{background:rgba(255,255,255,.2)}
.cb{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.m{padding:10px 14px;border-radius:12px;font-size:13.5px;line-height:1.5;max-width:90%;word-wrap:break-word}
.mb{background:#e8f5e9;color:#1a1a1a;align-self:flex-start}
.mu{background:#f1f3f5;color:#1a1a1a;align-self:flex-end}
.ci{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #f1f3f5}
.ci input{flex:1;padding:10px 14px;border:1.5px solid #e1e3e5;border-radius:10px;font-size:13px;outline:none;transition:border .2s}
.ci input:focus{border-color:\${COLOR}}
.ci button{padding:10px 18px;background:\${COLOR};color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s;white-space:nowrap}
.ci button:hover{opacity:.9}
.pr{font-size:10px;color:#bbb;text-align:center;padding:4px 0 8px}
.ld{display:flex;gap:4px;padding:4px 0}
.ld span{width:6px;height:6px;border-radius:50%;background:\${COLOR};animation:dot 1.4s infinite both}
.ld span:nth-child(2){animation-delay:.2s}.ld span:nth-child(3){animation-delay:.4s}
@keyframes dot{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
.qr{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.qb{padding:6px 12px;background:#f1f3f5;border:1px solid #e1e3e5;border-radius:8px;font-size:12px;cursor:pointer;transition:background .15s}
.qb:hover{background:#e8f5e9;border-color:\${COLOR}}
a{color:#2563eb}
</style>
<div class="b" id="wb" style="display:none"><svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></div>
<div class="c" id="wc"><div class="ch"><div><h3>Order Tracking</h3><small>AI-powered</small></div><button class="cx" id="wx">&times;</button></div><div class="cb" id="wm"></div><div class="ci"><input id="wi" placeholder="Enter order number or email..." /><button id="wt">Track</button></div><div class="pr">Privacy</div></div>\`;
  document.body.appendChild(s);
  var bubble=sh.getElementById('wb'),chat=sh.getElementById('wc'),msgs=sh.getElementById('wm'),inp=sh.getElementById('wi'),btn=sh.getElementById('wt'),close=sh.getElementById('wx'),cid=null,open=false;
  function safeHtml(t){var e=document.createElement('span');e.textContent=t;var s=e.innerHTML;s=s.replace(/\\*\\*(.+?)\\*\\*/g,'<strong>$1</strong>');s=s.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,function(m,t,u){return/^https?:\/\//i.test(u)?'<a href="'+u+'" target="_blank" rel="noopener">'+t+'</a>':t});return s}
  try{var saved=localStorage.getItem('wismo_cid');if(saved)cid=saved}catch(e){}
  function toggle(){open=!open;chat.style.display=open?'flex':'none';bubble.style.display=open?'none':'flex';if(open&&msgs.children.length===0)addBot(GREETING)}
  bubble.onclick=toggle;close.onclick=toggle;
  function addBot(t){var d=sh.createElement('div');d.className='m mb';d.innerHTML=safeHtml(t);msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}
  function addUser(t){var d=sh.createElement('div');d.className='m mu';d.textContent=t;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}
  function addLoading(){var d=sh.createElement('div');d.className='m mb';d.id='wld';d.innerHTML='<div class="ld"><span></span><span></span><span></span></div>';msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}
  function rmLoading(){var d=sh.getElementById('wld');if(d)d.remove()}
  function addQuick(replies){if(!replies||!replies.length)return;var d=sh.createElement('div');d.className='qr';replies.forEach(function(r){var b=sh.createElement('button');b.className='qb';b.textContent=r;b.onclick=function(){d.remove();sendMsg(r)};d.appendChild(b)});msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}
  function sendMsg(text){try{if(!text||!text.trim())return;addUser(text);inp.value='';addLoading();fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shop:SHOP,message:text,conversationId:cid})}).then(function(r){return r.json()}).then(function(d){rmLoading();if(d.conversationId){cid=d.conversationId;try{localStorage.setItem('wismo_cid',cid)}catch(e){}}if(d.reply)addBot(d.reply);if(d.quickReplies)addQuick(d.quickReplies)}).catch(function(){rmLoading();addBot('Connection error. Please try again.')})}catch(e){rmLoading();addBot('Something went wrong. Please try again.')}}
  if(btn)btn.onclick=function(){sendMsg(inp?inp.value:'')};if(inp)inp.onkeydown=function(e){if(e.key==='Enter')sendMsg(inp.value)};
  fetch(API.replace('/chat','/widget-config')+'?shop='+encodeURIComponent(SHOP)).then(function(r){return r.json()}).then(function(d){if(d.enabled===false){bubble.style.display='none';return}bubble.style.display='flex';if(d.faqItems&&d.faqItems.length>0){var fd=sh.createElement('div');fd.className='qr';d.faqItems.forEach(function(item){var b=sh.createElement('button');b.className='qb';b.textContent=item.question;b.onclick=function(){fd.remove();sendMsg(item.question)};fd.appendChild(b)});msgs.appendChild(fd);msgs.scrollTop=msgs.scrollHeight}}).catch(function(){bubble.style.display='flex'});
})();
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
 * 
 * This is the main entry point. Call it with the shop credentials and widget config.
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
  
  // 1. Get active theme
  const themeId = await getActiveThemeId(shop, accessToken);
  if (!themeId) {
    return { success: false, error: 'Could not find active theme' };
  }
  
  // 2. Get current theme.liquid
  const currentContent = await getThemeLiquid(shop, accessToken, themeId);
  if (!currentContent) {
    return { success: false, error: 'Could not read theme.liquid' };
  }
  
  // 3. Build widget code
  const apiEndpoint = `${process.env.SHOPIFY_APP_URL || 'https://shopify-ai-lister-tau.vercel.app'}/api/chat`;
  const widgetCode = buildWidgetCode({
    shop,
    apiEndpoint,
    position: config.position || 'bottom-right',
    color: config.color || '#008060',
    greeting: config.greeting || 'Track your order in seconds',
    brandName: config.brandName || '',
  });
  
  // 4. Remove existing widget code (if any) and add new
  let newContent: string;
  
  // First, remove any legacy v11 widget code (no WISMO_AI_WIDGET markers)
  if (currentContent.includes(LEGACY_MARKER_START)) {
    const legacyStart = currentContent.indexOf(LEGACY_MARKER_START);
    const legacyEndMarker = currentContent.indexOf(LEGACY_MARKER_END);
    if (legacyEndMarker > -1) {
      const legacyEnd = legacyEndMarker + LEGACY_MARKER_END.length;
      currentContent = currentContent.substring(0, legacyStart).trimEnd() + '\n' + currentContent.substring(legacyEnd).trimStart();
    } else {
      // Legacy start marker but no end marker — remove from start to </script>
      const scriptEnd = currentContent.indexOf('</script>', legacyStart) + '</script>'.length;
      currentContent = currentContent.substring(0, legacyStart).trimEnd() + '\n' + currentContent.substring(scriptEnd).trimStart();
    }
  }
  
  if (currentContent.includes(WISMO_MARKER_START)) {
    // Replace existing widget block
    const startIdx = currentContent.indexOf(WISMO_MARKER_START);
    const endIdx = currentContent.indexOf(WISMO_MARKER_END) + WISMO_MARKER_END.length;
    newContent = currentContent.substring(0, startIdx) + widgetCode + currentContent.substring(endIdx);
  } else {
    // Inject before </body>
    const bodyCloseIdx = currentContent.lastIndexOf('</body>');
    if (bodyCloseIdx === -1) {
      return { success: false, error: 'Could not find </body> in theme.liquid' };
    }
    newContent = currentContent.substring(0, bodyCloseIdx) + '\n' + widgetCode + '\n' + currentContent.substring(bodyCloseIdx);
  }
  
  // 5. Upload updated theme.liquid
  const success = await updateThemeLiquid(shop, accessToken, themeId, newContent);
  if (!success) {
    return { success: false, error: 'Failed to update theme.liquid' };
  }
  
  console.log(`[WidgetInject] ✅ Widget injected for ${shop} (theme ${themeId})`);
  return { success: true };
}

/**
 * Remove the WISMO widget from the store's theme.liquid
 * Called on app uninstallation
 */
export async function removeWidget(shop: string, accessToken: string): Promise<boolean> {
  const themeId = await getActiveThemeId(shop, accessToken);
  if (!themeId) return false;
  
  const currentContent = await getThemeLiquid(shop, accessToken, themeId);
  if (!currentContent) return false;
  
  let newContent = currentContent;
  
  // Remove new-style widget (with markers)
  if (newContent.includes(WISMO_MARKER_START)) {
    const startIdx = newContent.indexOf(WISMO_MARKER_START);
    const endIdx = newContent.indexOf(WISMO_MARKER_END) + WISMO_MARKER_END.length;
    newContent = newContent.substring(0, startIdx).trimEnd() + '\n' + newContent.substring(endIdx).trimStart();
  }
  
  // Remove legacy v11 widget (with old markers)
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
  
  if (newContent === currentContent) return true; // nothing to remove
  return await updateThemeLiquid(shop, accessToken, themeId, newContent);
}
