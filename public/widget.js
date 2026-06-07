/**
 * WISMO AI - Storefront Chat Widget v7 (Premium)
 * 
 * "The World's Best WISMO Chatbot" - Global Premium SaaS Polish
 * ====================================================
 * ✓ ONE-STEP Tracking: inline order input in greeting card — no extra clicks
 * ✓ Conversation Memory: persists across page loads via localStorage
 * ✓ Product Images: thumbnails in order card from Shopify
 * ✓ Premium Design: Apple-level polish, color-coded status, bot avatar
 * ✓ Instant Speed: greeting renders before API, 0ms order responses
 * ✓ Zero Learning Curve: order input is the FIRST thing you see
 * ✓ Multi-language: auto-detect + respond in customer's language (20+)
 * ✓ Dark Mode: smooth auto-detect with refined palette
 * ✓ Feedback: thumbs up/down with thank-you animation
 * ✓ Mobile-first: full-screen overlay, safe area, touch-optimized
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
  '        <div class="ws"><span class="wdot"></span> Online</div>',
  '      </div>',
  '    </div>',
  '    <button class="wx" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>',
  '  </div>',
  '  <div class="wm" role="log" aria-live="polite" aria-label="Chat messages"></div>',
  '  <div class="wq" style="display:none"></div>',
  '  <div class="wi">',
  '    <input type="text" class="win" placeholder="Order # or question..." autocomplete="off" aria-label="Type your order number or question" />',
  '    <button class="wsn" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
  '  </div>',
  '  <div class="wft">Powered by AI <span class='wft-divider'></span><a href="' + API + '/privacy" target="_blank" rel="noopener">Privacy</a></div>',
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
      var typing = addTyping();

      // Mobile: scroll to bottom after user sends
      setTimeout(function() { msgs.scrollTop = msgs.scrollHeight; }, 50);

      fetch(API + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, message: text, conversationId: state.convId }),
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        typing.remove();
        state.typing = false;
        if (d.error) { addMsg('bot', 'Something went wrong. Please try again.'); return; }
        state.convId = d.conversationId;
        saveConv();
        if (d.language) state.lang = d.language;

        // Plan limit reached — show upgrade notice
        if (d.planLimited) {
          addMsg('bot', d.reply || 'This service is temporarily unavailable. The store owner needs to upgrade their plan.');
          return;
        }

        if (d.orderCard) {
          addOrderCard(d.orderCard);
        } else {
          addMsg('bot', d.reply);
        }

        if (d.quickReplies && d.quickReplies.length) {
          setTimeout(function() { showQR(d.quickReplies); }, 150);
        }
      })
      .catch(function() {
        typing.remove();
        state.typing = false;
        addMsg('bot', 'Connection error. Please try again.');
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

      // SINGLE card: greeting text embedded in the input card — zero extra steps
      var card = document.createElement('div');
      card.className = 'mm m-bot';
      var avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      card.innerHTML = avatar + '<div class="mc"><div class="oi-card">' +
        '<div class="oi-label"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:-2px;margin-right:4px;color:var(--ac)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(greetingText) + '</div>' +
        '<div class="oi-row">' +
        '<input type="text" class="oi-input" placeholder="#1001 or email" autocomplete="off" />' +
        '<button class="oi-btn">Track</button>' +
        '</div>' +
        '<div class="oi-hint">Order number or email address</div>' +
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

      // Quick reply — simple secondary option
      setTimeout(function() {
        showQR(['Ask a question']);
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

    // ─── Order Card ──────────────────────────────────────────
    function addOrderCard(card) {
      var msgId = 'msg-' + (++state.lastMsgId);
      var d = document.createElement('div');
      d.className = 'mm m-bot';
      d.dataset.msgId = msgId;

      var statusColor = getStatusColor(card.status);
      var statusIcon = getStatusIcon(card.status);

      var cardHtml = '<div class="oc">';
      // Header
      cardHtml += '<div class="oc-h">';
      cardHtml += '<div class="oc-ord"><span class="oc-num">' + esc(card.orderNumber) + '</span></div>';
      cardHtml += '<span class="oc-status" style="background:' + statusColor.bg + ';color:' + statusColor.fg + '">' + esc(card.statusLabel) + '</span>';
      cardHtml += '</div>';

      // Items with optional images
      if (card.items && card.items.length) {
        cardHtml += '<div class="oc-items">';
        card.items.forEach(function(item, idx) {
          var img = card.itemImages && card.itemImages[idx] ? '<img src="' + escAttr(card.itemImages[idx]) + '" class="oc-item-img" />' : '';
          cardHtml += '<span class="oc-item">' + img + esc(item) + '</span>';
        });
        cardHtml += '</div>';
      }

      // Horizontal Progress Bar - v3.0
      if (card.timeline && card.timeline.length) {
        cardHtml += '<div class="oc-progress">';
        
        var stages = [
          { key: 'processing', label: 'Processing', icon: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' },
          { key: 'shipped', label: 'Shipped', icon: '<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' },
          { key: 'delivered', label: 'Delivered', icon: '<polyline points="20 6 9 17 4 12"/>' }
        ];
        
        stages.forEach(function(stage, idx) {
          var isDone = card.timeline.some(function(t) { return t.completed && (t.label.toLowerCase().includes(stage.key) || t.status === stage.key); });
          var isActive = card.timeline.some(function(t) { return t.current && (t.label.toLowerCase().includes(stage.key) || t.status === stage.key); });
          var cls = 'op-stage' + (isDone ? ' done' : '') + (isActive ? ' active' : '');
          cardHtml += '<div class="' + cls + '">';
          cardHtml += '<div class="op-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + stage.icon + '</svg></div>';
          cardHtml += '<div class="op-label">' + stage.label + '</div>';
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
          cardHtml += '<a href="' + safeHref(card.trackingUrl) + '" target="_blank" rel="noopener" class="oc-track-btn">Track Package →</a>';
        }
        cardHtml += '</div>';
      }

      // Estimated delivery
      if (card.estimatedDelivery) {
        cardHtml += '<div class="oc-eta">Est. delivery: <b>' + esc(card.estimatedDelivery) + '</b></div>';
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

    function addTyping() {
      var d = document.createElement('div');
      d.className = 'mm m-bot typing';
      var avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      d.innerHTML = avatar + '<div class="mc"><div class="dots"><i></i><i></i><i></i></div></div>';
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
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

function getStatusColor(status) {
  switch (status) {
    case 'FULFILLED': return { bg: '#dcfce7', fg: '#166534' };
    case 'UNFULFILLED': return { bg: '#dbeafe', fg: '#1e40af' };
    case 'PARTIALLY_FULFILLED': return { bg: '#ffedd5', fg: '#9a3412' };
    case 'RESTOCKED': return { bg: '#fce4ec', fg: '#c62828' };
    case 'PENDING': return { bg: '#fef9c3', fg: '#854d0e' };
    default: return { bg: '#f1f2f3', fg: '#6d7175' };
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'FULFILLED': return '';
    case 'UNFULFILLED': return '';
    case 'PARTIALLY_FULFILLED': return '';
    case 'RESTOCKED': return '';
    case 'PENDING': return '';
    default: return '';
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
.w.dark .oc-eta { color: var(--text-secondary); }
.w.dark .oc-eta b { color: var(--text-primary); }
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
.w.dark .fb button { color: var(--text-tertiary); }
.w.dark .mts { color: var(--text-tertiary); }

.w.left { right: auto; left: 24px; }

/* ─── Bubble ────────────────────────────────────── */
.wb {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--ac);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,128,96,0.15), 0 8px 24px rgba(0,128,96,0.25), 0 16px 40px rgba(0,128,96,0.15);
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
  outline: none;
  animation: bubbleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;
  position: relative;
}

@keyframes bubbleIn {
  from { opacity: 0; transform: scale(0.6) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Pulse ring animation */
.wb::before {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--ac);
  opacity: 0;
  animation: pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulseRing {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes bubbleIn {
  from { opacity: 0; transform: scale(0.6) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}



.wb:hover {
  transform: scale(1.04) !important;
  box-shadow: 0 4px 12px rgba(0,128,96,0.2), 0 12px 32px rgba(0,128,96,0.35), 0 20px 48px rgba(0,128,96,0.2);
  animation: none;
}
.wb:hover::before { display: none; }
.wb:active { transform: scale(0.96) !important; }

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

/* ─── Header ────────────────────────────────────── */
.wh {
  background: linear-gradient(135deg, #00785c 0%, #00996b 100%);
  color: #fff;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

/* Bottom gradient fade border */
.wh::after {
  content: "";
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
}

.whl { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
.wa {
  width: 40px; height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.18);
  position: relative;
}

.wa::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
}
.wt { font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }
.ws { font-size: 12px; opacity: 0.9; margin-top: 2px; display: flex; align-items: center; gap: 5px; }
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
  background: none; border: none; color: rgba(255,255,255,0.65);
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

/* Typing indicator - 3 bouncing dots with stagger */
.dots { display: flex; gap: 5px; padding: 6px 0; }
.dots i {
  width: 7px; height: 7px; border-radius: 50%;
  background: #b0b0b0;
  animation: dotBounce 1.0s ease-in-out infinite;
}
.dots i:nth-child(1) { animation-delay: 0s; }
.dots i:nth-child(2) { animation-delay: 0.15s; }
.dots i:nth-child(3) { animation-delay: 0.3s; }

@keyframes dotBounce {
  0%, 60%, 100% { transform: translateY(0) scale(0.85); opacity: 0.4; }
  30% { transform: translateY(-6px) scale(1); opacity: 1; }
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
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
}

/* Pin icon bounce animation */
.oi-pin-icon {
  vertical-align: -3px;
  margin-right: 6px;
  color: var(--ac);
  animation: pinBounce 2s ease-in-out infinite;
}

@keyframes pinBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
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
  padding: 0 24px;
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
  letter-spacing: -0.01em;
}
.oi-btn:hover { opacity: 0.92; box-shadow: 0 4px 12px rgba(0,128,96,0.35), inset 0 1px 0 rgba(255,255,255,0.2); transform: scale(1.02); }
.oi-btn:active { transform: scale(0.96); box-shadow: 0 1px 4px rgba(0,128,96,0.2); }
.oi-hint { font-size: 12px; color: var(--text-tertiary); margin-top: 10px; }

/* ─── Order Card v3 (Horizontal Progress) ─────────── */
.oc {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--ac);
  border-radius: var(--radius);
  padding: 18px 20px;
  margin-bottom: 6px;
  box-shadow: var(--shadow);
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
  padding: 6px 14px;
  border-radius: 20px;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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

/* Horizontal Progress Bar - v3.0 */
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

/* Tracking */
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
.oc-eta { font-size: 14px; color: var(--text-secondary); margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-light); }
.oc-eta b { color: var(--text-primary); font-weight: 800; font-size: 15px; }

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

/* ─── Quick Replies ────────────────────────────────── */
.wq {
  padding: 0 18px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: var(--bg-msg);
  flex-shrink: 0;
}
.qb {
  background: var(--bg-card);
  border: 1.5px solid var(--ac);
  color: var(--ac);
  padding: 9px 18px;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
  font-family: inherit;
  outline: none;
  animation: qrIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,128,96,0.04);
}
@keyframes qrIn {
  from { opacity: 0; transform: translateY(8px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.qb:hover {
  background: var(--ac);
  color: #fff;
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 4px 12px rgba(0,128,96,0.3);
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
.wft {
  padding: 6px 16px calc(6px + env(safe-area-inset-bottom, 0px));
  text-align: center;
  font-size: 10px;
  color: #999;
  background: #fafafa;
  flex-shrink: 0;
  letter-spacing: 0.01em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.wft-divider { width: 1px; height: 12px; background: #e5e7eb; }
.w.dark .wft { background: #0f0f11; color: #555; }
.w.dark .wft-divider { background: #2c2c2e; }
.wft a { color: var(--ac); text-decoration: none; font-weight: 500; }
.wft a:hover { text-decoration: underline; }
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
  .wh { padding: 14px 16px; padding-top: calc(14px + env(safe-area-inset-top, 0px)); }
  .wi { padding: 10px 14px; padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); }
  .wb { width: 54px; height: 54px; border-radius: 27px; }
  .wb svg { width: 24px; height: 24px; }
  .oi-btn { padding: 0 16px; }
  .oi-card { padding: 12px 14px; }
  .mc { max-width: calc(100% - 52px); }
  .mm { max-width: 95%; }
  .wm { padding: 12px 14px; }
  .wq { padding: 0 14px 10px; }
  .oc { padding: 14px 16px; }
  /* Mobile: prevent bounce scroll on iOS */
  .wm { -webkit-overflow-scrolling: auto; overscroll-behavior: contain; }
}
';
} // end __wismo_loaded guard
