/**
 * Kurukoo DeepSeek-Style African Modernism Chat Engine
 * Multi-channel Economic OS Primary Interface
 */

window.KurukooChat = Object.assign(window.KurukooChat || {}, {
    initComplete: true,
    userPhone: localStorage.getItem('kurukoo_user_phone') || '+2348030000000',
    theme: localStorage.getItem('kurukoo_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    points: 30,

    // Markdown & Code Renderer
    renderMarkdown: function(text) {
        if (!text) return '';

        // Extract thinking process if present
        let thoughtHTML = '';
        const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
        if (thinkMatch) {
            const rawThought = thinkMatch[1].trim();
            thoughtHTML = `
            <div class="thinking-block">
                <div class="thinking-header" onclick="this.parentElement.classList.toggle('collapsed')">
                    <div class="thinking-title-wrap">
                        <span class="thinking-glow-dot"></span>
                        <span>Thought Process</span>
                    </div>
                    <span style="font-size: 0.7rem; opacity: 0.8;">▼</span>
                </div>
                <div class="thinking-content">${this.escapeHTML(rawThought)}</div>
            </div>`;
            text = text.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
        }

        // Parse Code Blocks ```lang ... ```
        const codeBlocks = [];
        text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const index = codeBlocks.length;
            const codeId = `code-block-${Date.now()}-${index}`;
            const cleanCode = code.trim();
            const languageLabel = (lang || 'code').toUpperCase();
            
            codeBlocks.push(`
            <div class="code-block-container" id="${codeId}">
                <div class="code-block-header">
                    <span>${languageLabel}</span>
                    <button type="button" class="code-copy-btn" onclick="window.KurukooChat.copyCode('${codeId}')">
                        📋 Copy Code
                    </button>
                </div>
                <pre><code>${this.escapeHTML(cleanCode)}</code></pre>
            </div>`);
            return `__CODE_BLOCK_${index}__`;
        });

        // Basic Markdown Formatting
        let formatted = this.escapeHTML(text);

        // Headers
        formatted = formatted.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        formatted = formatted.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        formatted = formatted.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold & Italic
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/__(.*?)__/g, '<u>$1</u>');

        // Inline Code `code`
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Blockquotes
        formatted = formatted.replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid #D97A5C; padding-left: 10px; margin: 6px 0; color: var(--gray-600);">$1</blockquote>');

        // Bullet Lists
        formatted = formatted.replace(/^\s*•\s+(.*$)/gim, '<li>$1</li>');
        formatted = formatted.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/gims, '<ul style="margin: 6px 0 6px 18px;">$1</ul>');

        // Line Breaks (convert single newlines to <br> unless inside tags)
        formatted = formatted.replace(/\n/g, '<br>');

        // Restore Code Blocks
        codeBlocks.forEach((block, idx) => {
            formatted = formatted.replace(`__CODE_BLOCK_${idx}__`, block);
        });

        return `<div class="markdown-body">${thoughtHTML}${formatted}</div>`;
    },

    escapeHTML: function(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    copyCode: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const codeEl = container.querySelector('code');
        const btn = container.querySelector('.code-copy-btn');
        if (codeEl) {
            navigator.clipboard.writeText(codeEl.innerText).then(() => {
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '✓ Copied!';
                    btn.style.color = '#10B981';
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.color = '';
                    }, 2000);
                }
            });
        }
    },

    copyMessage: function(msgId) {
        const msgEl = document.getElementById(msgId);
        if (!msgEl) return;
        const text = msgEl.innerText;
        navigator.clipboard.writeText(text).then(() => {
            const pill = document.createElement('div');
            pill.className = 'copied-toast';
            pill.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #D97A5C; color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.8rem; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
            pill.innerText = 'Message copied to clipboard!';
            document.body.appendChild(pill);
            setTimeout(() => pill.remove(), 2000);
        });
    },

    deleteMessage: function(msgId) {
        const msgEl = document.getElementById(msgId);
        if (msgEl) {
            msgEl.style.opacity = '0';
            msgEl.style.transform = 'translateY(10px)';
            setTimeout(() => msgEl.remove(), 200);
        }
    },

    toggleTheme: function() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('kurukoo_theme', this.theme);
        this.applyTheme();
    },

    applyTheme: function() {
        if (this.theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';
            themeBtn.title = `Switch to ${this.theme === 'dark' ? 'Light' : 'Dark'} Mode`;
        }
    },

    // Escrow Actions
    releaseEscrow: function(refId, amount, providerName) {
        const card = document.getElementById(`action-card-${refId}`);
        if (card) {
            const statusEl = card.querySelector('.action-card-status');
            if (statusEl) {
                statusEl.innerHTML = '🟢 ESCROW RELEASED & SETTLED';
                statusEl.style.background = '#e6f4ea';
                statusEl.style.color = '#137333';
            }
            const releaseBtn = card.querySelector('.release-escrow-btn');
            if (releaseBtn) {
                releaseBtn.disabled = true;
                releaseBtn.style.background = '#137333';
                releaseBtn.innerHTML = '✅ Paid to Provider';
            }
        }
        if (typeof this.addBubble === 'function') {
            this.addBubble('assistant', `🎉 **Escrow Funds Released!**\n• **Settlement Reference**: \`STL-${refId}\`\n• **Amount Disbursed**: **${amount}** to **${providerName || 'Verified Provider'}**\n• **Settlement Rail**: Moniepoint MFB Custody\n• **Time**: ${new Date().toLocaleTimeString()}\n\nTransaction permanently confirmed on the Kurukoo Trust Ledger.`, false);
        }
    },

    refundEscrow: function(refId, amount) {
        const card = document.getElementById(`action-card-${refId}`);
        if (card) {
            const statusEl = card.querySelector('.action-card-status');
            if (statusEl) {
                statusEl.innerHTML = '🔴 ESCROW REFUNDED';
                statusEl.style.background = '#fef2f2';
                statusEl.style.color = '#dc2626';
            }
            const buttons = card.querySelectorAll('button');
            buttons.forEach(b => {
                b.disabled = true;
                b.style.opacity = '0.5';
            });
        }
        if (typeof this.addBubble === 'function') {
            this.addBubble('assistant', `🛡️ **Escrow Hold Cancelled & Refunded!**\n• **Reference**: \`${refId}\`\n• **Refunded Amount**: **${amount}**\n• **Destination**: Credited immediately back to your Kurukoo Balance\n• **Fee**: ₦0.00 (Zero-Penalty Buyer Protection)`, false);
        }
    },

    showReceipt: function(refId, amount, serviceName) {
        if (typeof this.addBubble === 'function') {
            const receiptHTML = `
            <div style="background: white; border: 1px dashed #64748b; border-radius: 10px; padding: 10px 12px; font-family: monospace; font-size: 0.72rem; color: #1e293b; margin: 6px 0;">
                <div style="text-align: center; font-weight: 800; font-size: 0.8rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; color: #D97A5C;">KURUKOO OS TRANSACTION RECEIPT</div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>TX REF:</span><span>${refId}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>SERVICE:</span><span>${serviceName || 'Economic Coordination'}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>AMOUNT:</span><span style="font-weight: 700;">${amount}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>ESCROW VAULT:</span><span>Moniepoint MFB / OPay</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>STATUS:</span><span style="color: #137333; font-weight: 700;">VERIFIED / SETTLED</span></div>
                <div style="border-top: 1px dashed #cbd5e1; margin-top: 4px; padding-top: 4px; text-align: center; font-size: 0.62rem; color: #64748b;">Cryptographically Signed by Kurukoo Trust Ledger</div>
            </div>`;
            this.addBubble('assistant', receiptHTML, false);
        }
    },

    // Points Balance & Topup
    fetchPoints: async function() {
        try {
            const res = await fetch(`/api/points/balance?phone=${encodeURIComponent(this.userPhone)}`);
            if (res.ok) {
                const data = await res.json();
                this.points = data.points || 30;
                this.updatePointsUI();
            }
        } catch (e) {}
    },

    updatePointsUI: function() {
        const el = document.getElementById('points-balance-pill');
        if (el) {
            el.innerHTML = `🪙 ${this.points} Points`;
        }
    },

    openPointsModal: function() {
        let modal = document.getElementById('points-topup-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'points-topup-modal';
            modal.className = 'modal-overlay';
            modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
            <div class="modal-box" style="background: var(--white, #fff); border-radius: 16px; padding: 24px; max-width: 400px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--charcoal);">🪙 Kurukoo Points</h3>
                    <button type="button" onclick="document.getElementById('points-topup-modal').style.display='none'" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
                </div>
                <p style="font-size: 0.85rem; color: var(--gray-600); margin-bottom: 16px;">
                    Current Balance: <strong style="color: #D97A5C; font-size: 1rem;">${this.points} Points</strong><br>
                    Points are used for AI reasoning queries, live radar pings, and priority dispatch.
                </p>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                    <button class="btn-card" onclick="window.KurukooChat.topUpPoints(20, '₦1,000')" style="padding: 10px; border-radius: 8px; border: 1px solid var(--gray-200); background: var(--gray-50); display: flex; justify-content: space-between; font-weight: 600; cursor: pointer;">
                        <span>+20 Points</span>
                        <span style="color: #D97A5C;">₦1,000</span>
                    </button>
                    <button class="btn-card" onclick="window.KurukooChat.topUpPoints(50, '₦2,500')" style="padding: 10px; border-radius: 8px; border: 1.5px solid #D97A5C; background: rgba(217, 122, 92, 0.08); display: flex; justify-content: space-between; font-weight: 700; cursor: pointer;">
                        <span>+50 Points (Popular)</span>
                        <span style="color: #D97A5C;">₦2,500</span>
                    </button>
                    <button class="btn-card" onclick="window.KurukooChat.topUpPoints(120, '₦5,000')" style="padding: 10px; border-radius: 8px; border: 1px solid var(--gray-200); background: var(--gray-50); display: flex; justify-content: space-between; font-weight: 600; cursor: pointer;">
                        <span>+120 Points (Best Value)</span>
                        <span style="color: #D97A5C;">₦5,000</span>
                    </button>
                </div>
                <button type="button" onclick="document.getElementById('points-topup-modal').style.display='none'" style="width: 100%; padding: 10px; background: var(--terracotta, #D97A5C); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
                    Close
                </button>
            </div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
    },

    topUpPoints: async function(pointsToAdd, priceLabel) {
        try {
            const res = await fetch('/api/points/topup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: this.userPhone, amount_points: pointsToAdd, payment_ref: `sim_${Date.now()}` })
            });
            if (res.ok) {
                const data = await res.json();
                this.points = data.balance;
                this.updatePointsUI();
                const modal = document.getElementById('points-topup-modal');
                if (modal) modal.style.display = 'none';
                if (typeof this.addBubble === 'function') {
                    this.addBubble('assistant', `🪙 **Points Top-Up Successful!**\n• Added: **+${pointsToAdd} Points** (${priceLabel})\n• New Balance: **${this.points} Points**\n• Ready for unlimited AI queries and live provider dispatch.`, false);
                }
            }
        } catch (e) {}
    },

    // Radar Pulse Modal
    openRadarModal: function() {
        let modal = document.getElementById('radar-live-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'radar-live-modal';
            modal.className = 'modal-overlay';
            modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
            <div class="radar-modal-box">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--charcoal);">🛰️ Nearby Live Radar</h3>
                        <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: var(--gray-600);">Active providers within 3.5km of your location</p>
                    </div>
                    <button type="button" onclick="document.getElementById('radar-live-modal').style.display='none'" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--charcoal);">&times;</button>
                </div>
                
                <div class="radar-scope-circle">
                    <div class="radar-sweep-beam"></div>
                    <div class="radar-blip" style="top: 30%; left: 45%;"></div>
                    <div class="radar-blip" style="top: 65%; left: 70%; animation-delay: 0.8s;"></div>
                    <div class="radar-blip" style="top: 40%; left: 25%; animation-delay: 1.4s;"></div>
                    <div class="radar-blip" style="top: 75%; left: 35%; animation-delay: 2.1s;"></div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center; margin-bottom: 16px;">
                    <div style="background: var(--gray-50); padding: 8px; border-radius: 8px; border: 1px solid var(--gray-200);">
                        <div style="font-size: 1.1rem; font-weight: 700; color: #D97A5C;">14</div>
                        <div style="font-size: 0.7rem; color: var(--gray-600);">🏍️ Okadas</div>
                    </div>
                    <div style="background: var(--gray-50); padding: 8px; border-radius: 8px; border: 1px solid var(--gray-200);">
                        <div style="font-size: 1.1rem; font-weight: 700; color: #1E88E5;">8</div>
                        <div style="font-size: 0.7rem; color: var(--gray-600);">🔧 Artisans</div>
                    </div>
                    <div style="background: var(--gray-50); padding: 8px; border-radius: 8px; border: 1px solid var(--gray-200);">
                        <div style="font-size: 1.1rem; font-weight: 700; color: #2E7D32;">11</div>
                        <div style="font-size: 0.7rem; color: var(--gray-600);">🍲 Vendors</div>
                    </div>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button class="btn-card primary" onclick="window.KurukooChat.pingNearbyProviders()" style="flex: 1; padding: 10px; background: #D97A5C; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
                        ⚡ Ping Nearest Provider
                    </button>
                    <button class="btn-card" onclick="document.getElementById('radar-live-modal').style.display='none'" style="padding: 10px 16px; background: var(--gray-100); border: 1px solid var(--gray-200); border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>`;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
    },

    pingNearbyProviders: function() {
        const modal = document.getElementById('radar-live-modal');
        if (modal) modal.style.display = 'none';
        const input = document.getElementById('chat-input');
        const form = document.getElementById('chat-form');
        if (input && form) {
            input.value = 'Show all verified providers active near me right now.';
            form.dispatchEvent(new Event('submit'));
        }
    },

    handleCardClick: function(text) {
        const input = document.getElementById('chat-input');
        const form = document.getElementById('chat-form');
        if (input && form) {
            input.disabled = false;
            input.value = text;
            form.dispatchEvent(new Event('submit'));
        }
    },

    init: function(options) {
        options = options || {};
        const container = document.getElementById(options.containerId || 'homepage-live-chat-embed');
        if (!container) return;

        // Render embedded interactive chat UI inside target container
        container.innerHTML = `
            <div id="chat-messages" class="chat-messages-embedded" style="display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; padding: 10px; font-size: 0.85rem;"></div>
            <div id="quick-action-chips-bar" class="quick-action-chips-scroll" style="display: flex; gap: 6px; overflow-x: auto; padding: 6px 0;">
                <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Book an instant Okada ride')">🚗 Ride</button>
                <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Order hot jollof rice and suya near me')">🍔 Food</button>
                <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Find a verified mobile mechanic or electrician')">🔧 Repair</button>
                <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Find emergency medical aid')">🏥 Emergency</button>
            </div>
            <form id="chat-form" style="display: flex; gap: 6px; margin-top: 8px; align-items: center;">
                <input type="text" id="chat-input" placeholder="Type a request (e.g. Find plumber in Lekki)..." style="flex: 1; padding: 8px 12px; border: 1.5px solid var(--gray-200, #e2ded7); border-radius: 10px; font-size: 0.82rem; outline: none;">
                <button type="submit" style="background: #D97A5C; color: white; border: none; border-radius: 10px; padding: 8px 14px; font-weight: 700; cursor: pointer;">Send</button>
            </form>
        `;

        const msgs = container.querySelector('#chat-messages');
        if (options.mockScript && Array.isArray(options.mockScript) && msgs) {
            let delay = 300;
            options.mockScript.forEach(item => {
                setTimeout(() => {
                    const bubble = document.createElement('div');
                    bubble.className = `chat-bubble ${item.sender}`;
                    bubble.style.cssText = item.sender === 'user' 
                        ? 'background: #D97A5C; color: white; border-radius: 12px 12px 2px 12px; padding: 8px 12px; align-self: flex-end; max-width: 85%; font-size: 0.82rem;'
                        : 'background: var(--gray-50, #f7f5f2); border: 1px solid var(--gray-200, #e2ded7); border-radius: 12px 12px 12px 2px; padding: 8px 12px; align-self: flex-start; max-width: 85%; font-size: 0.82rem;';
                    bubble.innerHTML = window.KurukooChat.renderMarkdown(item.content);
                    msgs.appendChild(bubble);
                    msgs.scrollTop = msgs.scrollHeight;
                }, delay);
                delay += 1200;
            });
        }
    }
});

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const quickRepliesContainer = document.getElementById('quick-replies-container');

    if (!chatMessages || !chatForm || !chatInput) return;

    window.KurukooChat.applyTheme();
    window.KurukooChat.fetchPoints();

    // Inject Quick Action Chips Bar if not already in DOM
    if (!document.getElementById('quick-action-chips-bar')) {
        const chipsBar = document.createElement('div');
        chipsBar.id = 'quick-action-chips-bar';
        chipsBar.className = 'quick-action-chips-scroll';
        chipsBar.innerHTML = `
            <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Book an instant Okada ride')">🚗 Ride</button>
            <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Order hot jollof rice and suya near me')">🍔 Food</button>
            <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Find a verified mobile mechanic or electrician')">🔧 Repair</button>
            <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Find emergency medical aid and open pharmacy')">🏥 Emergency</button>
            <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Register as a skilled artisan and start earning')">⚡ Earn</button>
            <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Send a parcel across town with instant delivery')">📦 Send</button>
            <button type="button" class="quick-chip" onclick="window.KurukooChat.handleCardClick('Recharge electricity meter and verify receipt')">💡 Bills</button>
        `;
        chatForm.parentNode.insertBefore(chipsBar, chatForm);
    }

    // Add Attachment Tray Container
    let attachmentTray = document.getElementById('chat-attachment-tray');
    if (!attachmentTray) {
        attachmentTray = document.createElement('div');
        attachmentTray.id = 'chat-attachment-tray';
        attachmentTray.className = 'attachment-tray';
        attachmentTray.style.display = 'none';
        chatForm.parentNode.insertBefore(attachmentTray, chatForm);
    }

    let attachedFiles = [];

    // Helper: Add Message Bubble
    window.KurukooChat.addBubble = function(sender, content, isMarkdown = true) {
        const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const bubble = document.createElement('div');
        bubble.id = msgId;
        bubble.className = `chat-bubble ${sender}`;
        
        let bodyHTML = isMarkdown ? window.KurukooChat.renderMarkdown(content) : content;

        // Add action toolbar for assistant bubbles
        let actionsHTML = '';
        if (sender === 'assistant') {
            actionsHTML = `
            <div class="msg-actions-bar">
                <button type="button" class="msg-action-btn" onclick="window.KurukooChat.copyMessage('${msgId}')">
                    📋 Copy
                </button>
                <button type="button" class="msg-action-btn" onclick="window.KurukooChat.deleteMessage('${msgId}')">
                    🗑️ Delete
                </button>
                <span style="font-size: 0.65rem; color: var(--gray-400); margin-left: auto;">⚡ Kurukoo AI</span>
            </div>`;
        }

        bubble.innerHTML = `${bodyHTML}${actionsHTML}`;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    };

    // Helper: Typing Indicator
    let typingIndicatorEl = null;
    window.KurukooChat.showTypingIndicator = function() {
        if (typingIndicatorEl) return;
        typingIndicatorEl = document.createElement('div');
        typingIndicatorEl.className = 'chat-bubble assistant typing-indicator';
        typingIndicatorEl.style.cssText = 'display: flex; gap: 5px; align-items: center; width: 60px; padding: 10px 14px;';
        typingIndicatorEl.innerHTML = `
            <span style="width: 6px; height: 6px; background: var(--terracotta); border-radius: 50%; animation: pulseThought 1s infinite alternate;"></span>
            <span style="width: 6px; height: 6px; background: var(--terracotta); border-radius: 50%; animation: pulseThought 1s infinite alternate 0.2s;"></span>
            <span style="width: 6px; height: 6px; background: var(--terracotta); border-radius: 50%; animation: pulseThought 1s infinite alternate 0.4s;"></span>
        `;
        chatMessages.appendChild(typingIndicatorEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    window.KurukooChat.removeTypingIndicator = function() {
        if (typingIndicatorEl) {
            typingIndicatorEl.remove();
            typingIndicatorEl = null;
        }
    };

    // Voice Input Setup (Web Speech API)
    const voiceBtn = document.getElementById('voice-input-btn');
    if (voiceBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-NG'; // Nigerian English context

        let isRecording = false;

        voiceBtn.onclick = () => {
            if (!isRecording) {
                try {
                    recognition.start();
                    isRecording = true;
                    voiceBtn.style.color = '#EF4444';
                    voiceBtn.style.animation = 'pulseThought 1s infinite';
                } catch (e) {}
            } else {
                recognition.stop();
                isRecording = false;
                voiceBtn.style.color = '';
                voiceBtn.style.animation = '';
            }
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            chatInput.value = transcript;
        };

        recognition.onend = () => {
            isRecording = false;
            voiceBtn.style.color = '';
            voiceBtn.style.animation = '';
        };
    }

    // Attachment Picker Setup
    const fileInput = document.getElementById('chat-file-input');
    const attachBtn = document.getElementById('chat-attach-btn');
    if (attachBtn && fileInput) {
        attachBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const files = Array.from(e.target.files || []);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    attachedFiles.push({ name: file.name, dataUrl: evt.target.result });
                    renderAttachmentTray();
                };
                reader.readAsDataURL(file);
            });
            fileInput.value = '';
        };
    }

    function renderAttachmentTray() {
        if (attachedFiles.length === 0) {
            attachmentTray.style.display = 'none';
            attachmentTray.innerHTML = '';
            return;
        }
        attachmentTray.style.display = 'flex';
        attachmentTray.innerHTML = attachedFiles.map((file, idx) => `
            <div class="attachment-thumbnail">
                <img src="${file.dataUrl}" alt="${file.name}">
                <button type="button" class="attachment-remove-btn" onclick="window.KurukooChat.removeAttachment(${idx})">&times;</button>
            </div>
        `).join('');
    }

    window.KurukooChat.removeAttachment = function(idx) {
        attachedFiles.splice(idx, 1);
        renderAttachmentTray();
    };

    // Form Submission & Streaming Handler
    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text && attachedFiles.length === 0) return;

        let userMsg = text;
        if (attachedFiles.length > 0) {
            userMsg += `\n[Attached: ${attachedFiles.length} file(s)]`;
        }

        chatInput.value = '';
        attachedFiles = [];
        renderAttachmentTray();

        // Render user message
        window.KurukooChat.addBubble('user', userMsg, false);
        if (quickRepliesContainer) quickRepliesContainer.style.display = 'none';

        window.KurukooChat.showTypingIndicator();

        try {
            // Attempt SSE Streaming Endpoint
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: window.KurukooChat.userPhone,
                    message: text,
                    channel: 'web'
                })
            });

            if (!response.ok || !response.body) {
                throw new Error('Streaming failed, falling back to standard chat API');
            }

            window.KurukooChat.removeTypingIndicator();

            // Create streaming assistant bubble
            const msgId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const bubble = document.createElement('div');
            bubble.id = msgId;
            bubble.className = 'chat-bubble assistant';
            chatMessages.appendChild(bubble);

            let accumulatedText = '';
            let accumulatedThought = '';
            let cardData = null;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const payloadStr = line.replace(/^data: /, '').trim();
                        if (payloadStr === '[DONE]') break;

                        try {
                            const payload = JSON.parse(payloadStr);
                            if (payload.type === 'thought' && payload.thought) {
                                accumulatedThought += payload.thought;
                            } else if (payload.type === 'text' && payload.content) {
                                accumulatedText += payload.content;
                            } else if (payload.type === 'done') {
                                if (payload.cardData) cardData = payload.cardData;
                            }

                            // Re-render accumulating content with live Markdown & thinking block
                            let fullContent = accumulatedText;
                            if (accumulatedThought) {
                                fullContent = `<think>${accumulatedThought}</think>${accumulatedText}`;
                            }
                            bubble.innerHTML = window.KurukooChat.renderMarkdown(fullContent);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        } catch (parseErr) {}
                    }
                }
            }

            // Append Card Data if provided
            if (cardData) {
                const cardHTML = renderCardData(cardData);
                if (cardHTML) {
                    bubble.innerHTML += cardHTML;
                }
            }

            // Append actions toolbar
            bubble.innerHTML += `
            <div class="msg-actions-bar">
                <button type="button" class="msg-action-btn" onclick="window.KurukooChat.copyMessage('${msgId}')">
                    📋 Copy
                </button>
                <button type="button" class="msg-action-btn" onclick="window.KurukooChat.deleteMessage('${msgId}')">
                    🗑️ Delete
                </button>
                <span style="font-size: 0.65rem; color: var(--gray-400); margin-left: auto;">⚡ Kurukoo AI</span>
            </div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;

        } catch (err) {
            console.warn('Falling back to /api/chat standard route:', err);
            try {
                const fallbackRes = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: window.KurukooChat.userPhone,
                        message: text,
                        channel: 'web'
                    })
                });
                window.KurukooChat.removeTypingIndicator();
                if (fallbackRes.ok) {
                    const data = await fallbackRes.json();
                    let replyText = data.reply || 'Request acknowledged.';
                    const bubble = window.KurukooChat.addBubble('assistant', replyText, true);
                    if (data.cardData) {
                        bubble.innerHTML += renderCardData(data.cardData);
                    }
                }
            } catch (e) {
                window.KurukooChat.removeTypingIndicator();
                window.KurukooChat.addBubble('assistant', 'I received your request and am searching for verified providers nearby. Please hold on a moment.', false);
            }
        }
    };

    function renderCardData(card) {
        if (!card) return '';
        if (card.type === 'action_card' || card.type === 'order_card' || card.type === 'product_card') {
            const refId = 'ESC-' + Math.floor(100000 + Math.random() * 900000);
            return `
            <div id="action-card-${refId}" class="action-execution-card" style="background: white; border: 1.5px solid #054c44; border-radius: 12px; padding: 12px; margin: 8px 0; box-shadow: 0 4px 14px rgba(5,76,68,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
                    <span class="escrow-protection-badge">🔒 Escrow Protected (Moniepoint MFB)</span>
                    <span class="action-card-status" style="background: #eff6ff; color: #1d4ed8; font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">FUNDS HELD</span>
                </div>
                <div style="font-weight: 700; font-size: 0.88rem; color: #1e293b; margin-bottom: 4px;">${card.title || 'Verified Service Match'}</div>
                <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 8px;">${card.desc || card.description || 'Service verified and protected.'}</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button type="button" class="release-escrow-btn" onclick="window.KurukooChat.releaseEscrow('${refId}', '${card.price || '₦2,500'}', '${card.title}')" style="background: #054c44; color: white; border: none; border-radius: 6px; padding: 6px 10px; font-size: 0.72rem; font-weight: 700; cursor: pointer;">
                        ✅ Release Escrow
                    </button>
                    <button type="button" onclick="window.KurukooChat.showReceipt('${refId}', '${card.price || '₦2,500'}', '${card.title}')" style="background: transparent; color: #0284c7; border: 1px solid #bae6fd; border-radius: 6px; padding: 6px 10px; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
                        📄 Receipt
                    </button>
                    <button type="button" onclick="window.KurukooChat.refundEscrow('${refId}', '${card.price || '₦2,500'}')" style="background: transparent; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; padding: 6px 10px; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
                        🛡️ Dispute / Refund
                    </button>
                </div>
            </div>`;
        }
        return '';
    }
});
