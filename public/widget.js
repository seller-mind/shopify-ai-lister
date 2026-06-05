/**
 * WISMO AI - Storefront Chat Widget v2
 * 
 * "The best WISMO chatbot in the world"
 * - Quick reply buttons for instant actions
 * - Beautiful, smooth animations
 * - Order status with visual indicators
 * - Fast: order responses are instant
 * - < 50KB, Shadow DOM isolated
 */

// ─── Configuration ───────────────────────────────────────────────────
var SCRIPT_TAG = document.currentScript;
var EMBED_ROOT = document.getElementById('wismo-chat-root');
var SHOP_DOMAIN = new URL(SCRIPT_TAG && SCRIPT_TAG.src ? SCRIPT_TAG.src : 'https://shopify-ai-lister-tau.vercel.app').searchParams.get('shop') || (EMBED_ROOT ? EMBED_ROOT.dataset.shop : '') || '';
var API_BASE = SCRIPT_TAG && SCRIPT_TAG.src ? new URL(SCRIPT_TAG.src).origin : 'https://shopify-ai-lister-tau.vercel.app';

// ─── State ───────────────────────────────────────────────────────────
var config = null;
var conversationId = null;
var isOpen = false;
var isTyping = false;
var hasGreeted = false;

// ─── Initialize ──────────────────────────────────────────────────────
async function init() {
  try {
    var res = await fetch(API_BASE + '/api/widget-config?shop=' + encodeURIComponent(SHOP_DOMAIN));
    config = await res.json();
    if (!config || !config.enabled) return;
    renderWidget();
  } catch (e) {
    console.error('[WISMO] Failed to initialize:', e);
  }
}

// ─── Render Widget ───────────────────────────────────────────────────
function renderWidget() {
  var host = document.createElement('div');
  host.id = 'wismo-widget-host';
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'open' });

  var style = document.createElement('style');
  style.textContent = getStyles();
  shadow.appendChild(style);

  var container = document.createElement('div');
  container.className = 'wismo-container';
  container.innerHTML = [
    '<!-- Chat Bubble -->',
    '<button class="wismo-bubble" aria-label="Chat with us">',
    '  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
    '  </svg>',
    '  <span class="wismo-bubble-badge" style="display:none">1</span>',
    '</button>',
    '',
    '<!-- Chat Window -->',
    '<div class="wismo-window" style="display:none">',
    '  <div class="wismo-header">',
    '    <div class="wismo-header-left">',
    '      <div class="wismo-avatar">',
    '        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    '      </div>',
    '      <div>',
    '        <div class="wismo-title">' + (config.brandName || 'WISMO AI') + '</div>',
    '        <div class="wismo-subtitle">⚡ Typically replies instantly</div>',
    '      </div>',
    '    </div>',
    '    <button class="wismo-close" aria-label="Close chat">',
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '    </button>',
    '  </div>',
    '  <div class="wismo-messages"></div>',
    '  <div class="wismo-quick-replies" style="display:none"></div>',
    '  <div class="wismo-input-area">',
    '    <input type="text" class="wismo-input" placeholder="Ask about your order..." autocomplete="off" />',
    '    <button class="wismo-send" aria-label="Send">',
    '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    '    </button>',
    '  </div>',
    '</div>'
  ].join('\n');
  shadow.appendChild(container);

  // ─── Elements ──────────────────────────────────────────────────
  var bubble = container.querySelector('.wismo-bubble');
  var windowEl = container.querySelector('.wismo-window');
  var closeBtn = container.querySelector('.wismo-close');
  var input = container.querySelector('.wismo-input');
  var sendBtn = container.querySelector('.wismo-send');
  var messagesDiv = container.querySelector('.wismo-messages');
  var quickRepliesDiv = container.querySelector('.wismo-quick-replies');

  // Position
  if (config.position === 'bottom-left') container.classList.add('wismo-left');

  // ─── Open / Close ──────────────────────────────────────────────
  bubble.addEventListener('click', function() {
    isOpen = true;
    windowEl.style.display = 'flex';
    bubble.style.display = 'none';
    if (!hasGreeted) {
      showGreeting();
      hasGreeted = true;
    }
    input.focus();
  });

  closeBtn.addEventListener('click', function() {
    isOpen = false;
    windowEl.style.display = 'none';
    bubble.style.display = 'flex';
  });

  // ─── Send Message ──────────────────────────────────────────────
  var sendMessage = async function(text) {
    if (!text || isTyping) return;
    if (!text) text = input.value.trim();
    if (!text) return;

    input.value = '';
    hideQuickReplies();
    addMessage('customer', text);
    
    isTyping = true;
    var typingEl = addTypingIndicator();

    try {
      var res = await fetch(API_BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: SHOP_DOMAIN, message: text, conversationId: conversationId }),
      });

      var data = await res.json();
      typingEl.remove();
      isTyping = false;

      if (data.error) {
        addMessage('assistant', 'Sorry, something went wrong. Please try again.');
        return;
      }

      conversationId = data.conversationId;
      addMessage('assistant', data.reply);
      
      // Show quick reply buttons if available
      if (data.quickReplies && data.quickReplies.length > 0) {
        showQuickReplies(data.quickReplies);
      }
    } catch (e) {
      typingEl.remove();
      isTyping = false;
      addMessage('assistant', 'Connection error. Please try again.');
    }
  };

  sendBtn.addEventListener('click', function() { sendMessage(input.value.trim()); });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value.trim());
    }
  });

  // ─── Greeting with Quick Actions ───────────────────────────────
  function showGreeting() {
    var greeting = config.greeting || 'Hi! 👋 How can I help you today?';
    addMessage('assistant', greeting);
    showQuickReplies(['📦 Track my order', '💬 Ask a question']);
  }

  // ─── Quick Replies ─────────────────────────────────────────────
  function showQuickReplies(replies) {
    quickRepliesDiv.innerHTML = '';
    replies.forEach(function(text) {
      var btn = document.createElement('button');
      btn.className = 'wismo-quick-btn';
      btn.textContent = text;
      btn.addEventListener('click', function() {
        sendMessage(text);
      });
      quickRepliesDiv.appendChild(btn);
    });
    quickRepliesDiv.style.display = 'flex';
  }

  function hideQuickReplies() {
    quickRepliesDiv.style.display = 'none';
    quickRepliesDiv.innerHTML = '';
  }

  // ─── Message Helpers ───────────────────────────────────────────
  function addMessage(role, content) {
    var div = document.createElement('div');
    div.className = 'wismo-message wismo-' + role;
    
    var formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
    
    div.innerHTML = formatted;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function addTypingIndicator() {
    var div = document.createElement('div');
    div.className = 'wismo-message wismo-assistant wismo-typing';
    div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return div;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────
function getStyles() {
  var color = config && config.color ? config.color : '#008060';
  
  return '\
    .wismo-container {\
      position: fixed;\
      bottom: 20px;\
      right: 20px;\
      z-index: 999999;\
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\
    }\
    .wismo-container.wismo-left { right: auto; left: 20px; }\
    .wismo-bubble {\
      width: 60px;\
      height: 60px;\
      border-radius: 50%;\
      background: ' + color + ';\
      color: #fff;\
      border: none;\
      cursor: pointer;\
      display: flex;\
      align-items: center;\
      justify-content: center;\
      box-shadow: 0 4px 16px rgba(0,128,96,0.3);\
      transition: transform 0.2s, box-shadow 0.2s;\
      position: relative;\
    }\
    .wismo-bubble:hover {\
      transform: scale(1.08);\
      box-shadow: 0 6px 24px rgba(0,128,96,0.4);\
    }\
    .wismo-bubble-badge {\
      position: absolute;\
      top: -2px;\
      right: -2px;\
      background: #e74c3c;\
      color: #fff;\
      font-size: 11px;\
      font-weight: 700;\
      min-width: 18px;\
      height: 18px;\
      border-radius: 9px;\
      display: flex;\
      align-items: center;\
      justify-content: center;\
      border: 2px solid #fff;\
    }\
    .wismo-window {\
      width: 380px;\
      max-height: 600px;\
      border-radius: 16px;\
      overflow: hidden;\
      display: flex;\
      flex-direction: column;\
      box-shadow: 0 12px 48px rgba(0,0,0,0.15);\
      background: #fff;\
      animation: wismo-slide-up 0.3s cubic-bezier(0.16,1,0.3,1);\
    }\
    @keyframes wismo-slide-up {\
      from { opacity: 0; transform: translateY(20px) scale(0.95); }\
      to { opacity: 1; transform: translateY(0) scale(1); }\
    }\
    .wismo-header {\
      background: ' + color + ';\
      color: #fff;\
      padding: 16px 20px;\
      display: flex;\
      align-items: center;\
      justify-content: space-between;\
    }\
    .wismo-header-left {\
      display: flex;\
      align-items: center;\
      gap: 12px;\
    }\
    .wismo-avatar {\
      width: 40px;\
      height: 40px;\
      border-radius: 50%;\
      background: rgba(255,255,255,0.2);\
      display: flex;\
      align-items: center;\
      justify-content: center;\
    }\
    .wismo-title {\
      font-weight: 700;\
      font-size: 16px;\
    }\
    .wismo-subtitle {\
      font-size: 12px;\
      opacity: 0.85;\
      margin-top: 1px;\
    }\
    .wismo-close {\
      background: none;\
      border: none;\
      color: #fff;\
      cursor: pointer;\
      padding: 6px;\
      border-radius: 50%;\
      transition: background 0.2s;\
    }\
    .wismo-close:hover { background: rgba(255,255,255,0.2); }\
    .wismo-messages {\
      flex: 1;\
      padding: 16px;\
      overflow-y: auto;\
      min-height: 280px;\
      max-height: 400px;\
      background: #fafbfc;\
    }\
    .wismo-message {\
      margin-bottom: 10px;\
      max-width: 85%;\
      padding: 10px 14px;\
      border-radius: 16px;\
      font-size: 14px;\
      line-height: 1.55;\
      word-wrap: break-word;\
      animation: wismo-msg-in 0.2s ease-out;\
    }\
    @keyframes wismo-msg-in {\
      from { opacity: 0; transform: translateY(8px); }\
      to { opacity: 1; transform: translateY(0); }\
    }\
    .wismo-message a {\
      color: ' + color + ';\
      text-decoration: underline;\
    }\
    .wismo-assistant {\
      background: #fff;\
      color: #1a1a1a;\
      border-bottom-left-radius: 4px;\
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);\
    }\
    .wismo-customer {\
      background: ' + color + ';\
      color: #fff;\
      margin-left: auto;\
      border-bottom-right-radius: 4px;\
    }\
    .typing-dots {\
      display: flex;\
      gap: 4px;\
      padding: 2px 0;\
    }\
    .typing-dots span {\
      width: 7px;\
      height: 7px;\
      border-radius: 50%;\
      background: #aaa;\
      animation: wismo-dot 1.4s infinite;\
    }\
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }\
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }\
    @keyframes wismo-dot {\
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }\
      30% { transform: translateY(-5px); opacity: 1; }\
    }\
    .wismo-quick-replies {\
      padding: 0 16px 8px;\
      display: flex;\
      flex-wrap: wrap;\
      gap: 6px;\
      background: #fafbfc;\
    }\
    .wismo-quick-btn {\
      background: #fff;\
      border: 1.5px solid ' + color + ';\
      color: ' + color + ';\
      padding: 6px 14px;\
      border-radius: 20px;\
      font-size: 13px;\
      font-weight: 500;\
      cursor: pointer;\
      transition: all 0.15s;\
      font-family: inherit;\
    }\
    .wismo-quick-btn:hover {\
      background: ' + color + ';\
      color: #fff;\
    }\
    .wismo-input-area {\
      padding: 12px 16px;\
      border-top: 1px solid #eee;\
      display: flex;\
      gap: 8px;\
      background: #fff;\
    }\
    .wismo-input {\
      flex: 1;\
      border: 1.5px solid #e5e7eb;\
      border-radius: 22px;\
      padding: 10px 18px;\
      font-size: 14px;\
      outline: none;\
      transition: border-color 0.2s;\
      font-family: inherit;\
    }\
    .wismo-input:focus {\
      border-color: ' + color + ';\
    }\
    .wismo-input::placeholder {\
      color: #aaa;\
    }\
    .wismo-send {\
      width: 40px;\
      height: 40px;\
      border-radius: 50%;\
      background: ' + color + ';\
      color: #fff;\
      border: none;\
      cursor: pointer;\
      display: flex;\
      align-items: center;\
      justify-content: center;\
      transition: opacity 0.15s;\
      flex-shrink: 0;\
    }\
    .wismo-send:hover { opacity: 0.85; }\
    @media (max-width: 480px) {\
      .wismo-window {\
        width: calc(100vw - 16px);\
        max-height: calc(100vh - 80px);\
        bottom: 8px;\
        right: 8px;\
        border-radius: 12px;\
      }\
      .wismo-container { bottom: 12px; right: 12px; }\
      .wismo-container.wismo-left { left: 12px; }\
    }\
  ';
}

// ─── Start ───────────────────────────────────────────────────────────
init();
