/**
 * WISMO AI - Widget Loader (<5KB)
 * 
 * This is the minimal loader that gets injected by the Theme App Extension.
 * It renders the chat bubble immediately, then lazy-loads the full widget.
 */
(function() {
  'use strict';

  // Read config from the embed block
  var root = document.getElementById('wismo-chat-root');
  if (!root) return;
  
  var shop = root.dataset.shop;
  var locale = root.dataset.locale || 'en';
  var config = {};
  try { config = JSON.parse(root.dataset.widgetConfig || '{}'); } catch(e) {}
  
  if (!shop) return;

  // Check if widget is disabled via Theme Editor setting
  if (config.enabled === 'false') return;

  var API_BASE = 'https://shopify-ai-lister-tau.vercel.app';
  var loaded = false;

  // Create host with Shadow DOM for CSS isolation
  var host = document.createElement('div');
  host.id = 'wismo-widget-host';
  host.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
  
  // Apply position from config
  if (config.position === 'bottom-left') {
    host.style.right = 'auto';
    host.style.left = '20px';
  }
  
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'open' });

  // Apply color from config
  var widgetColor = config.color || '#008060';

  // Render minimal chat bubble immediately
  var bubble = document.createElement('button');
  bubble.setAttribute('aria-label', 'Track your order - AI Assistant');
  bubble.style.cssText = 'width:56px;height:56px;border-radius:50%;background:' + widgetColor + ';color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.2s,box-shadow 0.2s;outline:none;position:relative;';
  bubble.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg><span style="position:absolute;bottom:-2px;right:-2px;background:#fff;color:' + widgetColor + ';font-size:8px;font-weight:700;padding:1px 4px;border-radius:6px;border:1px solid #e5e7eb;line-height:1.3;">AI</span>';
  
  bubble.addEventListener('mouseenter', function() {
    bubble.style.transform = 'scale(1.08)';
    bubble.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
  });
  bubble.addEventListener('mouseleave', function() {
    bubble.style.transform = 'scale(1)';
    bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });

  shadow.appendChild(bubble);

  // Load full widget on first interaction
  function loadFullWidget() {
    if (loaded) return;
    loaded = true;

    // Remove the simple bubble - the full widget will replace it
    host.remove();

    // Load the full widget script with config params
    var params = 'shop=' + encodeURIComponent(shop);
    if (config.color) params += '&color=' + encodeURIComponent(config.color);
    if (config.position) params += '&position=' + encodeURIComponent(config.position);
    
    var script = document.createElement('script');
    script.src = API_BASE + '/widget.js?' + params;
    script.async = true;
    script.setAttribute('data-wismo', 'full');
    document.body.appendChild(script);
  }

  // Trigger: click, or 3 seconds after page load
  bubble.addEventListener('click', loadFullWidget);
  window.addEventListener('load', function() {
    setTimeout(loadFullWidget, 3000);
  });
})();
