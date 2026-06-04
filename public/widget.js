/**
 * WISMO AI - Storefront Chat Widget
 * 
 * This file is served as /widget.js and loaded by merchants on their Shopify store.
 * It creates a beautiful, lightweight chat bubble and conversation window.
 * 
 * Requirements:
 * - < 50KB total
 * - < 1s load time
 * - CSS isolated (Shadow DOM)
 * - Works on any Shopify theme
 */

// ─── Configuration ───────────────────────────────────────────────────
const SCRIPT_TAG = document.currentScript as HTMLScriptElement;
const SHOP_DOMAIN = new URL(SCRIPT_TAG?.src || '').searchParams.get('shop') || '';
const API_BASE = new URL(SCRIPT_TAG?.src || '').origin;

// ─── State ───────────────────────────────────────────────────────────
let config: any = null;
let conversationId: string | null = null;
let isOpen = false;
let isTyping = false;

// ─── Initialize ──────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch(`${API_BASE}/api/widget-config?shop=${encodeURIComponent(SHOP_DOMAIN)}`);
    config = await res.json();

    if (!config?.enabled) return; // Widget disabled, don't render

    renderWidget();
  } catch (e) {
    console.error('[WISMO] Failed to initialize:', e);
  }
}

// ─── Render Widget ───────────────────────────────────────────────────
function renderWidget() {
  // Create host element
  const host = document.createElement('div');
  host.id = 'wismo-widget-host';
  document.body.appendChild(host);

  // Use Shadow DOM for CSS isolation
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles
  const style = document.createElement('style');
  style.textContent = getStyles();
  shadow.appendChild(style);

  // Create widget container
  const container = document.createElement('div');
  container.className = 'wismo-container';
  container.innerHTML = `
    <!-- Chat Button (Bubble) -->
    <button class="wismo-bubble" aria-label="Open chat">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>

    <!-- Chat Window -->
    <div class="wismo-window" style="display:none">
      <div class="wismo-header">
        <div class="wismo-header-info">
          <div class="wismo-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <div>
            <div class="wismo-title">${config.brandName || 'WISMO AI'}</div>
            <div class="wismo-subtitle">Typically replies instantly</div>
          </div>
        </div>
        <button class="wismo-close" aria-label="Close chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="wismo-messages"></div>
      <div class="wismo-input-area">
        <input type="text" class="wismo-input" placeholder="Type a message..." autocomplete="off" />
        <button class="wismo-send" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;
  shadow.appendChild(container);

  // ─── Event Listeners ─────────────────────────────────────────────
  const bubble = container.querySelector('.wismo-bubble') as HTMLElement;
  const window_ = container.querySelector('.wismo-window') as HTMLElement;
  const closeBtn = container.querySelector('.wismo-close') as HTMLElement;
  const input = container.querySelector('.wismo-input') as HTMLInputElement;
  const sendBtn = container.querySelector('.wismo-send') as HTMLElement;
  const messagesDiv = container.querySelector('.wismo-messages') as HTMLElement;

  // Position
  const isLeft = config.position === 'bottom-left';
  container.classList.toggle('wismo-left', isLeft);

  // Bubble click → toggle chat
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    window_.style.display = isOpen ? 'flex' : 'none';
    bubble.style.display = isOpen ? 'none' : 'flex';
    if (isOpen && messagesDiv.children.length === 0) {
      addMessage('assistant', config.greeting || 'Hi! 👋 How can I help you today?');
    }
    if (isOpen) input.focus();
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    window_.style.display = 'none';
    bubble.style.display = 'flex';
  });

  // Send message
  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = '';
    addMessage('customer', text);
    
    // Show typing indicator
    isTyping = true;
    const typingEl = addTypingIndicator();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: SHOP_DOMAIN,
          message: text,
          conversationId,
        }),
      });

      const data = await res.json();
      
      // Remove typing indicator
      typingEl.remove();
      isTyping = false;

      if (data.error) {
        addMessage('assistant', 'Sorry, something went wrong. Please try again.');
        return;
      }

      conversationId = data.conversationId;
      addMessage('assistant', data.reply);
    } catch (e) {
      typingEl.remove();
      isTyping = false;
      addMessage('assistant', 'Connection error. Please try again.');
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ─── Helper Functions ─────────────────────────────────────────────
  function addMessage(role: string, content: string) {
    const div = document.createElement('div');
    div.className = `wismo-message wismo-${role}`;
    
    // Simple markdown-like formatting
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
    
    div.innerHTML = formatted;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function addTypingIndicator(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'wismo-message wismo-assistant wismo-typing';
    div.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return div;
  }
}

// ─── Styles ──────────────────────────────────────────────────────────
function getStyles(): string {
  const color = config?.color || '#008060';
  
  return `
    .wismo-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .wismo-container.wismo-left {
      right: auto;
      left: 20px;
    }

    /* Bubble */
    .wismo-bubble {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${color};
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .wismo-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }

    /* Chat Window */
    .wismo-window {
      width: 370px;
      max-height: 560px;
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      background: #fff;
      animation: wismo-slide-in 0.3s ease-out;
    }

    @keyframes wismo-slide-in {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .wismo-header {
      background: ${color};
      color: #fff;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .wismo-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .wismo-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .wismo-title {
      font-weight: 600;
      font-size: 15px;
    }

    .wismo-subtitle {
      font-size: 12px;
      opacity: 0.85;
    }

    .wismo-close {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .wismo-close:hover {
      background: rgba(255,255,255,0.2);
    }

    /* Messages */
    .wismo-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      min-height: 300px;
      max-height: 380px;
      background: #f9fafb;
    }

    .wismo-message {
      margin-bottom: 12px;
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .wismo-message a {
      color: ${color};
      text-decoration: underline;
    }

    .wismo-assistant {
      background: #fff;
      color: #1a1a1a;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .wismo-customer {
      background: ${color};
      color: #fff;
      margin-left: auto;
      border-bottom-right-radius: 4px;
    }

    /* Typing indicator */
    .typing-dots {
      display: flex;
      gap: 4px;
      padding: 2px 0;
    }

    .typing-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
      animation: wismo-typing 1.4s infinite;
    }

    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes wismo-typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* Input */
    .wismo-input-area {
      padding: 12px 16px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      gap: 8px;
      background: #fff;
    }

    .wismo-input {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .wismo-input:focus {
      border-color: ${color};
    }

    .wismo-send {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${color};
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .wismo-send:hover {
      opacity: 0.9;
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      .wismo-window {
        width: calc(100vw - 24px);
        max-height: calc(100vh - 80px);
        bottom: 12px;
        right: 12px;
        border-radius: 12px;
      }

      .wismo-container {
        bottom: 12px;
        right: 12px;
      }

      .wismo-container.wismo-left {
        left: 12px;
      }
    }
  `;
}

// ─── Start ───────────────────────────────────────────────────────────
init();
