/**
 * WISMO AI Widget v3.5.5
 * Standalone widget - loaded from Vercel CDN
 * Config read from window.__wismo_config (set by loader in theme.liquid)
 */
(function() {
  var config = window.__wismo_config;
  if (!config || !config.shop || window.__wismo_booted) return;
  window.__wismo_booted = true;

  var SHOP = config.shop;
  var API = config.api || 'https://shopify-ai-lister-tau.vercel.app/api/chat';
  var POS = config.pos || 'right';
  var COLOR = config.color || '#008060';
  var GREETING = config.greeting || 'Track your order in seconds';
  var BRAND = config.brand || '';

  // ─── Create host element with Shadow DOM ───
  var host = document.createElement('div');
  host.id = 'wismo-host';
  var shadow = host.attachShadow({ mode: 'open' });

  // ─── Build styles ───
  var style = document.createElement('style');
  style.textContent = [
    '* { box-sizing: border-box; margin: 0; padding: 0 }',
    ':host { position: fixed; bottom: 80px; ' + POS + ': 24px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif }',
    '@media(max-width:480px) { :host { bottom: 60px; ' + POS + ': 8px } }',
    '.b { width: 56px; height: 56px; border-radius: 50%; background: ' + COLOR + '; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,.25); transition: transform .2s, box-shadow .2s; position: fixed; bottom: 80px; ' + POS + ': 24px }',
    '@media(max-width:480px) { .b { bottom: 60px; ' + POS + ': 8px; width: 48px; height: 48px } }',
    '.b:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,.3) }',
    '.b svg { width: 26px; height: 26px; fill: #fff }',
    '.c { position: fixed; bottom: 156px; ' + POS + ': 24px; width: 380px; max-height: 560px; background: #fff; border-radius: 16px; box-shadow: 0 12px 48px rgba(0,0,0,.18); display: none; flex-direction: column; overflow: hidden }',
    '@media(max-width:480px) { .c { bottom: 0; ' + POS + ': 0; right: 0; width: 100%; height: 100%; max-height: 100%; border-radius: 0 } }',
    '.ch { background: ' + COLOR + '; color: #fff; padding: 16px; display: flex; align-items: center; justify-content: space-between }',
    '.ch h3 { font-size: 15px; font-weight: 700 }',
    '.ch small { font-size: 11px; opacity: .85; display: block; margin-top: 2px }',
    '.cx { background: none; border: none; color: #fff; cursor: pointer; padding: 4px; border-radius: 6px; line-height: 1; font-size: 20px }',
    '.cx:hover { background: rgba(255,255,255,.2) }',
    '.cb { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px }',
    '.m { padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5; max-width: 90%; word-wrap: break-word }',
    '.mb { background: #e8f5e9; color: #1a1a1a; align-self: flex-start }',
    '.mu { background: #f1f3f5; color: #1a1a1a; align-self: flex-end }',
    '.ci { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #f1f3f5 }',
    '.ci input { flex: 1; padding: 10px 14px; border: 1.5px solid #e1e3e5; border-radius: 10px; font-size: 13px; outline: none; transition: border .2s }',
    '.ci input:focus { border-color: ' + COLOR + ' }',
    '.ci button { padding: 10px 18px; background: ' + COLOR + '; color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity .2s; white-space: nowrap }',
    '.ci button:hover { opacity: .9 }',
    '.pr { font-size: 10px; color: #bbb; text-align: center; padding: 4px 0 8px }',
    '.ld { display: flex; gap: 4px; padding: 4px 0 }',
    '.ld span { width: 6px; height: 6px; border-radius: 50%; background: ' + COLOR + '; animation: wismoDot 1.4s infinite both }',
    '.ld span:nth-child(2) { animation-delay: .2s }',
    '.ld span:nth-child(3) { animation-delay: .4s }',
    '@keyframes wismoDot { 0%,80%,100% { opacity: .25; transform: scale(.8) } 40% { opacity: 1; transform: scale(1) } }',
    '.qr { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px }',
    '.qb { padding: 6px 12px; background: #f1f3f5; border: 1px solid #e1e3e5; border-radius: 8px; font-size: 12px; cursor: pointer; transition: background .15s }',
    '.qb:hover { background: #e8f5e9; border-color: ' + COLOR + ' }',
    'a { color: #2563eb }'
  ].join('\n');
  shadow.appendChild(style);

  // ─── Build DOM elements (no innerHTML for interactive elements) ───
  // Bubble button
  var bubble = document.createElement('div');
  bubble.className = 'b';
  bubble.style.display = 'none';
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

  // Chat window
  var chat = document.createElement('div');
  chat.className = 'c';

  // Header
  var header = document.createElement('div');
  header.className = 'ch';
  var headerText = document.createElement('div');
  var h3 = document.createElement('h3');
  h3.textContent = BRAND || 'Order Tracking';
  var small = document.createElement('small');
  small.textContent = 'AI-powered';
  headerText.appendChild(h3);
  headerText.appendChild(small);
  var closeBtn = document.createElement('button');
  closeBtn.className = 'cx';
  closeBtn.innerHTML = '&times;';
  var newChatBtn = document.createElement('button');
  newChatBtn.className = 'cx';
  newChatBtn.innerHTML = '&#8635;';
  newChatBtn.title = 'New conversation';
  header.appendChild(headerText);
  var headerBtns = document.createElement('div');
  headerBtns.style.display = 'flex';
  headerBtns.style.gap = '4px';
  headerBtns.appendChild(newChatBtn);
  headerBtns.appendChild(closeBtn);
  header.appendChild(headerBtns);

  // Messages area
  var msgs = document.createElement('div');
  msgs.className = 'cb';

  // Input area
  var inputArea = document.createElement('div');
  inputArea.className = 'ci';
  var inp = document.createElement('input');
  inp.placeholder = 'Enter order number or email...';
  var trackBtn = document.createElement('button');
  trackBtn.textContent = 'Track';
  inputArea.appendChild(inp);
  inputArea.appendChild(trackBtn);

  // Privacy
  var privacy = document.createElement('div');
  privacy.className = 'pr';
  privacy.textContent = 'Privacy';

  // Assemble chat window
  chat.appendChild(header);
  chat.appendChild(msgs);
  chat.appendChild(inputArea);
  chat.appendChild(privacy);

  // Add to shadow DOM
  shadow.appendChild(bubble);
  shadow.appendChild(chat);
  document.body.appendChild(host);

  // ─── State ───
  var cid = null;
  var open = false;

  // ─── Safe HTML rendering ───
  function safeHtml(t) {
    var el = document.createElement('span');
    el.textContent = t;
    var s = el.innerHTML;
    // Bold: **text**
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Links: [text](url) - only allow http/https URLs
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, text, url) {
      if (/^https?:\/\//i.test(url)) {
        return '<a href="' + url + '" target="_blank" rel="noopener">' + text + '</a>';
      }
      return text;
    });
    return s;
  }

  // ─── Restore conversation ───
  try { var saved = localStorage.getItem('wismo_cid'); if (saved) cid = saved; } catch(e) {}

  // ─── Load history for restored conversation ───
  function loadHistory() {
    if (!cid) return Promise.resolve();
    var histUrl = API.replace('/chat', '/chat/history') + '?conversationId=' + encodeURIComponent(cid) + '&shop=' + encodeURIComponent(SHOP);
    return fetch(histUrl)
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (!d.messages || !d.messages.length) return;
        for (var i = 0; i < d.messages.length; i++) {
          var m = d.messages[i];
          if (m.role === 'customer') addUser(m.content);
          else if (m.role === 'assistant') addBot(m.content);
        }
      })
      .catch(function() { /* history load failure is non-critical */ });
  }

  // ─── New conversation ───
  function newConversation() {
    cid = null;
    try { localStorage.removeItem('wismo_cid'); } catch(e) {}
    while (msgs.firstChild) msgs.removeChild(msgs.firstChild);
    addBot(GREETING);
  }

  // ─── Toggle chat ───
  function toggle() {
    open = !open;
    chat.style.display = open ? 'flex' : 'none';
    bubble.style.display = open ? 'none' : 'flex';
    if (open && msgs.children.length === 0) {
      if (cid) {
        loadHistory();
      } else {
        addBot(GREETING);
      }
    }
  }
  bubble.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);
  newChatBtn.addEventListener('click', function(e) { e.stopPropagation(); newConversation(); });

  // ─── Message functions ───
  function addBot(t) {
    var d = document.createElement('div');
    d.className = 'm mb';
    d.innerHTML = safeHtml(t);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUser(t) {
    var d = document.createElement('div');
    d.className = 'm mu';
    d.textContent = t;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addLoading() {
    var d = document.createElement('div');
    d.className = 'm mb';
    d.id = 'wld';
    d.innerHTML = '<div class="ld"><span></span><span></span><span></span></div>';
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function rmLoading() {
    var d = shadow.getElementById('wld');
    if (d) d.remove();
  }

  function addQuick(replies) {
    if (!replies || !replies.length) return;
    var d = document.createElement('div');
    d.className = 'qr';
    for (var i = 0; i < replies.length; i++) {
      (function(reply) {
        var b = document.createElement('button');
        b.className = 'qb';
        b.textContent = reply;
        b.addEventListener('click', function() { d.remove(); sendMsg(reply); });
        d.appendChild(b);
      })(replies[i]);
    }
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ─── Send message ───
  function sendMsg(text) {
    try {
      if (!text || !text.trim()) return;
      addUser(text);
      inp.value = '';
      addLoading();
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP, message: text, conversationId: cid })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        rmLoading();
        if (d.conversationId) {
          cid = d.conversationId;
          try { localStorage.setItem('wismo_cid', cid); } catch(e) {}
        }
        if (d.reply) addBot(d.reply);
        if (d.quickReplies) addQuick(d.quickReplies);
      })
      .catch(function() {
        rmLoading();
        addBot('Connection error. Please try again.');
      });
    } catch(e) {
      rmLoading();
      addBot('Something went wrong. Please try again.');
    }
  }

  trackBtn.addEventListener('click', function() { sendMsg(inp.value); });
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendMsg(inp.value); });

  // ─── Load widget config ───
  var configUrl = API.replace('/chat', '/widget-config') + '?shop=' + encodeURIComponent(SHOP);
  fetch(configUrl)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.enabled === false) {
        bubble.style.display = 'none';
        return;
      }
      bubble.style.display = 'flex';
      if (d.faqItems && d.faqItems.length > 0) {
        var fd = document.createElement('div');
        fd.className = 'qr';
        for (var i = 0; i < d.faqItems.length; i++) {
          (function(item) {
            var b = document.createElement('button');
            b.className = 'qb';
            b.textContent = item.question;
            b.addEventListener('click', function() { fd.remove(); sendMsg(item.question); });
            fd.appendChild(b);
          })(d.faqItems[i]);
        }
        msgs.appendChild(fd);
        msgs.scrollTop = msgs.scrollHeight;
      }
    })
    .catch(function() { bubble.style.display = 'flex'; });
})();
