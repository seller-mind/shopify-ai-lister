/**
 * WISMO AI - Storefront Chat Widget v3
 * 
 * "The best WISMO chatbot in the world"
 * ─────────────────────────────────────
 * ✓ Instant: greeting renders before API loads
 * ✓ Beautiful: Polaris-inspired design, SVG icons, smooth animations
 * ✓ Zero learning curve: "Track your order" is the obvious action
 * ✓ Smart: instant order responses, AI only for general queries
 * ✓ Lightweight: < 30KB, Shadow DOM isolated
 */

// ─── Bootstrap (instant, no API wait) ────────────────────────────────
var SCRIPT = document.currentScript;
var SRC = SCRIPT && SCRIPT.src ? new URL(SCRIPT.src) : null;
var SHOP = (SRC ? SRC.searchParams.get('shop') : '') || (document.getElementById('wismo-chat-root') || {}).dataset?.shop || '';
var API = SRC ? SRC.origin : 'https://shopify-ai-lister-tau.vercel.app';

// ─── State ───────────────────────────────────────────────────────────
var state = {
  config: null,
  convId: null,
  open: false,
  typing: false,
  greeted: false,
  loading: true,
};

// ─── Boot ─────────────────────────────────────────────────────────────
(function boot() {
  // Render widget shell instantly (before config loads)
  renderShell();
  // Fetch config in background
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

// ─── Shell (renders instantly) ───────────────────────────────────────
function renderShell() {
  var host = document.createElement('div');
  host.id = 'wismo-host';
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: 'open' });
  var s = document.createElement('style');
  s.textContent = CSS();
  shadow.appendChild(s);

  var el = document.createElement('div');
  el.className = 'w';
  el.innerHTML = BUBBLE_HTML + WINDOW_HTML;
  shadow.appendChild(el);
}

function removeShell() {
  var h = document.getElementById('wismo-host');
  if (h) h.remove();
}

function applyConfig(c) {
  var shadow = document.getElementById('wismo-host').shadowRoot;
  // Apply color
  if (c.color) {
    shadow.querySelector('.w').style.setProperty('--ac', c.color);
  }
  if (c.position === 'bottom-left') {
    shadow.querySelector('.w').classList.add('left');
  }
  // Apply brand name
  var title = shadow.querySelector('.wt');
  if (title && c.brandName) title.textContent = c.brandName;
}

// ─── HTML Fragments ──────────────────────────────────────────────────
var BUBBLE_HTML = [
  '<button class="wb" aria-label="Chat with us">',
  '  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  '</button>',
].join('');

var WINDOW_HTML = [
  '<div class="ww" style="display:none">',
  // Header
  '  <div class="wh">',
  '    <div class="whl">',
  '      <div class="wa"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>',
  '      <div><div class="wt">WISMO AI</div><div class="ws">Online now</div></div>',
  '    </div>',
  '    <button class="wx" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>',
  '  </div>',
  // Messages
  '  <div class="wm"></div>',
  // Quick replies
  '  <div class="wq" style="display:none"></div>',
  // Input
  '  <div class="wi">',
  '    <input type="text" class="win" placeholder="Order number or question..." autocomplete="off" />',
  '    <button class="wsn" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>',
  '  </div>',
  '</div>',
].join('');

// ─── Event Wiring (after DOM ready) ──────────────────────────────────
(function wireEvents() {
  // Wait for shell
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
      bubble.style.display = 'none';
      if (!state.greeted) {
        state.greeted = true;
        setTimeout(function() {
          var greeting = state.config && state.config.greeting ? state.config.greeting : 'Track your order in seconds';
          addMsg('bot', greeting);
          showQR(['📦 Track my order', '💬 Ask a question']);
        }, 200);
      }
      input.focus();
    });

    // Close
    closeBtn.addEventListener('click', function() {
      state.open = false;
      win.style.display = 'none';
      bubble.style.display = 'flex';
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
        addMsg('bot', d.reply);
        if (d.quickReplies && d.quickReplies.length) showQR(d.quickReplies);
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

    // ─── Helpers ───────────────────────────────────────────────
    function addMsg(role, content) {
      var d = document.createElement('div');
      d.className = 'mm m-' + role;
      // Format markdown-lite
      var html = content
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>');
      d.innerHTML = html;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function addTyping() {
      var d = document.createElement('div');
      d.className = 'mm m-bot typing';
      d.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    }

    function showQR(items) {
      qr.innerHTML = '';
      items.forEach(function(t) {
        var b = document.createElement('button');
        b.className = 'qb';
        b.textContent = t;
        b.addEventListener('click', function() { send(t); });
        qr.appendChild(b);
      });
      qr.style.display = 'flex';
    }

    function hideQR() { qr.style.display = 'none'; qr.innerHTML = ''; }
  }, 50);
})();

// ─── CSS ──────────────────────────────────────────────────────────────
function CSS() {
  return '\
.w {\
  --ac: #008060;\
  --ac-light: #e3f0ea;\
  --ac-dark: #006649;\
  --radius: 12px;\
  --shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);\
  position: fixed;\
  bottom: 24px;\
  right: 24px;\
  z-index: 2147483647;\
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\
  -webkit-font-smoothing: antialiased;\
}\
.w.left { right: auto; left: 24px; }\
\
/* Bubble */\
.wb {\
  width: 56px;\
  height: 56px;\
  border-radius: 28px;\
  background: var(--ac);\
  color: #fff;\
  border: none;\
  cursor: pointer;\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  box-shadow: 0 4px 16px rgba(0,128,96,0.35);\
  transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;\
  outline: none;\
}\
.wb:hover { transform: scale(1.06); box-shadow: 0 6px 20px rgba(0,128,96,0.45); }\
.wb:active { transform: scale(0.97); }\
\
/* Window */\
.ww {\
  width: 390px;\
  height: 560px;\
  border-radius: 16px;\
  overflow: hidden;\
  display: flex;\
  flex-direction: column;\
  box-shadow: var(--shadow);\
  background: #fff;\
  animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1);\
}\
@keyframes slideUp {\
  from { opacity: 0; transform: translateY(16px) scale(0.96); }\
  to { opacity: 1; transform: translateY(0) scale(1); }\
}\
\
/* Header */\
.wh {\
  background: var(--ac);\
  color: #fff;\
  padding: 14px 18px;\
  display: flex;\
  align-items: center;\
  justify-content: space-between;\
  flex-shrink: 0;\
}\
.whl { display: flex; align-items: center; gap: 10px; }\
.wa {\
  width: 36px; height: 36px;\
  border-radius: 50%;\
  background: rgba(255,255,255,0.18);\
  display: flex; align-items: center; justify-content: center;\
}\
.wt { font-weight: 600; font-size: 15px; letter-spacing: -0.01em; }\
.ws { font-size: 12px; opacity: 0.8; margin-top: 1px; }\
.wx {\
  background: none; border: none; color: rgba(255,255,255,0.8);\
  cursor: pointer; padding: 6px; border-radius: 8px;\
  transition: background 0.15s, color 0.15s; outline: none;\
}\
.wx:hover { background: rgba(255,255,255,0.15); color: #fff; }\
\
/* Messages */\
.wm {\
  flex: 1;\
  padding: 14px 16px;\
  overflow-y: auto;\
  background: #f8f9fa;\
  -webkit-overflow-scrolling: touch;\
}\
.wm::-webkit-scrollbar { width: 5px; }\
.wm::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }\
.mm {\
  margin-bottom: 8px;\
  max-width: 82%;\
  padding: 10px 14px;\
  border-radius: 14px;\
  font-size: 14px;\
  line-height: 1.5;\
  word-wrap: break-word;\
  animation: fadeIn 0.18s ease-out;\
}\
@keyframes fadeIn {\
  from { opacity: 0; transform: translateY(6px); }\
  to { opacity: 1; transform: translateY(0); }\
}\
.mm a { color: var(--ac); text-decoration: underline; }\
.m-bot {\
  background: #fff;\
  color: #1c1c1e;\
  border-bottom-left-radius: 4px;\
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);\
}\
.m-user {\
  background: var(--ac);\
  color: #fff;\
  margin-left: auto;\
  border-bottom-right-radius: 4px;\
}\
\
/* Typing */\
.dots { display: flex; gap: 4px; padding: 3px 0; }\
.dots i {\
  width: 6px; height: 6px; border-radius: 50%;\
  background: #b0b0b0;\
  animation: bounce 1.4s ease-in-out infinite;\
}\
.dots i:nth-child(2) { animation-delay: 0.16s; }\
.dots i:nth-child(3) { animation-delay: 0.32s; }\
@keyframes bounce {\
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }\
  30% { transform: translateY(-4px); opacity: 1; }\
}\
\
/* Quick Replies */\
.wq {\
  padding: 0 16px 10px;\
  display: flex;\
  flex-wrap: wrap;\
  gap: 6px;\
  background: #f8f9fa;\
  flex-shrink: 0;\
}\
.qb {\
  background: #fff;\
  border: 1.5px solid var(--ac);\
  color: var(--ac);\
  padding: 7px 14px;\
  border-radius: 18px;\
  font-size: 13px;\
  font-weight: 500;\
  cursor: pointer;\
  transition: all 0.15s;\
  font-family: inherit;\
  outline: none;\
}\
.qb:hover { background: var(--ac); color: #fff; }\
.qb:active { transform: scale(0.96); }\
\
/* Input */\
.wi {\
  padding: 10px 14px;\
  border-top: 1px solid #eef0f2;\
  display: flex;\
  gap: 8px;\
  background: #fff;\
  flex-shrink: 0;\
}\
.win {\
  flex: 1;\
  border: 1.5px solid #e5e7eb;\
  border-radius: 20px;\
  padding: 9px 16px;\
  font-size: 14px;\
  outline: none;\
  transition: border-color 0.2s, box-shadow 0.2s;\
  font-family: inherit;\
  background: #fafbfc;\
}\
.win:focus {\
  border-color: var(--ac);\
  box-shadow: 0 0 0 3px rgba(0,128,96,0.1);\
  background: #fff;\
}\
.win::placeholder { color: #aaa; }\
.wsn {\
  width: 38px; height: 38px;\
  border-radius: 19px;\
  background: var(--ac);\
  color: #fff;\
  border: none;\
  cursor: pointer;\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  transition: opacity 0.15s, transform 0.1s;\
  flex-shrink: 0;\
  outline: none;\
}\
.wsn:hover { opacity: 0.88; }\
.wsn:active { transform: scale(0.93); }\
\
/* Mobile */\
@media (max-width: 480px) {\
  .ww { width: 100vw; height: 100vh; border-radius: 0; bottom: 0; right: 0; }\
  .w { bottom: 16px; right: 16px; }\
  .w.left { left: 16px; }\
}\
';
}
