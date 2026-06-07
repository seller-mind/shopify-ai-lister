/**
 * WISMO AI - Storefront Chat Widget v9 (Global Premium SaaS)
 * 
 * "Simple. Practical. Beautiful." - Apple/Stripe/Intercom level quality
 * ====================================================
 * ✓ ONE-STEP Tracking: inline order input in greeting card
 * ✓ Conversation Memory: persists across page loads via localStorage
 * ✓ Product Images: thumbnails in order card from Shopify
 * ✓ Premium Design: Apple-level polish, color-coded status, bot avatar
 * ✓ Instant Speed: greeting renders before API, animated loading messages
 * ✓ Zero Learning Curve: order input is the FIRST thing you see
 * ✓ Multi-language: auto-detect + respond in customer's language (20+)
 * ✓ Dark Mode: smooth auto-detect with refined palette
 * ✓ Feedback: thumbs up/down with thank-you animation
 * ✓ Mobile-first: full-screen overlay, safe area, touch-optimized
 * ✓ FAQ Integration: configurable quick replies from store settings
 * ✓ Multiple Orders: renders all order cards when returned
 * 
 * v9 "Global Premium SaaS":
 * - Animated contextual loading messages (feels faster, more human)
 * - Ultra-minimal header (cleaner gradient, no noise texture)
 * - Ultra-minimal footer (just separator + Privacy)
 * - Refined bubble animation (smoother pulse)
 * - Enhanced order card (better hierarchy, hover effects, dividers)
 * - Refined not-found card (elegant, better icon)
 * - Better quick replies (larger, more prominent)
 * - Smart greeting quick replies with FAQ integration
 * - Multiple order cards support
 * - Not-found card now functional (API fixed)
 */

// ─── HTML Escaping (XSS Prevention) ────────────────────────────────────
function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function escAttr(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function safeHref(url) { if (!url) return ''; var u = String(url).trim(); if (/^(https?:\/\/|mailto:)/i.test(u)) return escAttr(u); return '#'; }

// ─── Bootstrap ────────────────────────────────────────────────────────
// Prevent duplicate loading
if (window.__wismo_loaded) { console.log('[WISMO] Already loaded, skipping duplicate'); } else { window.__wismo_loaded = true;
var SCRIPT = document.currentScript;
var SRC = SCRIPT && SCRIPT.src ? new URL(SCRIPT.src) : null;
var SHOP = (SRC ? SRC.searchParams.get('shop') : '') || (document.getElementById('wismo-chat-root') || {}).dataset?.shop || '';
var API = SRC ? SRC.origin : 'https://shopify-ai-lister-tau.vercel.app';
var URL_COLOR = SRC ? SRC.searchParams.get('color') : null;
var URL_POSITION = SRC ? SRC.searchParams.get('position') : null;
var STORAGE_KEY = 'wismo_conv_' + SHOP;

// ─── State ────────────────────────────────────────────────────────────
var state = {
  config: null,
  convId: null,
  open: false,
  typing: false,
  greeted: false,
  loading: true,
  darkMode: false,
  lang: 'en',
  lastMsgId: 0,
};

// ─── Restore conversation from localStorage ───────────────────────────
try {
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    var parsed = JSON.parse(saved);
    if (parsed.convId && Date.now() - parsed.ts < 86400000) { // 24h
      state.convId = parsed.convId;
    }
  }
} catch(e) {}

function saveConv() {
  try {
    if (state.convId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ convId: state.convId, ts: Date.now() }));
    }
  } catch(e) {}
}

// ─── Dark Mode Detection ──────────────────────────────────────────────
try {
  state.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    state.darkMode = e.matches;
    var shadow = document.getElementById('wismo-host');
    if (shadow && shadow.shadowRoot) {
      var w = shadow.shadowRoot.querySelector('.w');
      if (w) w.classList.toggle('dark', state.darkMode);
    }
  });
} catch(e) {}

// ─── Boot ─────────────────────────────────────────────────────────────
(function boot() {
  if (!SHOP) { removeShell(); return; } // No shop = no widget
  renderShell();
  // Render bubble IMMEDIATELY — don't wait for API (instant perceived speed)
  // Then async load config and apply
  fetch(API + '/api/widget-config?shop=' + encodeURIComponent(SHOP))
    .then(function(r) { return r.json(); })
    .then(function(c) {
      if (!c || !c.enabled) { removeShell(); return; }
      state.config = c;
      state.loading = false;
      applyConfig(c);
    })
    .catch(function() { removeShell(); });
})();

// ─── Shell ────────────────────────────────────────────────────────────
function renderShell() {
  var host = document.createElement('div');
  host.id = 'wismo-host';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });
  var s = document.createElement('style');
  s.textContent = CSS();
  shadow.appendChild(s);
  var el = document.createElement('div');
  el.className = 'w' + (state.darkMode ? ' dark' : '');
  el.innerHTML = BUBBLE_HTML + WINDOW_HTML;
  shadow.appendChild(el);
  
  // Setup tooltip for bubble button
  setupBubbleTooltip(shadow);
}

function removeShell() {
  var h = document.getElementById('wismo-host');
  if (h) h.remove();
}

function applyConfig(c) {
  var shadow = document.getElementById('wismo-host').shadowRoot;
  // URL params override API config (from Theme Editor settings)
  var effectiveColor = URL_COLOR || c.color;
  var effectivePosition = URL_POSITION || c.position;
  if (effectiveColor) {
    shadow.querySelector('.w').style.setProperty('--ac', effectiveColor);
  }
  if (effectivePosition === 'bottom-left') {
    shadow.querySelector('.w').classList.add('left');
  }
  // Update header with brand name (or keep default "Order Tracking")
  var title = shadow.querySelector('.wt');
  if (title && c.brandName) title.textContent = c.brandName;
  // Update tooltip with brand name
  var tooltip = shadow.querySelector('.wb-tooltip');
  if (tooltip) {
    tooltip.textContent = c.brandName ? 'Track with ' + c.brandName : 'Track your order';
  }
}

// ─── Bubble Tooltip Setup ──────────────────────────────────────────────
function setupBubbleTooltip(shadow) {
  var bubble = shadow.querySelector('.wb');
  var tooltip = shadow.querySelector('.wb-tooltip');
  if (!bubble || !tooltip) return;
  
  var tooltipTimeout;
  var isMobile = window.matchMedia('(max-width: 480px)').matches;
  
  // Desktop: show on hover with delay
  if (!isMobile) {
    bubble.addEventListener('mouseenter', function() {
      tooltipTimeout = setTimeout(function() {
        tooltip.classList.add('wb-tooltip-show');
      }, 300);
    });
    bubble.addEventListener('mouseleave', function() {
      clearTimeout(tooltipTimeout);
      tooltip.classList.remove('wb-tooltip-show');
    });
  } else {
    // Mobile: show briefly on first appearance, then hide
    var hasShownMobileTooltip = false;
    bubble.addEventListener('click', function() {
      if (hasShownMobileTooltip) return;
      hasShownMobileTooltip = true;
      tooltip.classList.add('wb-tooltip-show');
      setTimeout(function() {
        tooltip.classList.remove('wb-tooltip-show');
      }, 1500);
    });
  }
}

// ─── HTML ─────────────────────────────────────────────────────────────
var BUBBLE_HTML = [
  '<button class="wb" aria-label="Track your order">',
  '  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">',
  '    <rect x="1" y="3" width="15" height="13" rx="2"/>',
  '    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>',
  '    <circle cx="5.5" cy="18.5" r="2.5"/>',
  '    <circle cx="18.5" cy="18.5" r="2.5"/>',
  '  </svg>',
  '  <span class="wb-tooltip">Track your order</span>',
  '</button>',
].join('');

var WINDOW_HTML = [
  '<div class="ww" style="display:none" role="dialog" aria-label="WISMO AI Order Tracking Chat">',
  '  <div class="wh">',
  '    <div class="whl">',
  '      <div class="wa">',
  '        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">',
  '          <rect x="1" y="3" width="15" height="13" rx="2"/>',
  '          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>',
  '          <circle cx="5.5" cy="18.5" r="2.5"/>',
  '          <circle cx="18.5" cy="18.5" r="2.5"/>',
  '        </svg>',
  '      </div>',
  '      <div>',
  '        <div class="wt">Order Tracking</div>',
  '        <div class="ws"><span class="wdot"></span> AI-powered · Online</div>',
  '      </div>',
  '    </div>',
  '    <button class="wx" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>',
  '  </div>',
  '  <div class="wm" role="log" aria-live="polite" aria-label="Chat messages"></div>',
  '  <div class="wq" style="display:none"></div>',
  '  <div class="wi">',
  '    <input type="text" class="win" placeholder="Type order number or question..." autocomplete="off" aria-label="Type your order number or question" />',
  '    <button class="wsn" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
  '  </div>',
  '  <div class="wft"><a href="' + API + '/privacy" target="_blank" rel="noopener" class="wft-privacy">Privacy</a> · <span class="wft-human" style="cursor:pointer">Talk to a human</span></div>',
  '</div>',
].join('');

// ─── Events ───────────────────────────────────────────────────────────
(function wireEvents() {
  var poll = setInterval(function() {
    var shadow = document.getElementById('wismo-host');
    if (!shadow) return;
    shadow = shadow.shadowRoot;
    if (!shadow) return;
    clearInterval(poll);

    var bubble = shadow.querySelector('.wb');
    var win = shadow.querySelector('.ww');
    var closeBtn = shadow.querySelector('.wx');
    var input = shadow.querySelector('.win');
    var sendBtn = shadow.querySelector('.wsn');
    var msgs = shadow.querySelector('.wm');
    var qr = shadow.querySelector('.wq');

    // ─── Open ──────────────────────────────────────────────
    bubble.addEventListener('click', function() {
      state.open = true;
      win.style.display = 'flex';
      win.classList.remove('ww-out');
      win.classList.add('ww-in');
      bubble.style.display = 'none';
      if (!state.greeted) {
        state.greeted = true;
        setTimeout(function() {
          showGreeting();
        }, 120);
      }
      setTimeout(function() { input.focus(); }, 400);
    });

    // ─── Close ─────────────────────────────────────────────
    closeBtn.addEventListener('click', function() {
      win.classList.remove('ww-in');
      win.classList.add('ww-out');
      setTimeout(function() {
        state.open = false;
        win.style.display = 'none';
        bubble.style.display = 'flex';
      }, 250);
    });
    var humanBtn = shadow.querySelector('.wft-human');
    if (humanBtn) humanBtn.addEventListener('click', function() { send('I need to talk to a human'); });

    // ─── Send ──────────────────────────────────────────────
    var send = function(text) {
      if (!text || state.typing) return;
      text = text.trim();
      if (!text) return;
      input.value = '';
      updateSendBtn();
      hideQR();
      addMsg('user', text);
      state.typing = true;
      
      // Show animated contextual loading message
      var loadingEl = showLoadingMessage();
      // Mobile: scroll to bottom after user sends
      setTimeout(function() { msgs.scrollTop = msgs.scrollHeight; }, 50);

      fetch(API + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, message: text, conversationId: state.convId }),
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        loadingEl.remove();
        state.typing = false;
        if (d.error) { 
          addMsg('bot', 'Something went wrong. Please try again.'); 
          showQR(['Try again', 'Talk to a human']);
          return; 
        }
        state.convId = d.conversationId;
        saveConv();
        if (d.language) state.lang = d.language;

        // Plan limit reached — show upgrade notice
        if (d.planLimited) {
          addMsg('bot', d.reply || 'This service is temporarily unavailable. The store owner needs to upgrade their plan.');
          return;
        }

        // Handle multiple order cards (NEW in v9)
        if (d.orderCards && d.orderCards.length) {
          d.orderCards.forEach(function(card) {
            addOrderCard(card);
          });
        } else if (d.orderCard) {
          addOrderCard(d.orderCard);
        } else if (d.notFound) {
          showNotFoundCard();
        } else {
          addMsg('bot', d.reply);
        }

        // Smart quick replies based on context
        if (d.quickReplies && d.quickReplies.length) {
          setTimeout(function() { showQR(d.quickReplies); }, 150);
        }
      })
      .catch(function() {
        loadingEl.remove();
        state.typing = false;
        addMsg('bot', 'Connection error. Please try again.');
        showQR(['Try again', 'Talk to a human']);
      });
    };

    sendBtn.addEventListener('click', function() { send(input.value); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
    });
    input.addEventListener('input', function() { updateSendBtn(); });
    updateSendBtn();
    
    // Paste Event Listener
    input.addEventListener('paste', function(e) {
      var pastedText = e.clipboardData.getData('text');
      if (/^#\d/.test(pastedText) || /^\d{4,}$/.test(pastedText.trim())) {
        setTimeout(function() { send(pastedText.trim()); }, 500);
      }
    });

    function updateSendBtn() {
      if (input.value.trim()) {
        sendBtn.classList.add('wsn-active');
      } else {
        sendBtn.classList.remove('wsn-active');
      }
    }

    // ─── Greeting with inline order input ──────────────────
    function showGreeting() {
      var greetingText = state.config && state.config.greeting ? state.config.greeting : 'Track your order';
      var faqItems = state.config && state.config.faqItems ? state.config.faqItems.slice(0, 2) : [];

      // Build greeting quick replies: "Where is my order?" first, FAQ items, "I have a question" last
      var qrItems = ['Where is my order?'];
      faqItems.forEach(function(item) {
        qrItems.push(item);
      });
      qrItems.push('I have a question');

      // SINGLE card: greeting text embedded in the input card — zero extra steps
      var card = document.createElement('div');
      card.className = 'mm m-bot';
      var avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      card.innerHTML = avatar + '<div class="mc"><div class="oi-card">' +
        '<div class="oi-label"><svg class="oi-pin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(greetingText) + '</div>' +
        '<div class="oi-row">' +
        '<input type="text" class="oi-input" placeholder="#1001 or email" autocomplete="off" />' +
        '<button class="oi-btn">Track <span class="oi-arrow">→</span></button>' +
        '</div>' +
        '<div class="oi-hint">AI-powered assistant · We'll find it instantly</div>' +
        '<div class="oi-example">e.g. #1001 or you@email.com</div>' +
        '</div></div>';
      msgs.appendChild(card);
      msgs.scrollTop = msgs.scrollHeight;

      // Wire the inline input
      var oiInput = card.querySelector('.oi-input');
      var oiBtn = card.querySelector('.oi-btn');
      oiInput.focus();

      var trackOrder = function() {
        var val = oiInput.value.trim();
        if (!val) return;
        // Hide the input card with animation
        card.style.transition = 'opacity 0.2s, max-height 0.2s';
        card.style.opacity = '0';
        card.style.maxHeight = '0';
        card.style.marginBottom = '0';
        card.style.overflow = 'hidden';
        setTimeout(function() { card.remove(); }, 200);
        send(val);
      };

      oiBtn.addEventListener('click', trackOrder);
      oiInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); trackOrder(); }
      });

      // Smart greeting quick replies
      setTimeout(function() {
        showQR(qrItems);
      }, 300);
    }

    // ─── Message Helpers ─────────────────────────────────────
    function addMsg(role, content) {
      var msgId = 'msg-' + (++state.lastMsgId);
      var d = document.createElement('div');
      d.className = 'mm m-' + role;
      d.dataset.msgId = msgId;

      var avatar = '';
      if (role === 'bot') {
        avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      }

      var html = esc(content)  // Escape HTML first to prevent XSS
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m, text, url) { return '<a href="' + safeHref(url) + '" target="_blank" rel="noopener">' + esc(text) + '</a>'; })
        .replace(/\n/g, '<br>');

      d.innerHTML = avatar + '<div class="mc"><div class="mt">' + html + '</div><div class="mts">' + formatTime(new Date()) + '</div></div>';

      if (role === 'bot') {
        var fb = document.createElement('div');
        fb.className = 'fb';
        fb.innerHTML = '<button class="fb-up" title="Helpful" data-msg="' + msgId + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></button><button class="fb-down" title="Not helpful" data-msg="' + msgId + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg></button>';
        d.querySelector('.mc').appendChild(fb);
        setTimeout(function() {
          var up = fb.querySelector('.fb-up');
          var down = fb.querySelector('.fb-down');
          if (up) up.addEventListener('click', function() { submitFeedback(msgId, 'positive', fb); });
          if (down) down.addEventListener('click', function() { submitFeedback(msgId, 'negative', fb); });
        }, 0);
      }

      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;

      if (role === 'bot') {
        setTimeout(function() {
          var fbEl = d.querySelector('.fb');
          if (fbEl && !fbEl.classList.contains('fb-done')) fbEl.classList.add('fb-fade');
        }, 12000);
      }
    }

    // ─── Animated Contextual Loading Messages (v9) ─────────────
    var loadingMessages = [
      { text: 'Looking up your order...', delay: 0 },
      { text: 'Checking delivery status...', delay: 1000 },
      { text: 'Almost there...', delay: 2000 }
    ];
    var loadingTimers = [];
    
    function showLoadingMessage() {
      var d = document.createElement('div');
      d.className = 'mm m-bot loading-msg';
      var avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      d.innerHTML = avatar + '<div class="mc"><div class="loading-dots"><span class="loading-text"></span><span class="dot-anim"><span></span><span></span><span></span></span></div></div>';
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;

      var textEl = d.querySelector('.loading-text');
      var currentIdx = 0;

      // Show first message immediately
      textEl.textContent = loadingMessages[0].text;

      // Set up timed message changes
      loadingTimers = [];
      for (var i = 1; i < loadingMessages.length; i++) {
        (function(idx) {
          var timer = setTimeout(function() {
            textEl.style.opacity = '0';
            textEl.style.transform = 'translateY(-4px)';
            setTimeout(function() {
              textEl.textContent = loadingMessages[idx].text;
              textEl.style.opacity = '1';
              textEl.style.transform = 'translateY(0)';
            }, 150);
          }, loadingMessages[idx].delay);
          loadingTimers.push(timer);
        })(i);
      }

      // Cleanup timers when removed
      d.cleanup = function() {
        loadingTimers.forEach(function(t) { clearTimeout(t); });
        loadingTimers = [];
      };

      return d;
    }

    // ─── Not Found Card ─────────────────────────────────────
    function showNotFoundCard() {
      var msgId = 'msg-' + (++state.lastMsgId);
      var d = document.createElement('div');
      d.className = 'mm m-bot';
      d.dataset.msgId = msgId;

      var avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      
      var cardHtml = '<div class="nf-card">';
      cardHtml += '<div class="nf-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></div>';
      cardHtml += '<div class="nf-title">Order not found</div>';
      cardHtml += '<ul class="nf-tips">';
      cardHtml += '<li>Double-check your order number</li>';
      cardHtml += '<li>Try using your email address</li>';
      cardHtml += '<li>Check your confirmation email</li>';
      cardHtml += '</ul>';
      cardHtml += '<div class="nf-retry">';
      cardHtml += '<input type="text" class="nf-input" placeholder="Try again..." autocomplete="off" />';
      cardHtml += '<button class="nf-btn">Search</button>';
      cardHtml += '</div>';
      cardHtml += '</div>';

      d.innerHTML = avatar + '<div class="mc">' + cardHtml;

      var timeEl = document.createElement('div');
      timeEl.className = 'mts';
      timeEl.textContent = formatTime(new Date());
      d.querySelector('.mc').appendChild(timeEl);

      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;

      // Wire retry functionality
      var nfInput = d.querySelector('.nf-input');
      var nfBtn = d.querySelector('.nf-btn');
      
      var retry = function() {
        var val = nfInput.value.trim();
        if (!val) return;
        d.style.opacity = '0';
        d.style.transform = 'translateY(10px)';
        setTimeout(function() { d.remove(); send(val); }, 200);
      };
      
      nfBtn.addEventListener('click', retry);
      nfInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); retry(); }
      });
      
      setTimeout(function() { nfInput.focus(); }, 100);
      
      // Quick replies for not found
      showQR(['Try my email', 'Contact support']);
    }

    // ─── Order Card ──────────────────────────────────────────
    function addOrderCard(card) {
      var msgId = 'msg-' + (++state.lastMsgId);
      var d = document.createElement('div');
      d.className = 'mm m-bot';
      d.dataset.msgId = msgId;

      var statusColor = getStatusColor(card.status);
      var isActive = ['PROCESSING', 'PARTIALLY_FULFILLED', 'FULFILLED'].indexOf(card.status) > -1;

      var cardHtml = '<div class="oc">';
      // Header
      cardHtml += '<div class="oc-h">';
      cardHtml += '<div class="oc-ord"><span class="oc-num">' + esc(card.orderNumber) + '</span></div>';
      cardHtml += '<span class="oc-status' + (isActive ? ' oc-status-pulse' : '') + '" style="background:' + statusColor.bg + ';color:' + statusColor.fg + '">' + esc(card.statusLabel) + '</span>';
      cardHtml += '</div>';

      // Items with optional images
      if (card.items && card.items.length) {
        cardHtml += '<div class="oc-items">';
        card.items.forEach(function(item, idx) {
          var img = card.itemImages && card.itemImages[idx] ? '<img src="' + escAttr(card.itemImages[idx]) + '" class="oc-item-img" />' : '<div class="oc-item-placeholder"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg></div>';
          cardHtml += '<span class="oc-item">' + img + esc(item) + '</span>';
        });
        cardHtml += '</div>';
      }

      // Horizontal Progress Bar with dates
      if (card.timeline && card.timeline.length) {
        cardHtml += '<div class="oc-progress">';
        
        var stages = [
          { key: 'processing', label: 'Processing', icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
          { key: 'shipped', label: 'Shipped', icon: '<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' },
          { key: 'delivered', label: 'Delivered', icon: '<polyline points="20 6 9 17 4 12"/>' }
        ];
        
        stages.forEach(function(stage, idx) {
          var isDone = card.timeline.some(function(t) { return t.completed && (t.label.toLowerCase().includes(stage.key) || t.status === stage.key); });
          var isAct = card.timeline.some(function(t) { return t.current && (t.label.toLowerCase().includes(stage.key) || t.status === stage.key); });
          var stageDate = null;
          card.timeline.forEach(function(t) {
            if (t.label.toLowerCase().includes(stage.key) || t.status === stage.key) {
              stageDate = t.date || t.timestamp;
            }
          });
          var cls = 'op-stage' + (isDone ? ' done' : '') + (isAct ? ' active' : '');
          cardHtml += '<div class="' + cls + '">';
          cardHtml += '<div class="op-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + stage.icon + '</svg></div>';
          cardHtml += '<div class="op-label">' + stage.label + '</div>';
          if (stageDate) {
            cardHtml += '<div class="op-date">' + formatDate(stageDate) + '</div>';
          }
          if (idx < stages.length - 1) cardHtml += '<div class="op-line' + (isDone ? ' done' : '') + '"></div>';
          cardHtml += '</div>';
        });
        
        cardHtml += '</div>';
      }

      // Tracking
      if (card.trackingCompany && card.trackingNumber) {
        cardHtml += '<div class="oc-track">';
        cardHtml += '<div class="oc-carrier">' + esc(card.trackingCompany) + ' · ' + esc(card.trackingNumber) + '</div>';
        if (card.trackingUrl) {
          cardHtml += '<a href="' + safeHref(card.trackingUrl) + '" target="_blank" rel="noopener" class="oc-track-btn">Track <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>';
        }
        cardHtml += '</div>';
      }

      // Delivery Countdown (v9: better formatting with <b> tags)
      if (card.estimatedDelivery) {
        var countdownText = getDeliveryCountdown(card.estimatedDelivery);
        cardHtml += '<div class="oc-countdown">' + countdownText + '</div>';
      }

      cardHtml += '</div>';

      var avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      d.innerHTML = avatar + '<div class="mc">' + cardHtml;

      var fb = document.createElement('div');
      fb.className = 'fb';
      fb.innerHTML = '<button class="fb-up" title="Helpful" data-msg="' + msgId + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg></button><button class="fb-down" title="Not helpful" data-msg="' + msgId + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg></button>';
      d.querySelector('.mc').appendChild(fb);

      var timeEl = document.createElement('div');
      timeEl.className = 'mts';
      timeEl.textContent = formatTime(new Date());
      d.querySelector('.mc').appendChild(timeEl);

      setTimeout(function() {
        var up = fb.querySelector('.fb-up');
        var down = fb.querySelector('.fb-down');
        if (up) up.addEventListener('click', function() { submitFeedback(msgId, 'positive', fb); });
        if (down) down.addEventListener('click', function() { submitFeedback(msgId, 'negative', fb); });
      }, 0);

      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;

      // Smart quick replies after finding order
      showQR(['Track another order', 'When will it arrive?', 'Need more help']);

      setTimeout(function() {
        var fbEl = d.querySelector('.fb');
        if (fbEl && !fbEl.classList.contains('fb-done')) fbEl.classList.add('fb-fade');
      }, 12000);
    }

    // ─── Feedback ────────────────────────────────────────────
    function submitFeedback(msgId, rating, fbEl) {
      fbEl.classList.add('fb-done');
      var btns = fbEl.querySelectorAll('button');
      btns.forEach(function(b) { b.style.pointerEvents = 'none'; });
      var activeBtn = rating === 'positive' ? fbEl.querySelector('.fb-up') : fbEl.querySelector('.fb-down');
      if (activeBtn) activeBtn.classList.add('fb-selected');
      if (rating === 'positive') {
        var thank = document.createElement('div');
        thank.className = 'fb-thanks';
        thank.textContent = 'Thanks!';
        fbEl.appendChild(thank);
        setTimeout(function() { thank.remove(); }, 2000);
      }
      fetch(API + '/api/chat?action=feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: state.convId, messageId: msgId, rating: rating }),
      }).catch(function() {});
    }

    function showQR(items) {
      qr.innerHTML = '';
      items.forEach(function(t, i) {
        var b = document.createElement('button');
        b.className = 'qb';
        b.textContent = t;
        b.style.animationDelay = (i * 60) + 'ms';
        b.addEventListener('click', function() { send(t); });
        qr.appendChild(b);
      });
      qr.style.display = 'flex';
    }

    function hideQR() { qr.style.display = 'none'; qr.innerHTML = ''; }
  }, 50);
})();

// ─── Helpers ──────────────────────────────────────────────────────────

function formatTime(d) {
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate();
  } catch(e) {
    return '';
  }
}

function getDeliveryCountdown(estDelivery) {
  if (!estDelivery) return '';
  try {
    var d = new Date(estDelivery);
    if (isNaN(d.getTime())) return 'Est. delivery: ' + estDelivery;
    
    var now = new Date();
    var diff = d.getTime() - now.getTime();
    var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) {
      var pastDays = Math.abs(days);
      if (pastDays === 0) return 'Delivered today!';
      if (pastDays === 1) return 'Delivered yesterday';
      return 'Delivered <b>' + pastDays + '</b> days ago';
    } else {
      if (days === 0) return 'Arriving today!';
      if (days === 1) return 'Arrives tomorrow';
      return 'Arrives in <b>' + days + '</b> days';
    }
  } catch(e) {
    return 'Est. delivery: ' + estDelivery;
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'FULFILLED': return { bg: '#dcfce7', fg: '#166534' };
    case 'UNFULFILLED': return { bg: '#dbeafe', fg: '#1e40af' };
    case 'PARTIALLY_FULFILLED': return { bg: '#ffedd5', fg: '#9a3412' };
    case 'RESTOCKED': return { bg: '#fce4ec', fg: '#c62828' };
    case 'PENDING': return { bg: '#fef9c3', fg: '#854d0e' };
    case 'PROCESSING': return { bg: '#e0e7ff', fg: '#3730a3' };
    default: return { bg: '#f1f2f3', fg: '#6d7175' };
  }
}

// ─── CSS ──────────────────────────────────────────────────────────────
function CSS() {
  return '
.w {
  --ac: #008060;
  --ac-light: #e8f5ef;
  --ac-glow: rgba(0,128,96,0.15);
  --ac-glow-strong: rgba(0,128,96,0.25);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow: 0 4px 14px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg: 0 16px 56px rgba(0,0,0,0.15), 0 6px 20px rgba(0,0,0,0.08);
  --shadow-accent: 0 4px 16px rgba(0,128,96,0.25);
  --radius-sm: 8px;
  --radius: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --bg-msg: #f4f5f7;
  --bg-card: #ffffff;
  --bg-input: #f8f9fa;
  --text-primary: #1a1a1a;
  --text-secondary: #6d7175;
  --text-tertiary: #9ca3af;
  --border-color: #e5e7eb;
  --border-light: #f1f2f3;
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  line-height: 1.5;
}

/* ─── Dark Mode ────────────────────────────────────── */
.w.dark {
  --bg-msg: #0f0f11;
  --bg-card: #1a1a1e;
  --bg-input: #1a1a1e;
  --ac-glow: rgba(0,128,96,0.25);
  --ac-glow-strong: rgba(0,128,96,0.4);
  --text-primary: #f5f5f7;
  --text-secondary: #a1a1a6;
  --text-tertiary: #6b7280;
  --border-color: #38383a;
  --border-light: #2c2c2e;
}
.w.dark .ww { background: #0f0f11; border-color: #2c2c2e; }
.w.dark .wm { background: #111113; }
.w.dark .wh { background: linear-gradient(135deg, #0a3d2e 0%, #0d4f3a 100%); }
.w.dark .m-bot .mc { background: var(--bg-card); color: var(--text-primary); }
.w.dark .ai-notice { background: #1a1a1e !important; color: #666 !important; }
.w.dark .m-user .mc { background: var(--ac); color: #fff; }
.w.dark .wi { background: #111113; border-top-color: var(--border-color); }
.w.dark .win { background: #2c2c2e; border-color: var(--border-color); color: var(--text-primary); }
.w.dark .win::placeholder { color: var(--text-tertiary); }
.w.dark .wq { background: #111113; }
.w.dark .qb { background: var(--bg-card); border-color: var(--ac); color: var(--ac); }
.w.dark .qb:hover { background: var(--ac); color: #fff; }
.w.dark .ma { background: #1a3d30; color: #4ade80; }
.w.dark .oc { background: var(--bg-card); border-color: #2c2c2e; box-shadow: 0 2px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05); }
.w.dark .oc-h { border-color: var(--border-color); }
.w.dark .oc-track { border-color: var(--border-color); }
.w.dark .oc-carrier { color: var(--text-secondary); }
.w.dark .oc-countdown { color: var(--text-secondary); }
.w.dark .oc-countdown b { color: var(--text-primary); }
.w.dark .tl-label { color: var(--text-primary); }
.w.dark .tl-date { color: var(--text-tertiary); }
.w.dark .tl-line { background: #38383a; }
.w.dark .tl-line.done { background: var(--ac); }
.w.dark .tl-step:not(.done):not(.active) .tl-dot { background: #2c2c2e; border-color: #38383a; }
.w.dark .oi-card { background: #1c1c1e; border-color: #38383a; }
.w.dark .oi-label { color: var(--text-primary); }
.w.dark .oi-input { background: #2c2c2e; border-color: #38383a; color: var(--text-primary); }
.w.dark .oi-input::placeholder { color: var(--text-tertiary); }
.w.dark .oi-hint { color: var(--text-tertiary); }
.w.dark .oi-example { color: var(--text-tertiary); }
.w.dark .fb button { color: var(--text-tertiary); }
.w.dark .mts { color: var(--text-tertiary); }
.w.dark .skeleton-card { background: var(--bg-card); }
.w.dark .skel-order, .w.dark .skel-progress, .w.dark .skel-track { background: #2c2c2e; }
.w.dark .ma-skel { background: #2c2c2e; }
.w.dark .nf-card { background: var(--bg-card); border-color: #38383a; }
.w.dark .nf-icon { background: rgba(0,128,96,0.15); color: var(--ac); }
.w.dark .nf-title { color: var(--text-primary); }
.w.dark .nf-tips li { color: var(--text-secondary); }
.w.dark .nf-input { background: #2c2c2e; border-color: #38383a; color: var(--text-primary); }
.w.dark .nf-input::placeholder { color: var(--text-tertiary); }
.w.dark .oc-item-placeholder { background: #2c2c2e; color: #555; }
.w.dark .loading-dots { color: var(--text-secondary); }
.w.dark .loading-text { color: var(--text-secondary); }

.w.left { right: auto; left: 24px; }

/* ─── Bubble with Refined Animation (v9) ──────────────────────────── */
.wb {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--ac) 0%, #006b4d 100%);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 2px 8px rgba(0,128,96,0.15), 
    0 8px 24px rgba(0,128,96,0.25), 
    0 16px 40px rgba(0,128,96,0.15),
    inset 0 1px 2px rgba(255,255,255,0.25),
    inset 0 -1px 2px rgba(0,0,0,0.1);
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
  outline: none;
  animation: bubbleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
  position: relative;
}

@keyframes bubbleIn {
  from { opacity: 0; transform: scale(0.6) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Refined smoother pulse animation (v9) */
.wb::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--ac);
  opacity: 0;
  animation: pulseRingV9 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
}

@keyframes pulseRingV9 {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.35); opacity: 0.2; }
  100% { transform: scale(1); opacity: 0; }
}

.wb:hover {
  transform: scale(1.04) !important;
  box-shadow: 
    0 4px 12px rgba(0,128,96,0.2), 
    0 12px 32px rgba(0,128,96,0.35), 
    0 20px 48px rgba(0,128,96,0.2),
    inset 0 1px 3px rgba(255,255,255,0.3),
    inset 0 -1px 2px rgba(0,0,0,0.15);
  animation: none;
}
.wb:hover::before { display: none; }
.wb:active { transform: scale(0.96) !important; }

/* Bubble Tooltip */
.wb-tooltip {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  background: #1a1a1a;
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 10;
}

.wb-tooltip::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-left-color: #1a1a1a;
}

.wb-tooltip-show {
  opacity: 1;
  transform: translateY(-50%) translateX(-4px);
}

/* Left positioned bubble tooltip */
.w.left .wb-tooltip {
  right: auto;
  left: calc(100% + 12px);
}
.w.left .wb-tooltip::after {
  right: auto;
  left: -6px;
  border: 6px solid transparent;
  border-right-color: #1a1a1a;
}
.w.left .wb-tooltip-show {
  transform: translateY(-50%) translateX(4px);
}

/* ─── Window ────────────────────────────────────── */
.ww {
  width: 420px;
  height: 620px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
}
.ww-in { animation: winIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
.ww-out { animation: winOut 0.25s cubic-bezier(0.4,0,1,1) forwards; }
@keyframes winIn {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes winOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(8px) scale(0.98); }
}

/* ─── Header - v9 Ultra Minimal ──────────────────────────────────── */
.wh {
  background: linear-gradient(135deg, #006b4d 0%, #008060 50%, #00996b 100%);
  color: #fff;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
}

/* Bottom gradient fade border (v9: cleaner, no noise texture) */
.wh::after {
  content: "";
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
}

.whl { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
.wa {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(255,255,255,0.2);
  position: relative;
}

.wa::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
}
.wt { font-weight: 700; font-size: 15px; letter-spacing: -0.01em; }
.ws { font-size: 12px; opacity: 0.85; margin-top: 2px; display: flex; align-items: center; gap: 5px; font-weight: 500; }
.wdot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #4ade80;
  display: inline-block;
  position: relative;
}

/* Online status dot glow ring */
.wdot::before {
  content: "";
  position: absolute;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: #4ade80;
  animation: wdotPulse 2s ease-in-out infinite;
}

@keyframes wdotPulse {
  0%, 100% { transform: scale(1.5); opacity: 0.3; }
  50% { transform: scale(2.2); opacity: 0; }
}

.wx {
  background: none; border: none; color: rgba(255,255,255,0.6);
  cursor: pointer; padding: 8px; border-radius: 10px;
  transition: background 0.15s, color 0.15s, transform 0.15s; outline: none;
}
.wx:hover { background: rgba(255,255,255,0.15); color: #fff; }
.wx:active { transform: scale(0.95); }

/* ─── Messages ────────────────────────────────────── */
.wm {
  flex: 1;
  padding: 16px 18px;
  overflow-y: auto;
  background: var(--bg-msg);
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
.wm::-webkit-scrollbar { width: 4px; }
.wm::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }

.mm {
  margin-bottom: 10px;
  display: flex;
  gap: 8px;
  max-width: 92%;
  animation: msgIn 0.35s cubic-bezier(0.16,1,0.3,1) both;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.m-user { margin-left: auto; flex-direction: row-reverse; }

/* Bot avatar */
.ma {
  width: 30px; height: 30px;
  border-radius: 10px;
  background: var(--ac-light);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--ac);
  margin-top: 2px;
  border: 1px solid rgba(0,128,96,0.08);
}

/* Message content */
.mc {
  padding: 11px 15px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.55;
  word-wrap: break-word;
  max-width: calc(100% - 44px);
}
.m-bot .mc {
  background: var(--bg-card);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
  border: 1px solid var(--border-light);
}
.m-user .mc {
  background: linear-gradient(180deg, var(--ac) 0%, rgba(0,128,96,0.95) 100%);
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,128,96,0.25);
}
.mm a { color: var(--ac); text-decoration: underline; }
.m-user .mc a { color: #fff; text-decoration: underline; }
.mts { font-size: 10px; color: var(--text-tertiary); margin-top: 6px; padding: 0 2px; }
.m-user .mts { text-align: right; }

/* ─── Animated Loading Message (v9) ──────────────────────────────── */
.loading-msg .mc {
  padding: 12px 16px;
}
.loading-dots {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}
.loading-text {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dot-anim {
  display: flex;
  gap: 3px;
  align-items: center;
}
.dot-anim span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: dotBounce 1.2s ease-in-out infinite;
}
.dot-anim span:nth-child(1) { animation-delay: 0s; }
.dot-anim span:nth-child(2) { animation-delay: 0.15s; }
.dot-anim span:nth-child(3) { animation-delay: 0.3s; }

@keyframes dotBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* ─── Inline Order Input Card ─────────────────────── */
.oi-card {
  background: var(--bg-card);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius);
  padding: 18px 20px;
  animation: cardSlide 0.4s cubic-bezier(0.16,1,0.3,1) both;
  position: relative;
  overflow: hidden;
}

/* Gradient border effect */
.oi-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--ac), rgba(0,128,96,0.3));
}

@keyframes cardSlide {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.oi-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
}

/* Pin icon */
.oi-pin-icon {
  vertical-align: -3px;
  margin-right: 8px;
  color: var(--ac);
}

.oi-row { display: flex; gap: 8px; }
.oi-input {
  flex: 1;
  border: 1.5px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 46px;
}
.oi-input:focus {
  border-color: var(--ac);
  box-shadow: 0 0 0 3px var(--ac-glow), inset 0 1px 2px rgba(0,0,0,0.05);
  background: var(--bg-card);
}

.oi-input::placeholder { color: var(--text-tertiary); font-weight: 500; }
.oi-btn {
  background: var(--ac);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0 20px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1);
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,128,96,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
  min-height: 46px;
  display: flex;
  align-items: center;
  gap: 4px;
  letter-spacing: -0.01em;
}
.oi-arrow {
  font-size: 14px;
  transition: transform 0.15s ease;
}
.oi-btn:hover .oi-arrow {
  transform: translateX(2px);
}
.oi-btn:hover { opacity: 0.92; box-shadow: 0 4px 12px rgba(0,128,96,0.35), inset 0 1px 0 rgba(255,255,255,0.2); transform: scale(1.02); }
.oi-btn:active { transform: scale(0.96); box-shadow: 0 1px 4px rgba(0,128,96,0.2); }
.oi-hint { font-size: 12px; color: var(--text-secondary); margin-top: 10px; font-weight: 500; }
.oi-example { font-size: 11px; color: var(--text-tertiary); margin-top: 6px; font-style: italic; }

/* ─── Not Found Card (v9 - More Elegant) ─────────────────────── */
.nf-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 24px 20px;
  text-align: center;
  animation: cardSlide 0.4s cubic-bezier(0.16,1,0.3,1) both;
}
.nf-icon {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: rgba(0,128,96,0.08);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  color: var(--ac);
}
.nf-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
  letter-spacing: -0.01em;
}
.nf-tips {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  text-align: left;
}
.nf-tips li {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
}
.nf-tips li::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: var(--ac);
}
.nf-retry {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.nf-input {
  flex: 1;
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  background: var(--bg-input);
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.nf-input:focus {
  border-color: var(--ac);
  box-shadow: 0 0 0 3px var(--ac-glow);
}
.nf-input::placeholder { color: var(--text-tertiary); }
.nf-btn {
  background: var(--ac);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
  box-shadow: 0 2px 6px rgba(0,128,96,0.2);
}
.nf-btn:hover { opacity: 0.9; transform: scale(1.02); }
.nf-btn:active { transform: scale(0.98); }

/* ─── Order Card (v9 - Enhanced) ─────────────────────────────── */
.oc {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--ac);
  border-radius: var(--radius);
  padding: 18px 20px;
  margin-bottom: 8px;
  box-shadow: var(--shadow), 0 0 0 1px rgba(0,128,96,0.04);
}
.oc-h {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 16px;
}
.oc-ord { display: flex; align-items: center; gap: 8px; }
.oc-num { font-weight: 800; font-size: 18px; color: var(--text-primary); letter-spacing: -0.02em; }
.oc-status {
  font-size: 12px;
  font-weight: 700;
  padding: 8px 14px;
  border-radius: 20px;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.oc-status-pulse {
  animation: statusPulse 2s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  50% { box-shadow: 0 1px 6px rgba(0,0,0,0.12), 0 0 0 3px rgba(0,128,96,0.1); }
}

.oc-items { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.oc-item {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-msg);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 8px;
}
.oc-item-img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.oc-item-placeholder {
  width: 32px; height: 32px;
  border-radius: 6px;
  background: var(--bg-msg);
  border: 1px solid var(--border-light);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

/* Horizontal Progress Bar - v9 */
.oc-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding: 14px 16px;
  background: var(--bg-msg);
  border-radius: var(--radius-sm);
}
.op-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  flex: 1;
  min-width: 0;
}
.op-icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex; align-items: center; justify-content: center;
  color: #9ca3af;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  flex-shrink: 0;
}
.op-stage.done .op-icon { background: var(--ac); color: #fff; box-shadow: 0 0 0 3px rgba(0,128,96,0.15); }
.op-stage.active .op-icon { background: var(--ac); color: #fff; box-shadow: 0 0 0 4px rgba(0,128,96,0.2); animation: opPulse 2s ease-in-out infinite; }
@keyframes opPulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(0,128,96,0.2); }
  50% { box-shadow: 0 0 0 8px rgba(0,128,96,0.1); }
}
.op-label { font-size: 11px; font-weight: 600; color: var(--text-tertiary); letter-spacing: 0.01em; text-align: center; }
.op-stage.done .op-label { color: var(--text-secondary); }
.op-stage.active .op-label { color: var(--ac); font-weight: 700; }
.op-date { font-size: 10px; color: var(--text-tertiary); text-align: center; margin-top: 2px; }
.op-line { position: absolute; top: 14px; left: 50%; width: calc(100% + 8px); height: 2px; background: #e5e7eb; z-index: 0; }
.op-line.done { background: linear-gradient(90deg, var(--ac), rgba(0,128,96,0.4)); }
.tl-step {
  display: flex;
  align-items: stretch;
  gap: 12px;
  min-height: 38px;
}
.tl-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 18px;
  flex-shrink: 0;
}
.tl-dot {
  width: 13px; height: 13px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2.5px solid #e5e7eb;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 0 3px rgba(209,213,219,0.1);
}
.tl-step.done .tl-dot { background: var(--ac); border-color: var(--ac); box-shadow: 0 0 0 3px rgba(0,128,96,0.12); }
.tl-step.active .tl-dot {
  background: var(--ac); border-color: var(--ac);
  box-shadow: 0 0 0 5px rgba(0,128,96,0.12);
  animation: tlPulse 2s ease-in-out infinite;
}

@keyframes tlPulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(0,128,96,0.12); }
  50% { box-shadow: 0 0 0 8px rgba(0,128,96,0.06); }
}
.tl-line { width: 2px; flex: 1; min-height: 10px; background: #e5e7eb; transition: background 0.35s; border-radius: 1px; }
.tl-line.done { background: linear-gradient(180deg, var(--ac), rgba(0,128,96,0.6)); }
.tl-info { flex: 1; padding-bottom: 6px; }
.tl-label { font-size: 13px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; }
.tl-step.done .tl-label { color: var(--text-secondary); font-weight: 500; }
.tl-step.active .tl-label { color: var(--ac-dark); }
.tl-date { font-size: 11px; color: var(--text-tertiary); margin-top: 3px; }

/* Tracking - v9 with hover effect */
.oc-track {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 6px;
  border-top: 1px solid var(--border-light);
}
.oc-carrier { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.oc-track-btn {
  color: #fff; text-decoration: none; font-weight: 700; font-size: 13px;
  padding: 9px 16px; border-radius: var(--radius-sm); background: var(--ac);
  transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
  display: inline-flex; align-items: center; gap: 6px;
  box-shadow: 0 2px 8px rgba(0,128,96,0.2);
}
.oc-track-btn:hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,128,96,0.3); }
.oc-track-btn:active { transform: scale(0.97); }
.oc-track-btn svg { transition: transform 0.15s ease; }
.oc-track-btn:hover svg { transform: translateX(2px); }

/* Delivery Countdown - v9 with better formatting */
.oc-countdown {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-light);
  font-weight: 500;
}
.oc-countdown b { color: var(--text-primary); font-weight: 800; font-size: 16px; }

/* ─── Feedback ────────────────────────────────────── */
.fb { display: flex; gap: 2px; margin-top: 8px; transition: opacity 0.4s; }
.fb button {
  background: none; border: none; cursor: pointer; padding: 4px 6px;
  font-size: 15px; color: var(--text-tertiary); border-radius: 8px;
  transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); outline: none; opacity: 0.4;
}
.mc:hover > .fb button { opacity: 0.65; }
.fb button:hover { opacity: 1 !important; background: var(--border-light); transform: scale(1.2); }
.fb-up.fb-selected, .fb-down.fb-selected { opacity: 1 !important; color: var(--ac); }
.fb.fb-done button { pointer-events: none; opacity: 0.4; }
.fb.fb-done .fb-selected { opacity: 1 !important; }
.fb.fb-fade { opacity: 0; }
.fb-thanks {
  font-size: 12px; color: var(--ac); font-weight: 700;
  margin-left: 6px; animation: thanksIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes thanksIn {
  from { opacity: 0; transform: translateY(6px) scale(0.8); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Thumbs up celebration */
.fb-up.celebrating {
  animation: celebrate 0.5s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes celebrate {
  0% { transform: scale(1); }
  30% { transform: scale(1.4) rotate(-10deg); }
  60% { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* ─── Quick Replies (v9 - Larger, More Prominent) ──────────────── */
.wq {
  padding: 0 18px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background: var(--bg-msg);
  flex-shrink: 0;
}
.qb {
  background: var(--bg-card);
  border: 1.5px solid var(--ac);
  color: var(--ac);
  padding: 11px 20px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
  font-family: inherit;
  outline: none;
  animation: qrIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
@keyframes qrIn {
  from { opacity: 0; transform: translateY(8px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.qb:hover {
  background: var(--ac);
  color: #fff;
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 4px 12px rgba(0,128,96,0.3), 0 8px 20px rgba(0,0,0,0.08);
  border-color: var(--ac);
}
.qb:active { transform: scale(0.96); }

/* ─── Input ────────────────────────────────────── */
.wi {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 10px;
  background: #fff;
  flex-shrink: 0;
  align-items: center;
}

/* Footer - v9 Ultra Minimal */
.wft {
  padding: 8px 16px calc(8px + env(safe-area-inset-bottom, 0px));
  text-align: center;
  font-size: 11px;
  color: #aaa;
  background: #fafafa;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.wft::before { content: "·"; font-size: 14px; }
.w.dark .wft { background: #0f0f11; color: #555; }
.wft a { color: var(--ac); text-decoration: none; font-weight: 600; transition: color 0.15s; }
.wft a:hover { color: #006b4d; text-decoration: underline; }

.win {
  flex: 1;
  border: 1.5px solid var(--border-color);
  border-radius: 24px;
  padding: 11px 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  font-family: inherit;
  background: var(--bg-input);
  color: var(--text-primary);
  min-height: 46px;
}
.win:focus {
  border-color: var(--ac);
  box-shadow: 0 0 0 3px var(--ac-glow), inset 0 1px 2px rgba(0,0,0,0.05);
  background: var(--bg-card);
}
.win::placeholder { color: var(--text-tertiary); }
.wsn {
  width: 46px; height: 46px;
  border-radius: 50%;
  background: var(--border-color);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
  flex-shrink: 0;
  outline: none;
}
.wsn-active { background: var(--ac) !important; cursor: pointer; box-shadow: 0 0 0 3px rgba(0,128,96,0.15); }
.wsn-active:hover { opacity: 0.92; transform: scale(1.04); box-shadow: 0 0 0 4px rgba(0,128,96,0.2); }
.wsn-active:active { transform: scale(0.9); }

/* ─── Mobile ────────────────────────────────────── */
@media (max-width: 480px) {
  .ww { width: 100vw; height: 100vh; height: 100dvh; border-radius: 0; bottom: 0; right: 0; }
  .w { bottom: 16px; right: 16px; }
  .w.left { left: 16px; }
  .wh { 
    padding: 14px 16px; 
    padding-top: calc(14px + env(safe-area-inset-top, 0px)); 
  }
  .wi { 
    padding: 10px 14px; 
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); 
  }
  
  /* Mobile bubble: smaller but larger touch target */
  .wb { 
    width: 54px; 
    height: 54px; 
    padding: 12px; 
    box-sizing: border-box;
  }
  .wb svg { width: 24px; height: 24px; }
  
  /* Mobile tooltip adjustments */
  .wb-tooltip {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  /* Mobile greeting card: full width */
  .oi-card { 
    padding: 14px 16px; 
    border-radius: 0;
    margin: 0 -18px;
    border-left: none;
    border-right: none;
  }
  
  .oi-btn { padding: 0 16px; }
  .mc { max-width: calc(100% - 52px); }
  .mm { max-width: 95%; }
  .wm { padding: 12px 14px; }
  .wq { padding: 0 14px 10px; }
  .oc { padding: 14px 16px; }
  
  /* Mobile: prevent bounce scroll on iOS */
  .wm { -webkit-overflow-scrolling: auto; overscroll-behavior: contain; }
  
  /* Mobile quick replies: slightly larger touch targets */
  .qb { padding: 11px 18px; font-size: 14px; }
  
  /* Mobile not found card: full width */
  .nf-card {
    border-radius: 0;
    margin: 0 -18px;
    border-left: none;
    border-right: none;
  }
  
  /* Mobile: loading message adjustments */
  .loading-dots { font-size: 13px; }
}
';
} // end __wismo_loaded guard
