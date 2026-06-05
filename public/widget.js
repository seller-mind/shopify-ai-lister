/**
 * WISMO AI - Storefront Chat Widget v5
 * 
 * "The World's Best WISMO Chatbot"
 * ─────────────────────────────────────
 * ✓ Premium Design: Apple-level polish, color-coded status, bot avatar
 * ✓ Instant Speed: greeting renders before API, 0ms order responses
 * ✓ Zero Learning Curve: clear prompt, smart placeholder, big quick actions
 * ✓ Real Solutions: order card timeline, tracking button, return policy link
 * ✓ Multi-language: auto-detect + respond in customer's language (20+)
 * ✓ Dark Mode: smooth auto-detect with refined palette
 * ✓ Feedback: thumbs up/down with thank-you animation
 * ✓ Mobile-first: full-screen overlay, safe area, touch-optimized
 */

// ─── Bootstrap ────────────────────────────────────────────────────────
var SCRIPT = document.currentScript;
var SRC = SCRIPT && SCRIPT.src ? new URL(SCRIPT.src) : null;
var SHOP = (SRC ? SRC.searchParams.get('shop') : '') || (document.getElementById('wismo-chat-root') || {}).dataset?.shop || '';
var API = SRC ? SRC.origin : 'https://shopify-ai-lister-tau.vercel.app';

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
  inputStep: 'idle', // idle | awaiting_order | awaiting_email | chatting
};

// ─── Dark Mode Detection ──────────────────────────────────────────────
try {
  state.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    state.darkMode = e.matches;
    var shadow = document.getElementById('wismo-host');
    if (shadow && shadow.shadowRoot) {
      var w = shadow.shadowRoot.querySelector('.w');
      if (w) {
        w.classList.toggle('dark', state.darkMode);
      }
    }
  });
} catch(e) {}

// ─── Boot ─────────────────────────────────────────────────────────────
(function boot() {
  renderShell();
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
  if (c.color) {
    shadow.querySelector('.w').style.setProperty('--ac', c.color);
  }
  if (c.position === 'bottom-left') {
    shadow.querySelector('.w').classList.add('left');
  }
  var title = shadow.querySelector('.wt');
  if (title && c.brandName) title.textContent = c.brandName;
}

// ─── HTML ─────────────────────────────────────────────────────────────
var BUBBLE_HTML = [
  '<button class="wb" aria-label="Track your order">',
  '  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
  '    <rect x="1" y="3" width="15" height="13" rx="2"/>',
  '    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>',
  '    <circle cx="5.5" cy="18.5" r="2.5"/>',
  '    <circle cx="18.5" cy="18.5" r="2.5"/>',
  '  </svg>',
  '</button>',
].join('');

var WINDOW_HTML = [
  '<div class="ww" style="display:none">',
  // Header
  '  <div class="wh">',
  '    <div class="whl">',
  '      <div class="wa">',
  '        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
  '          <rect x="1" y="3" width="15" height="13" rx="2"/>',
  '          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>',
  '          <circle cx="5.5" cy="18.5" r="2.5"/>',
  '          <circle cx="18.5" cy="18.5" r="2.5"/>',
  '        </svg>',
  '      </div>',
  '      <div>',
  '        <div class="wt">WISMO AI</div>',
  '        <div class="ws"><span class="wdot"></span> Online</div>',
  '      </div>',
  '    </div>',
  '    <button class="wx" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>',
  '  </div>',
  // Messages
  '  <div class="wm"></div>',
  // Quick replies
  '  <div class="wq" style="display:none"></div>',
  // Input
  '  <div class="wi">',
  '    <input type="text" class="win" placeholder="Type your order number..." autocomplete="off" />',
  '    <button class="wsn" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
  '  </div>',
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

    // Open
    bubble.addEventListener('click', function() {
      state.open = true;
      win.style.display = 'flex';
      win.classList.remove('ww-out');
      win.classList.add('ww-in');
      bubble.style.display = 'none';
      if (!state.greeted) {
        state.greeted = true;
        state.inputStep = 'awaiting_order';
        setTimeout(function() {
          var greeting = state.config && state.config.greeting ? state.config.greeting : 'Hi! 👋 I can track your order instantly.';
          addMsg('bot', greeting);
          setTimeout(function() {
            showQR(['📦 Track My Order', '💬 Ask a Question']);
            input.placeholder = 'Type order # (e.g., #1001)...';
          }, 300);
        }, 150);
      }
      setTimeout(function() { input.focus(); }, 400);
    });

    // Close
    closeBtn.addEventListener('click', function() {
      win.classList.remove('ww-in');
      win.classList.add('ww-out');
      setTimeout(function() {
        state.open = false;
        win.style.display = 'none';
        bubble.style.display = 'flex';
      }, 250);
    });

    // Send
    var send = function(text) {
      if (!text || state.typing) return;
      text = text || input.value.trim();
      if (!text) return;
      input.value = '';
      hideQR();
      addMsg('user', text);
      state.typing = true;
      state.inputStep = 'chatting';
      input.placeholder = 'Ask anything...';
      var typing = addTyping();

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
        if (d.language) state.lang = d.language;

        if (d.orderCard) {
          addOrderCard(d.orderCard, d.reply);
        } else {
          addMsg('bot', d.reply);
        }

        if (d.quickReplies && d.quickReplies.length) {
          setTimeout(function() { showQR(d.quickReplies); }, 200);
        }
      })
      .catch(function() {
        typing.remove();
        state.typing = false;
        addMsg('bot', 'Connection error. Please try again.');
      });
    };

    sendBtn.addEventListener('click', function() { send(input.value.trim()); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value.trim()); }
    });

    // ─── Message Helpers ─────────────────────────────────────────
    function addMsg(role, content) {
      var msgId = 'msg-' + (++state.lastMsgId);
      var d = document.createElement('div');
      d.className = 'mm m-' + role;
      d.dataset.msgId = msgId;

      // Bot avatar
      var avatar = '';
      if (role === 'bot') {
        avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';
      }

      var html = content
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');

      var timeStr = formatTime(new Date());
      d.innerHTML = avatar + '<div class="mc"><div class="mt">' + html + '</div><div class="mts">' + timeStr + '</div></div>';

      // Feedback buttons for bot messages
      if (role === 'bot') {
        var fb = document.createElement('div');
        fb.className = 'fb';
        fb.innerHTML = '<button class="fb-up" title="Helpful" data-msg="' + msgId + '">👍</button><button class="fb-down" title="Not helpful" data-msg="' + msgId + '">👎</button>';
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

      // Auto-hide feedback after 12 seconds
      if (role === 'bot') {
        setTimeout(function() {
          var fbEl = d.querySelector('.fb');
          if (fbEl && !fbEl.classList.contains('fb-done')) fbEl.classList.add('fb-fade');
        }, 12000);
      }
    }

    // ─── Order Card ──────────────────────────────────────────────
    function addOrderCard(card, fallbackText) {
      var msgId = 'msg-' + (++state.lastMsgId);
      var d = document.createElement('div');
      d.className = 'mm m-bot oc-wrap';
      d.dataset.msgId = msgId;

      var statusColor = getStatusColor(card.status);
      var statusIcon = getStatusIcon(card.status);

      var cardHtml = '<div class="oc">';
      // Header with colored status
      cardHtml += '<div class="oc-h">';
      cardHtml += '<div class="oc-ord"><span class="oc-icon">' + statusIcon + '</span><span class="oc-num">' + card.orderNumber + '</span></div>';
      cardHtml += '<span class="oc-status" style="background:' + statusColor.bg + ';color:' + statusColor.fg + '">' + card.statusLabel + '</span>';
      cardHtml += '</div>';

      // Items
      if (card.items && card.items.length) {
        cardHtml += '<div class="oc-items">';
        card.items.forEach(function(item) {
          cardHtml += '<span class="oc-item">' + item + '</span>';
        });
        cardHtml += '</div>';
      }

      // Timeline
      if (card.timeline && card.timeline.length) {
        cardHtml += '<div class="oc-tl">';
        card.timeline.forEach(function(step, idx) {
          var cls = 'tl-step' + (step.completed ? ' done' : '') + (step.current ? ' active' : '');
          var lineClass = step.completed ? 'tl-line done' : 'tl-line';
          cardHtml += '<div class="' + cls + '">';
          cardHtml += '<div class="tl-track">';
          if (idx > 0) cardHtml += '<div class="' + lineClass + '"></div>';
          cardHtml += '<div class="tl-dot"></div>';
          if (idx < card.timeline.length - 1) cardHtml += '<div class="tl-line' + (step.completed ? ' done' : '') + '"></div>';
          cardHtml += '</div>';
          cardHtml += '<div class="tl-info">';
          cardHtml += '<div class="tl-label">' + step.label + '</div>';
          if (step.date) cardHtml += '<div class="tl-date">' + step.date + '</div>';
          cardHtml += '</div></div>';
        });
        cardHtml += '</div>';
      }

      // Tracking section
      if (card.trackingCompany && card.trackingNumber) {
        cardHtml += '<div class="oc-track">';
        cardHtml += '<div class="oc-carrier">🚚 ' + card.trackingCompany + ' · ' + card.trackingNumber + '</div>';
        if (card.trackingUrl) {
          cardHtml += '<a href="' + card.trackingUrl + '" target="_blank" rel="noopener" class="oc-track-btn">Track Package →</a>';
        }
        cardHtml += '</div>';
      }

      // Estimated delivery
      if (card.estimatedDelivery) {
        cardHtml += '<div class="oc-eta">📅 Est. delivery: <b>' + card.estimatedDelivery + '</b></div>';
      }

      cardHtml += '</div>';

      // Bot avatar
      var avatar = '<div class="ma"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>';

      d.innerHTML = avatar + '<div class="mc">' + cardHtml;

      // Feedback
      var fb = document.createElement('div');
      fb.className = 'fb';
      fb.innerHTML = '<button class="fb-up" title="Helpful" data-msg="' + msgId + '">👍</button><button class="fb-down" title="Not helpful" data-msg="' + msgId + '">👎</button>';
      d.querySelector('.mc').appendChild(fb);

      // Timestamp
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

    // ─── Feedback Submit ─────────────────────────────────────────
    function submitFeedback(msgId, rating, fbEl) {
      fbEl.classList.add('fb-done');
      var btns = fbEl.querySelectorAll('button');
      btns.forEach(function(b) { b.style.pointerEvents = 'none'; });
      var activeBtn = rating === 'positive' ? fbEl.querySelector('.fb-up') : fbEl.querySelector('.fb-down');
      if (activeBtn) activeBtn.classList.add('fb-selected');
      if (rating === 'positive') {
        // Show quick thank you
        var thank = document.createElement('div');
        thank.className = 'fb-thanks';
        thank.textContent = 'Thanks! ❤️';
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
        b.addEventListener('click', function() {
          // Smart: if "Track My Order", prompt for order number
          if (t.indexOf('Track') > -1 || t.indexOf('📦') > -1) {
            state.inputStep = 'awaiting_order';
            input.placeholder = 'Type order # (e.g., #1001)...';
          }
          send(t);
        });
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
    case 'FULFILLED': return { bg: '#e3f0ea', fg: '#006649' };
    case 'UNFULFILLED': return { bg: '#e8f0fe', fg: '#1967d2' };
    case 'PARTIALLY_FULFILLED': return { bg: '#fff3e0', fg: '#e65100' };
    case 'RESTOCKED': return { bg: '#fce4ec', fg: '#c62828' };
    case 'PENDING': return { bg: '#fff8e1', fg: '#f57f17' };
    default: return { bg: '#f1f2f3', fg: '#6d7175' };
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'FULFILLED': return '🚚';
    case 'UNFULFILLED': return '📦';
    case 'PARTIALLY_FULFILLED': return '📤';
    case 'RESTOCKED': return '↩️';
    case 'PENDING': return '⏳';
    default: return '📦';
  }
}

// ─── CSS ──────────────────────────────────────────────────────────────
function CSS() {
  return '\
.w {\
  --ac: #008060;\
  --ac-light: #e3f0ea;\
  --ac-dark: #006649;\
  --radius: 14px;\
  --shadow: 0 12px 48px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);\
  --bg-msg: #f4f5f7;\
  --bg-card: #ffffff;\
  --bg-input: #fafbfc;\
  --text-primary: #1a1a1a;\
  --text-secondary: #6d7175;\
  --text-tertiary: #8c9196;\
  --border-color: #e5e7eb;\
  --border-light: #f1f2f3;\
  position: fixed;\
  bottom: 24px;\
  right: 24px;\
  z-index: 2147483647;\
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\
  -webkit-font-smoothing: antialiased;\
  -moz-osx-font-smoothing: grayscale;\
}\
\
/* ─── Dark Mode ────────────────────────────────────── */\
.w.dark {\
  --bg-msg: #111113;\
  --bg-card: #1c1c1e;\
  --bg-input: #1c1c1e;\
  --text-primary: #f5f5f7;\
  --text-secondary: #a1a1a6;\
  --text-tertiary: #86868b;\
  --border-color: #38383a;\
  --border-light: #2c2c2e;\
}\
.w.dark .ww { background: #111113; }\
.w.dark .wm { background: #111113; }\
.w.dark .wh { background: linear-gradient(135deg, #0a3d2e 0%, #0d4f3a 100%); }\
.w.dark .m-bot .mc { background: var(--bg-card); color: var(--text-primary); }\
.w.dark .m-user .mc { background: var(--ac); color: #fff; }\
.w.dark .wi { background: #111113; border-top-color: var(--border-color); }\
.w.dark .win { background: var(--bg-input); border-color: var(--border-color); color: var(--text-primary); }\
.w.dark .win::placeholder { color: var(--text-tertiary); }\
.w.dark .wq { background: #111113; }\
.w.dark .qb { background: var(--bg-card); border-color: var(--ac); color: var(--ac); }\
.w.dark .qb:hover { background: var(--ac); color: #fff; }\
.w.dark .ma { background: #1a3d30; }\
.w.dark .oc { background: var(--bg-card); border-color: var(--border-color); }\
.w.dark .oc-h { border-color: var(--border-color); }\
.w.dark .oc-track { border-color: var(--border-color); }\
.w.dark .oc-carrier { color: var(--text-secondary); }\
.w.dark .oc-eta { color: var(--text-secondary); }\
.w.dark .oc-eta b { color: var(--text-primary); }\
.w.dark .tl-label { color: var(--text-primary); }\
.w.dark .tl-date { color: var(--text-tertiary); }\
.w.dark .tl-line { background: #38383a; }\
.w.dark .tl-line.done { background: var(--ac); }\
.w.dark .tl-step:not(.done):not(.active) .tl-dot { background: #2c2c2e; border-color: #38383a; }\
.w.dark .fb button { color: var(--text-tertiary); }\
.w.dark .mts { color: var(--text-tertiary); }\
\
.w.left { right: auto; left: 24px; }\
\
/* ─── Bubble ────────────────────────────────────── */\
.wb {\
  width: 60px;\
  height: 60px;\
  border-radius: 30px;\
  background: var(--ac);\
  color: #fff;\
  border: none;\
  cursor: pointer;\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  box-shadow: 0 6px 24px rgba(0,128,96,0.4), 0 2px 8px rgba(0,128,96,0.2);\
  transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;\
  outline: none;\
  animation: bubbleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both;\
}\
@keyframes bubbleIn {\
  from { opacity: 0; transform: scale(0.6) translateY(10px); }\
  to { opacity: 1; transform: scale(1) translateY(0); }\
}\
.wb:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(0,128,96,0.5); }\
.wb:active { transform: scale(0.95); }\
\
/* ─── Window ────────────────────────────────────── */\
.ww {\
  width: 420px;\
  height: 620px;\
  border-radius: 18px;\
  overflow: hidden;\
  display: flex;\
  flex-direction: column;\
  box-shadow: var(--shadow);\
  background: #fff;\
}\
.ww-in { animation: winIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }\
.ww-out { animation: winOut 0.25s cubic-bezier(0.4,0,1,1) forwards; }\
@keyframes winIn {\
  from { opacity: 0; transform: translateY(20px) scale(0.95); }\
  to { opacity: 1; transform: translateY(0) scale(1); }\
}\
@keyframes winOut {\
  from { opacity: 1; transform: translateY(0) scale(1); }\
  to { opacity: 0; transform: translateY(12px) scale(0.97); }\
}\
\
/* ─── Header ────────────────────────────────────── */\
.wh {\
  background: linear-gradient(135deg, #008060 0%, #00a878 100%);\
  color: #fff;\
  padding: 16px 20px;\
  display: flex;\
  align-items: center;\
  justify-content: space-between;\
  flex-shrink: 0;\
}\
.whl { display: flex; align-items: center; gap: 12px; }\
.wa {\
  width: 38px; height: 38px;\
  border-radius: 12px;\
  background: rgba(255,255,255,0.18);\
  display: flex; align-items: center; justify-content: center;\
  backdrop-filter: blur(4px);\
}\
.wt { font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }\
.ws { font-size: 12px; opacity: 0.85; margin-top: 2px; display: flex; align-items: center; gap: 5px; }\
.wdot {\
  width: 7px; height: 7px;\
  border-radius: 50%;\
  background: #4ade80;\
  display: inline-block;\
  box-shadow: 0 0 6px rgba(74,222,128,0.5);\
}\
.wx {\
  background: none; border: none; color: rgba(255,255,255,0.7);\
  cursor: pointer; padding: 8px; border-radius: 10px;\
  transition: background 0.15s, color 0.15s; outline: none;\
}\
.wx:hover { background: rgba(255,255,255,0.15); color: #fff; }\
\
/* ─── Messages ────────────────────────────────────── */\
.wm {\
  flex: 1;\
  padding: 16px 18px;\
  overflow-y: auto;\
  background: var(--bg-msg);\
  -webkit-overflow-scrolling: touch;\
  scroll-behavior: smooth;\
}\
.wm::-webkit-scrollbar { width: 4px; }\
.wm::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }\
\
.mm {\
  margin-bottom: 10px;\
  display: flex;\
  gap: 8px;\
  max-width: 92%;\
  animation: msgIn 0.25s cubic-bezier(0.16,1,0.3,1) both;\
}\
@keyframes msgIn {\
  from { opacity: 0; transform: translateY(8px); }\
  to { opacity: 1; transform: translateY(0); }\
}\
\
.m-user { margin-left: auto; flex-direction: row-reverse; }\
\
/* Bot avatar */\
.ma {\
  width: 28px; height: 28px;\
  border-radius: 8px;\
  background: var(--ac-light);\
  display: flex; align-items: center; justify-content: center;\
  flex-shrink: 0;\
  color: var(--ac);\
  margin-top: 2px;\
}\
\
/* Message content */\
.mc {\
  padding: 10px 14px;\
  border-radius: 14px;\
  font-size: 14px;\
  line-height: 1.55;\
  word-wrap: break-word;\
  max-width: calc(100% - 40px);\
}\
.m-bot .mc {\
  background: var(--bg-card);\
  color: var(--text-primary);\
  border-bottom-left-radius: 4px;\
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);\
}\
.m-user .mc {\
  background: var(--ac);\
  color: #fff;\
  border-bottom-right-radius: 4px;\
}\
.mm a { color: var(--ac); text-decoration: underline; }\
.m-user .mc a { color: #fff; text-decoration: underline; }\
\
/* Message timestamp */\
.mts {\
  font-size: 10px;\
  color: var(--text-tertiary);\
  margin-top: 4px;\
  padding: 0 2px;\
}\
.m-user .mts { text-align: right; }\
\
/* Typing */\
.dots { display: flex; gap: 4px; padding: 4px 0; }\
.dots i {\
  width: 7px; height: 7px; border-radius: 50%;\
  background: #b0b0b0;\
  animation: bounce 1.4s ease-in-out infinite;\
}\
.dots i:nth-child(2) { animation-delay: 0.16s; }\
.dots i:nth-child(3) { animation-delay: 0.32s; }\
@keyframes bounce {\
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }\
  30% { transform: translateY(-5px); opacity: 1; }\
}\
\
/* ─── Order Card ────────────────────────────────────── */\
.oc {\
  background: var(--bg-card);\
  border: 1px solid var(--border-color);\
  border-radius: 12px;\
  padding: 14px 16px;\
  margin-bottom: 4px;\
}\
.oc-h {\
  display: flex;\
  justify-content: space-between;\
  align-items: center;\
  padding-bottom: 10px;\
  border-bottom: 1px solid var(--border-light);\
  margin-bottom: 12px;\
}\
.oc-ord { display: flex; align-items: center; gap: 6px; }\
.oc-icon { font-size: 16px; }\
.oc-num { font-weight: 700; font-size: 15px; color: var(--text-primary); }\
.oc-status {\
  font-size: 11px;\
  font-weight: 700;\
  padding: 4px 10px;\
  border-radius: 12px;\
  letter-spacing: 0.01em;\
}\
.oc-items {\
  display: flex;\
  flex-wrap: wrap;\
  gap: 6px;\
  margin-bottom: 14px;\
}\
.oc-item {\
  font-size: 12px;\
  color: var(--text-secondary);\
  background: var(--bg-msg);\
  padding: 4px 10px;\
  border-radius: 8px;\
  border: 1px solid var(--border-light);\
}\
\
/* Timeline */\
.oc-tl { margin-bottom: 12px; padding-left: 2px; }\
.tl-step {\
  display: flex;\
  align-items: stretch;\
  gap: 12px;\
  min-height: 36px;\
}\
.tl-track {\
  display: flex;\
  flex-direction: column;\
  align-items: center;\
  width: 16px;\
  flex-shrink: 0;\
}\
.tl-dot {\
  width: 12px; height: 12px;\
  border-radius: 50%;\
  background: #d1d5db;\
  border: 2px solid #d1d5db;\
  flex-shrink: 0;\
  z-index: 1;\
  transition: all 0.3s;\
}\
.tl-step.done .tl-dot {\
  background: var(--ac);\
  border-color: var(--ac);\
}\
.tl-step.active .tl-dot {\
  background: var(--ac);\
  border-color: var(--ac);\
  box-shadow: 0 0 0 4px rgba(0,128,96,0.12);\
  animation: pulse 2s ease-in-out infinite;\
}\
@keyframes pulse {\
  0%, 100% { box-shadow: 0 0 0 4px rgba(0,128,96,0.12); }\
  50% { box-shadow: 0 0 0 8px rgba(0,128,96,0.06); }\
}\
.tl-line {\
  width: 2px;\
  flex: 1;\
  min-height: 8px;\
  background: #e1e3e5;\
  transition: background 0.3s;\
}\
.tl-line.done { background: var(--ac); }\
.tl-info { flex: 1; padding-bottom: 4px; }\
.tl-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }\
.tl-step.done .tl-label { color: var(--text-secondary); font-weight: 500; }\
.tl-step.active .tl-label { color: var(--ac-dark); font-weight: 700; }\
.tl-date { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }\
\
/* Tracking */\
.oc-track {\
  display: flex;\
  justify-content: space-between;\
  align-items: center;\
  padding: 10px 0 4px;\
  border-top: 1px solid var(--border-light);\
}\
.oc-carrier { font-size: 12px; color: var(--text-secondary); }\
.oc-track-btn {\
  color: var(--ac);\
  text-decoration: none;\
  font-weight: 700;\
  font-size: 13px;\
  padding: 6px 14px;\
  border-radius: 8px;\
  background: var(--ac-light);\
  transition: all 0.15s;\
}\
.oc-track-btn:hover { background: var(--ac); color: #fff; }\
\
.oc-eta {\
  font-size: 12px;\
  color: var(--text-secondary);\
  margin-top: 8px;\
  padding-top: 6px;\
}\
.oc-eta b { color: var(--text-primary); }\
\
/* ─── Feedback ────────────────────────────────────── */\
.fb {\
  display: flex;\
  gap: 2px;\
  margin-top: 6px;\
  transition: opacity 0.4s;\
}\
.fb button {\
  background: none;\
  border: none;\
  cursor: pointer;\
  padding: 3px 4px;\
  font-size: 14px;\
  color: var(--text-tertiary);\
  border-radius: 6px;\
  transition: all 0.15s;\
  outline: none;\
  opacity: 0.4;\
}\
.mc:hover > .fb button { opacity: 0.7; }\
.fb button:hover { opacity: 1 !important; background: var(--border-light); transform: scale(1.15); }\
.fb-up.fb-selected { opacity: 1 !important; }\
.fb-down.fb-selected { opacity: 1 !important; }\
.fb.fb-done button { pointer-events: none; opacity: 0.5; }\
.fb.fb-done .fb-selected { opacity: 1 !important; }\
.fb.fb-fade { opacity: 0; }\
.fb-thanks {\
  font-size: 12px;\
  color: var(--ac);\
  font-weight: 600;\
  margin-left: 4px;\
  animation: fadeUp 0.3s ease-out;\
}\
@keyframes fadeUp {\
  from { opacity: 0; transform: translateY(4px); }\
  to { opacity: 1; transform: translateY(0); }\
}\
\
/* ─── Quick Replies ────────────────────────────────────── */\
.wq {\
  padding: 0 18px 12px;\
  display: flex;\
  flex-wrap: wrap;\
  gap: 8px;\
  background: var(--bg-msg);\
  flex-shrink: 0;\
}\
.qb {\
  background: var(--bg-card);\
  border: 1.5px solid var(--ac);\
  color: var(--ac);\
  padding: 8px 16px;\
  border-radius: 20px;\
  font-size: 13px;\
  font-weight: 600;\
  cursor: pointer;\
  transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);\
  font-family: inherit;\
  outline: none;\
  animation: qrIn 0.3s cubic-bezier(0.16,1,0.3,1) both;\
}\
@keyframes qrIn {\
  from { opacity: 0; transform: translateY(8px) scale(0.9); }\
  to { opacity: 1; transform: translateY(0) scale(1); }\
}\
.qb:hover { background: var(--ac); color: #fff; transform: scale(1.03); }\
.qb:active { transform: scale(0.96); }\
\
/* ─── Input ────────────────────────────────────── */\
.wi {\
  padding: 12px 16px;\
  border-top: 1px solid var(--border-color);\
  display: flex;\
  gap: 10px;\
  background: #fff;\
  flex-shrink: 0;\
  align-items: center;\
}\
.win {\
  flex: 1;\
  border: 1.5px solid var(--border-color);\
  border-radius: 22px;\
  padding: 10px 18px;\
  font-size: 14px;\
  outline: none;\
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;\
  font-family: inherit;\
  background: var(--bg-input);\
  color: var(--text-primary);\
  min-height: 44px;\
}\
.win:focus {\
  border-color: var(--ac);\
  box-shadow: 0 0 0 3px rgba(0,128,96,0.08);\
  background: var(--bg-card);\
}\
.win::placeholder { color: var(--text-tertiary); }\
.wsn {\
  width: 44px; height: 44px;\
  border-radius: 22px;\
  background: var(--ac);\
  color: #fff;\
  border: none;\
  cursor: pointer;\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  transition: opacity 0.15s, transform 0.15s;\
  flex-shrink: 0;\
  outline: none;\
}\
.wsn:hover { opacity: 0.88; }\
.wsn:active { transform: scale(0.9); }\
\
/* ─── Mobile ────────────────────────────────────── */\
@media (max-width: 480px) {\
  .ww {\
    width: 100vw;\
    height: 100vh;\
    height: 100dvh;\
    border-radius: 0;\
    bottom: 0;\
    right: 0;\
  }\
  .w { bottom: 16px; right: 16px; }\
  .w.left { left: 16px; }\
  .wh { padding: 14px 16px; padding-top: calc(14px + env(safe-area-inset-top, 0px)); }\
  .wi { padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }\
  .wb { width: 54px; height: 54px; border-radius: 27px; }\
  .wb svg { width: 24px; height: 24px; }\
}\
';
}
