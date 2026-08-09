window.KurukooChat = Object.assign(window.KurukooChat || {}, {
    initComplete: true,
    handleCardClick: function(messageText) {
        const input = document.getElementById('chat-input');
        const form = document.getElementById('chat-form');
        const qrContainer = document.getElementById('quick-replies-container');
        if (input && form) {
            input.disabled = false;
            input.value = messageText;
            if (qrContainer) qrContainer.style.display = 'none';
            form.dispatchEvent(new Event('submit'));
        }
    },
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
        if (typeof window.KurukooChat.addBubble === 'function') {
            window.KurukooChat.addBubble('assistant', `🎉 *Escrow Funds Released!*
• **Settlement Reference**: \`STL-${refId}\`
• **Amount Disbursed**: **${amount}** to **${providerName || 'Provider'}**
• **Moniepoint Custody Status**: Released & Settled
• **Audit Time**: ${new Date().toLocaleTimeString()}

Thank you for confirming completion! Your transaction receipt is permanently saved to your profile.`, false);
        }
    },
    trackTelemetry: function(refId, operatorName) {
        if (typeof window.KurukooChat.addBubble === 'function') {
            const telemetryHTML = `
            <div style="background: #0f172a; color: white; border-radius: 12px; padding: 10px 12px; font-family: 'Space Grotesk', sans-serif; margin: 4px 0; border: 1px solid rgba(217, 122, 92, 0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.68rem; color: #38bdf8;">
                    <span>🛰️ LIVE GPS TELEMETRY PUSH</span>
                    <span style="background: #0369a1; color: white; padding: 1px 5px; border-radius: 4px; font-size: 0.6rem;">ACTIVE</span>
                </div>
                <div style="font-size: 0.78rem; font-weight: 700; color: #f8fafc; margin-bottom: 4px;">Operator: ${operatorName || 'Amos Kolawole'}</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 0.68rem; color: #cbd5e1; margin-bottom: 6px;">
                    <div>📍 <strong>Waypoint:</strong> Sector 3 (320m)</div>
                    <div>⏱️ <strong>ETA:</strong> 3 mins 15s</div>
                    <div>⚡ <strong>Speed:</strong> 28 km/h</div>
                    <div>🔋 <strong>Device:</strong> 91% GPS lock</div>
                </div>
                <div style="background: #1e293b; border-radius: 6px; height: 6px; overflow: hidden; position: relative;">
                    <div style="background: #10B981; width: 75%; height: 100%; border-radius: 6px; animation: telemetryPulse 2s infinite;"></div>
                </div>
            </div>
            `;
            window.KurukooChat.addBubble('assistant', telemetryHTML, false);
        }
    },
    showReceipt: function(refId, amount, serviceName) {
        if (typeof window.KurukooChat.addBubble === 'function') {
            const receiptHTML = `
            <div style="background: white; border: 1px dashed #64748b; border-radius: 10px; padding: 10px 12px; font-family: monospace; font-size: 0.72rem; color: #1e293b; margin: 4px 0;">
                <div style="text-align: center; font-weight: 800; font-size: 0.8rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">KURUKOO OS TRANSACTION RECEIPT</div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>TX REF:</span><span>${refId}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>ITEM:</span><span>${serviceName || 'Autonomous Task'}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>TOTAL ESCROW:</span><span style="font-weight: 700;">${amount}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>ESCROW VAULT:</span><span>Moniepoint MFB</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;"><span>STATUS:</span><span style="color: #137333; font-weight: 700;">VERIFIED / HELD</span></div>
                <div style="border-top: 1px dashed #cbd5e1; margin-top: 4px; padding-top: 4px; text-align: center; font-size: 0.62rem; color: #64748b;">Cryptographically Signed by Kurukoo Trust Ledger</div>
            </div>
            `;
            window.KurukooChat.addBubble('assistant', receiptHTML, false);
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
        if (typeof window.KurukooChat.addBubble === 'function') {
            window.KurukooChat.addBubble('assistant', `🛡️ *Escrow Hold Cancelled & Refunded!*
• **Reference**: \`${refId}\`
• **Refunded Amount**: **${amount}**
• **Destination**: Credited immediately back to your Kurukoo / Moniepoint Wallet
• **Deductions**: ₦0.00 (100% Zero-Penalty Guarantee)`, false);
        }
    },
    runScenario: function(scenarioKey) {
        if (typeof this.addBubble !== 'function') return;
        
        const scenarios = {
            suya: {
                userPrompt: "Send 5 sticks of suya & masa to Ikeja with instant delivery.",
                steps: [
                    {
                        stepId: "step-intent",
                        bubbleText: "⚙️ *Analyzing Intent & Entities...*\n• Extraction: `item = suya`, `qty = 5 sticks`, `location = Ikeja`, `mode = instant`.\n• Pidgin/Slang parsed successfully via FastText.",
                    },
                    {
                        stepId: "step-memory",
                        bubbleText: "🧠 *Consulting Living Memory...*\n• Profile retrieved for user.\n• Preference loaded: *'Prefers extra pepper & onions'* from past Surulere suya orders.\n• Target LGA contextualised: Ikeja, Lagos.",
                    },
                    {
                        stepId: "step-match",
                        bubbleText: "🔍 *Matching Catalog & Workers...*\n• 3 verified suya vendors matched near Ikeja.\n• Selected: *Iya Yusuf Suya & Masa Corner* (1.2km away).\n• Driver matched: *Suleiman Okada* (4.9★, 450 completed trips).",
                    },
                    {
                        stepId: "step-escrow",
                        bubbleText: "🔒 *Securing Escrow Protection...*\n• Total: ₦2,500 held in secure Moniepoint escrow.\n• Split: ₦2,125 to Vendor, ₦375 Platform fee.\n• Escrow release triggered on buyer QR check-in.",
                    },
                    {
                        stepId: "step-dispatch",
                        bubbleText: "🏍️ *Dispatching Okada Rider...*\n• Suleiman accepted part dispatch and is at Iya Yusuf's stand.\n• Status: Order packaging. ETA to Ikeja: *8 minutes*.\n• Live tracking link dispatched.",
                    }
                ]
            },
            car_parts: {
                userPrompt: "Find an original Toyota Corolla 2012 brake pad & dispatch mechanic.",
                steps: [
                    {
                        stepId: "step-intent",
                        bubbleText: "⚙️ *Analyzing Intent & Entities...*\n• Extraction: `part = brake pad`, `model = Corolla 2012`, `artisan = mechanic`.\n• Complex multi-leg intent extracted successfully.",
                    },
                    {
                        stepId: "step-memory",
                        bubbleText: "🧠 *Consulting Living Memory...*\n• Retreived vehicle context from profile history.\n• Verified compatibility: OEM part required for model VIN ending in *748A*.",
                    },
                    {
                        stepId: "step-match",
                        bubbleText: "🔍 *Matching Catalog & Workers...*\n• Checked Ladipo spare parts database.\n• Selected part: *Oando Auto Spars* (₦14,000, 100% genuine).\n• Mechanic matched: *Chidi Mobile Mechanic* (4.8★, certified).",
                    },
                    {
                        stepId: "step-escrow",
                        bubbleText: "🔒 *Securing Escrow Protection...*\n• Total: ₦19,000 held in Moniepoint escrow (₦14k part + ₦5k labor).\n• Escrow locked. Funds protected under Kurukoo Guarantee.",
                    },
                    {
                        stepId: "step-dispatch",
                        bubbleText: "🛠️ *Dispatching Mechanic...*\n• Chidi has retrieved the part from Oando Auto.\n• Chidi is mobile and heading to your breakdown GPS coordinate.\n• ETA: *12 minutes*.",
                    }
                ]
            },
            security: {
                userPrompt: "Book 2 verified security escorts for an event this Saturday.",
                steps: [
                    {
                        stepId: "step-intent",
                        bubbleText: "⚙️ *Analyzing Intent & Entities...*\n• Extraction: `service = security escorts`, `qty = 2`, `duration = day-basis (Saturday)`.\n• Validated against licensed close protection protocols.",
                    },
                    {
                        stepId: "step-memory",
                        bubbleText: "🧠 *Consulting Living Memory...*\n• Identity checks (BVN / NIN) confirmed in user profile history.\n• Premium corporate service tier activated.",
                    },
                    {
                        stepId: "step-match",
                        bubbleText: "🔍 *Matching Catalog & Workers...*\n• Contacted security agency partner: *GuardForce Ltd* (Fully licensed).\n• Assigned escorts: *Officer Aliyu* and *Officer John* (Ex-service, vetted).",
                    },
                    {
                        stepId: "step-escrow",
                        bubbleText: "🔒 *Securing Escrow Protection...*\n• Total: ₦40,000 held in Moniepoint escrow.\n• Released automatically post-event upon QR code checkout scan.",
                    },
                    {
                        stepId: "step-dispatch",
                        bubbleText: "🛡️ *Booking Locked & Confirmed!*\n• Escorts dispatched. Contact info, badges, and licensing paperwork sent to your email.\n• Status: Vetted close protection active.",
                    }
                ]
            },
            diaspora: {
                userPrompt: "Pay my family's electricity bill in Enugu and verify meter receipt.",
                steps: [
                    {
                        stepId: "step-intent",
                        bubbleText: "⚙️ *Analyzing Intent & Entities...*\n• Extraction: `service = electricity bill`, `utility = EEDC Enugu`, `amount = £25 equivalent`.\n• Cross-border diaspora rail triggered.",
                    },
                    {
                        stepId: "step-memory",
                        bubbleText: "🧠 *Consulting Living Memory...*\n• Retreived Enugu family meter details: *Meter No 4400128372*.\n• Last payment: July 15 (₦45,000). Registered beneficiary match.",
                    },
                    {
                        stepId: "step-match",
                        bubbleText: "🔍 *Connecting API Gateways...*\n• Queried EEDC Enugu utility portal.\n• Stripe FX rate confirmed: £25.00 -> ₦50,000.\n• Gateway status: Live, 100% route success.",
                    },
                    {
                        stepId: "step-escrow",
                        bubbleText: "🔒 *Processing Escrow Split...*\n• ₦48,500 payload locked for utility delivery.\n• 3% coordination fee (₦1,500) locked to platform split.",
                    },
                    {
                        stepId: "step-dispatch",
                        bubbleText: "✅ *Bill Settled & Verified...*\n• Electricity meter recharged successfully.\n• Token sent to Enugu family: *882*192*01*4829*1028#.\n• Receipt PDF delivered to family WhatsApp & Enugu email.",
                    }
                ]
            }
        };

        const scenario = scenarios[scenarioKey];
        if (!scenario) return;

        // Reset chat messages
        const chatMsgs = document.getElementById('chat-messages');
        if (chatMsgs) chatMsgs.innerHTML = '';

        // Reset Teardown Box styles
                step.style.transform = 'none';
                const stepNum = step.querySelector('.step-num');
                if (stepNum) {
                    stepNum.style.background = '#e2e8f0';
                    stepNum.style.color = '#64748b';
                }
            });
        }

        // Add user bubble
        this.addBubble('user', scenario.userPrompt, false);
        this.showTypingIndicator();

        let currentStep = 0;
        const runNextStep = () => {
            if (currentStep < scenario.steps.length) {
                const stepData = scenario.steps[currentStep];
                this.removeTypingIndicator();
                this.addBubble('assistant', stepData.bubbleText, false);
                
                // Highlight step in Teardown Timeline

                currentStep++;
                if (currentStep < scenario.steps.length) {
                    this.showTypingIndicator();
                    setTimeout(runNextStep, 2200);
                } else {
                    this.removeTypingIndicator();
                    const refId = 'ESC-' + Math.floor(100000 + Math.random() * 900000);
                    let rate = scenarioKey === 'suya' ? '₦2,500' : scenarioKey === 'car_parts' ? '₦19,000' : scenarioKey === 'security' ? '₦40,000' : '£25';
                    let operator = scenarioKey === 'suya' ? 'Suleiman Okada' : scenarioKey === 'car_parts' ? 'Chidi Mechanic' : scenarioKey === 'security' ? 'Officer Aliyu' : 'EEDC Enugu Rail';
                    
                    const actionCardHTML = `
                    <div id="action-card-${refId}" class="action-execution-card" style="background: white; border: 1.5px solid #054c44; border-radius: 12px; padding: 10px 12px; margin: 8px 0; box-shadow: 0 4px 14px rgba(5,76,68,0.08); font-family: 'Space Grotesk', sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
                            <span style="font-size: 0.72rem; font-weight: 700; color: #054c44; display: flex; align-items: center; gap: 4px;">
                                🔒 <span>SMART ESCROW ACTION</span>
                            </span>
                            <span class="action-card-status" style="font-size: 0.62rem; background: #e6f4ea; color: #137333; font-weight: 700; padding: 2px 6px; border-radius: 6px;">HOLD ACTIVE</span>
                        </div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: #1E1E1E;">${rate} held safely in Moniepoint Vault</div>
                        <div style="font-size: 0.68rem; color: #64748b; margin: 2px 0 8px 0;">Ref: #${refId} • Assigned: ${operator} (4.9★)</div>
                        <div class="action-card-buttons" style="display: flex; flex-wrap: wrap; gap: 6px;">
                            <button type="button" class="release-escrow-btn" onclick="window.KurukooChat.releaseEscrow('${refId}', '${rate}', '${operator}')" style="background: #054c44; color: white; border: none; border-radius: 6px; padding: 5px 10px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                                ✅ Release Escrow
                            </button>
                            <button type="button" class="track-telemetry-btn" onclick="window.KurukooChat.trackTelemetry('${refId}', '${operator}')" style="background: #FFF8F0; color: #D97A5C; border: 1px solid #D97A5C; border-radius: 6px; padding: 5px 10px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                                📍 Live Telemetry
                            </button>
                            <button type="button" class="receipt-btn" onclick="window.KurukooChat.showReceipt('${refId}', '${rate}', '${scenario.userPrompt}')" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 10px; font-size: 0.7rem; font-weight: 600; cursor: pointer;">
                                📄 Receipt
                            </button>
                            <button type="button" class="dispute-btn" onclick="window.KurukooChat.refundEscrow('${refId}', '${rate}')" style="background: transparent; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; padding: 5px 8px; font-size: 0.68rem; font-weight: 600; cursor: pointer;">
                                🛡️ Refund / Cancel
                            </button>
                        </div>
                    </div>
                    `;
                    this.addBubble('assistant', actionCardHTML, false);
                }
            }
        };

        setTimeout(runNextStep, 1200);
    },
    init: function(options = {}) {
        const containerId = options.containerId;
        const initialMessage = options.initialMessage || '';
        const mode = options.mode || 'standard';

        let userPhone = localStorage.getItem('kurukoo_user_phone') || '';
        let tempSessionId = localStorage.getItem('kurukoo_temp_session_id') || ('sess_' + Math.random().toString(36).substring(2, 11));
        localStorage.setItem('kurukoo_temp_session_id', tempSessionId);
        
        let isAnonymous = !userPhone;
        let flowState = localStorage.getItem('kurukoo_flow_state') || 'demo'; 
        let userName = localStorage.getItem('kurukoo_user_name') || '';
        let exchangeCount = parseInt(localStorage.getItem('kurukoo_exchange_count') || '0', 10);
        let awaitingConfirmation = false;
        let pendingPhone = '';

        const container = containerId ? document.getElementById(containerId) : document.body;
        if (!container) return;

        const chatHTML = `
                <div id="chat-container-main" class="chat-container">
                    <div class="chat-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="chat-avatar" style="background: #D97A5C; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">
                                <img src="/assets/brand/logo-icon.svg" alt="Kurukoo Agent" style="width: 20px; height: 20px; object-fit: contain;" />
                            </div>
                            <div style="text-align: left;">
                                <div style="font-weight: 800; font-family: 'Space Grotesk', sans-serif; font-size: 0.88rem; color: #3D352E; line-height: 1.2;">Kurukoo Agent</div>
                                <div style="font-size: 0.65rem; color: #10B981; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-top: 1px;">
                                    <span style="width: 6px; height: 6px; background: #10B981; border-radius: 50%; display: inline-block;"></span> Active now
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-left: auto;" id="auth-badge-container">
                            <!-- Store Icon -->
                            <a href="/explore" style="background: none; border: none; padding: 4px; cursor: pointer; color: #5c524a; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; border-radius: 50%; width: 28px; height: 28px;" title="Store" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='none'">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M12 17V12"/></svg>
                            </a>
                            <!-- Cart Icon -->
                            <a href="/cart" style="background: none; border: none; padding: 4px; cursor: pointer; color: #5c524a; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; border-radius: 50%; width: 28px; height: 28px; position: relative;" title="Cart" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='none'">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                            </a>
                            <!-- Call Icon -->
                            <a href="tel:+2347000000000" style="background: none; border: none; padding: 4px; cursor: pointer; color: #5c524a; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; border-radius: 50%; width: 28px; height: 28px;" title="Call Support" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='none'">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-phone"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </a>
                            <!-- Delete History Icon -->
                            <button type="button" onclick="window.KurukooChat.confirmClearHistory()" style="background: none; border: none; padding: 4px; cursor: pointer; color: #dc2626; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; border-radius: 50%; width: 28px; height: 28px;" title="Clear Chat History" onmouseover="this.style.background='rgba(220,38,38,0.1)'" onmouseout="this.style.background='none'">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                        </div>
                    </div>
                    <div id="chat-messages" class="chat-messages"></div>
                    <div id="quick-replies-container" class="quick-replies-container" style="display: none;"></div>
                    
                    <!-- Persistent in-chat menus (Standard Chat UX) -->
                    <div id="quick-replies-bar">
                        <button type="button" class="quick-reply-pill" onclick="window.KurukooChat.handleCardClick('Contact Support Chat')">💬 Support Chat</button>
                        <button type="button" class="quick-reply-pill" onclick="window.KurukooChat.handleCardClick('Request a Ride')">🚗 Request a Ride</button>
                        <button type="button" class="quick-reply-pill" onclick="window.KurukooChat.viewOrderHistory()">📦 Past Orders</button>
                        <a href="/help" target="_blank" class="quick-reply-pill">📖 Help Centre</a>
                    </div>

                    <!-- Chat Form (matching standard UX) -->
                    <form id="chat-form" class="chat-form">
                        <button type="button" class="voice-btn" id="voice-trigger" title="Voice Input">🎤</button>
                        <input type="text" id="chat-input" class="chat-input" placeholder="Message Kurukoo..." autocomplete="off" disabled>
                        <button type="submit" class="send-btn" title="Send message">➔</button>
                    </form>
                </div>
        `;

        container.innerHTML = chatHTML;

        // Setup Active AI Brain Selector Pills
        let preferredAIProvider = localStorage.getItem('kurukoo_preferred_ai_provider') || 'auto';

        const chatMessages = document.getElementById('chat-messages');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const quickRepliesContainer = document.getElementById('quick-replies-container');
        
        let demoTimer = null;

        function addBubble(sender, content, save = true) {
            const bubble = document.createElement('div');
            bubble.className = `message-bubble ${sender === 'user' ? 'user' : 'bot'}`;
            
            const now = new Date();
            const timestamp = isNaN(now.getTime()) ? '' : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            if (content.includes('[PRODUCTS_4X4]')) {
                // Render interactive product cards
                bubble.style.background = 'none';
                bubble.style.padding = '0';
                bubble.style.boxShadow = 'none';
                bubble.style.maxWidth = '100%';
                bubble.style.width = '100%';
                bubble.style.alignSelf = 'stretch';
                
                let sliderHTML = `
                <div class="inline-cards-slider">
                    <div class="inline-card" onclick="window.KurukooChat.handleCardClick('Order fresh oranges Nigeria')">
                        <img src="https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=150&q=80" class="inline-card-img" alt="Fresh Oranges">
                        <div class="inline-card-title">Fresh Oranges</div>
                        <div class="inline-card-provider">Mama Ngozi (Hawker)</div>
                        <div class="inline-card-price">₦500 / bag</div>
                    </div>
                    <div class="inline-card" onclick="window.KurukooChat.handleCardClick('I need Chidi the Plumber')">
                        <img src="https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=150&q=80" class="inline-card-img" alt="Plumbing">
                        <div class="inline-card-title">Plumbing Fix</div>
                        <div class="inline-card-provider">Chidi (Plumber)</div>
                        <div class="inline-card-price">₦5,000</div>
                    </div>
                    <div class="inline-card" onclick="window.KurukooChat.handleCardClick('Request ride to Ikeja Mall')">
                        <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=150&q=80" class="inline-card-img" alt="Okada Ride">
                        <div class="inline-card-title">Ikeja Express Okada</div>
                        <div class="inline-card-provider">Suleiman (Rider)</div>
                        <div class="inline-card-price">₦1,200</div>
                    </div>
                    <div class="inline-card" onclick="window.KurukooChat.handleCardClick('Quick House Cleaning service')">
                        <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80" class="inline-card-img" alt="Cleaning">
                        <div class="inline-card-title">Quick Home Cleaning</div>
                        <div class="inline-card-provider">Grace (Cleaner)</div>
                        <div class="inline-card-price">₦8,000</div>
                    </div>
                </div>
                `;
                bubble.innerHTML = sliderHTML;
            } else {
                bubble.innerHTML = `${content} <div style="font-size: 0.6rem; opacity: 0.7; margin-top: 4px; text-align: ${sender === 'user' ? 'right' : 'left'}">${timestamp}</div>`;
            }
            chatMessages.appendChild(bubble);
            scrollToBottom();
            
            if (save && isAnonymous && flowState !== 'demo') {
                let msgs = JSON.parse(localStorage.getItem('kurukoo_temp_msgs') || '[]');
                msgs.push({ sender, content });
                localStorage.setItem('kurukoo_temp_msgs', JSON.stringify(msgs));
            }
        }

        function showTypingIndicator() {
            const typing = document.createElement('div');
            typing.id = 'typing-indicator';
            typing.className = 'message-bubble bot';
            typing.style.cssText = 'font-size: 12px; font-style: italic; color: #888;';
            typing.textContent = 'Kurukoo is typing...';
            chatMessages.appendChild(typing);
            scrollToBottom();
        }

        function removeTypingIndicator() {
            const typing = document.getElementById('typing-indicator');
            if (typing) typing.remove();
        }

        async function loadAuthMessages() {
            chatMessages.innerHTML = '';
            showTypingIndicator();
            try {
                const res = await fetch(`/api/messages?phone=${encodeURIComponent(userPhone)}`);
                const messages = await res.json();
                removeTypingIndicator();
                if (messages && messages.length > 0) {
                    messages.forEach(msg => {
                        addBubble(msg.sender, msg.content, false);
                    });
                } else {
                    addBubble('assistant', 'Ku Kurukoo! Welcome back. How can I help you today?', false);
                }
            } catch (e) {
                removeTypingIndicator();
                console.error('Failed to load authenticated messages:', e);
                addBubble('assistant', 'Ku Kurukoo! Welcome back. How can I help you today?', false);
            }
        }

        async function viewOrderHistory() {
            if (!userPhone) {
                addBubble('assistant', '⚠️ <strong>Order History:</strong> Please link/verify your phone number first to view past orders.', false);
                return;
            }

            showTypingIndicator();
            try {
                const res = await fetch(`/api/orders?phone=${encodeURIComponent(userPhone)}`);
                const orders = await res.json();
                removeTypingIndicator();

                if (!orders || orders.length === 0) {
                    addBubble('assistant', '📦 <strong>Order History:</strong> You have no past orders matching this phone number.', false);
                    return;
                }

                let html = `📦 <strong>Your Purchase History:</strong><div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px; max-width: 100%;">`;
                orders.forEach(order => {
                    const dateStr = new Date(order.created_at || Date.now()).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    const amountMajor = ((order.amount || 0) / 100).toFixed(2);
                    const badgeColor = order.status === 'completed' ? '#10b981' : (order.status === 'escrow_held' ? '#f59e0b' : '#3b82f6');
                    const badgeText = order.status ? order.status.replace('_', ' ').toUpperCase() : 'PENDING';
                    
                    html += `
                    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-family: sans-serif; font-size: 0.8rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); text-align: left; color: #1e293b;">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
                            <span>${order.order_type ? order.order_type.toUpperCase() : 'ORDER'}</span>
                            <span style="background: ${badgeColor}; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px;">${badgeText}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span style="color: #64748b;">Order ID:</span>
                            <span style="font-family: monospace; font-size: 0.75rem; font-weight: 600;">${order.id}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                            <span style="color: #64748b;">Amount:</span>
                            <span style="font-weight: 600; color: #1e293b;">₦${amountMajor}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Date:</span>
                            <span style="color: #475569;">${dateStr}</span>
                        </div>
                    </div>`;
                });
                html += `</div>`;

                addBubble('assistant', html, false);
            } catch (e) {
                removeTypingIndicator();
                console.error('Failed to load order history', e);
                addBubble('assistant', '❌ Failed to load purchase history. Please try again.', false);
            }
        }

        function confirmClearHistory() {
            if (document.getElementById('confirm-clear-dialog')) return;

            const dialog = document.createElement('div');
            dialog.id = 'confirm-clear-dialog';
            dialog.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 10000; transition: all 0.3s ease;';
            
            dialog.innerHTML = `
                <div style="background: #ffffff; width: 85%; max-width: 280px; border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); text-align: center; font-family: 'Space Grotesk', sans-serif;">
                    <div style="background: #fef2f2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto; color: #ef4444;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </div>
                    <h4 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 8px 0;">Delete Message History?</h4>
                    <p style="font-size: 0.78rem; color: #64748b; line-height: 1.4; margin: 0 0 16px 0;">This action is permanent and will clear your entire conversation history from the Kurukoo database.</p>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button id="cancel-clear-btn" style="flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; background: #ffffff; color: #475569; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">Cancel</button>
                        <button id="confirm-clear-btn" style="flex: 1; padding: 8px 12px; border: none; background: #ef4444; color: #ffffff; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `;
            
            const chatContainer = document.getElementById('chat-container-main');
            if (chatContainer) {
                chatContainer.appendChild(dialog);
                
                document.getElementById('cancel-clear-btn').onclick = () => {
                    dialog.remove();
                };
                
                document.getElementById('confirm-clear-btn').onclick = async () => {
                    dialog.innerHTML = `
                        <div style="background: #ffffff; width: 85%; max-width: 280px; border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); text-align: center; font-family: 'Space Grotesk', sans-serif;">
                            <div style="border: 3px solid #f3f3f3; border-top: 3px solid #ef4444; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 12px auto;"></div>
                            <p style="font-size: 0.8rem; color: #475569; margin: 0;">Deleting your history...</p>
                        </div>
                    `;
                    
                    try {
                        const targetPhone = userPhone || '+2348030000000';
                        const res = await fetch(`/api/messages?phone=${encodeURIComponent(targetPhone)}`, {
                            method: 'DELETE'
                        });
                        await res.json();
                        
                        dialog.remove();
                        
                        // Clear UI and trigger fresh state
                        chatMessages.innerHTML = '';
                        localStorage.setItem('kurukoo_temp_msgs', '[]');
                        localStorage.setItem('kurukoo_exchange_count', '0');
                        exchangeCount = 0;
                        
                        addBubble('assistant', '🧹 <strong>History Cleared:</strong> Your message history has been completely deleted. How can I assist you with a fresh start?', false);
                    } catch (err) {
                        dialog.remove();
                        console.error('Failed to clear history:', err);
                        addBubble('assistant', '❌ Failed to clear message history. Please try again.', false);
                    }
                };
            }
        }

        window.KurukooChat.loadAuthMessages = loadAuthMessages;
        window.KurukooChat.viewOrderHistory = viewOrderHistory;
        window.KurukooChat.confirmClearHistory = confirmClearHistory;

        window.KurukooChat.addBubble = addBubble;
        window.KurukooChat.showTypingIndicator = showTypingIndicator;
        window.KurukooChat.removeTypingIndicator = removeTypingIndicator;

        function showQuickReplies(replies) {
            quickRepliesContainer.innerHTML = '';
            if (!replies || replies.length === 0) {
                quickRepliesContainer.style.display = 'none';
                return;
            }
            quickRepliesContainer.style.display = 'block';
            replies.forEach(reply => {
                const btn = document.createElement('button');
                btn.style.cssText = 'background: white; border: 1px solid var(--electric-blue, #1E88E5); color: var(--electric-blue, #1E88E5); border-radius: 16px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; margin-right: 8px; transition: all 0.2s ease;';
                btn.textContent = reply;
                btn.onclick = () => {
                    chatInput.value = reply;
                    quickRepliesContainer.style.display = 'none';
                    chatForm.dispatchEvent(new Event('submit'));
                };
                quickRepliesContainer.appendChild(btn);
            });
            scrollToBottom();
        }

        function scrollToBottom() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function runDemo() {
            chatInput.disabled = true;
            chatInput.placeholder = "Demo running...";
            
            // Phase 1: Auto-demo (Concise)
            const script = options.mockScript && options.mockScript.length > 0 ? options.mockScript : [
                { sender: 'assistant', content: 'Ku Kurukoo! Welcome to our hub.' }
            ];

            let step = 0;
            
            function nextStep() {
                if (step < script.length) {
                    addBubble(script[step].sender, script[step].content, false);
                    step++;
                    demoTimer = setTimeout(nextStep, 1000);
                } else {
                    addBubble('assistant', "Ku Kurukoo! 🎉 Want to try it yourself? Type your first name below.", false);
                    chatInput.disabled = false;
                    chatInput.placeholder = "Type your name...";
                    chatInput.focus();
                }
            }
            demoTimer = setTimeout(nextStep, 800);
        }

        async function handlePhase2(text) {
            showTypingIndicator();
            try {
                // Register temp session first
                await fetch('/api/temp/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: tempSessionId, location: 'Ibadan', preferences: {} })
                });

                const preferredAIProvider = localStorage.getItem('kurukoo_preferred_ai_provider') || 'auto';

                // Send message to server temp chat endpoint which runs routeIntent
                const res = await fetch('/api/temp/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: tempSessionId, sender: 'user', content: text, provider: preferredAIProvider })
                });
                const data = await res.json();
                removeTypingIndicator();

                if (data.reply) {
                    addBubble('assistant', data.reply, false);
                    if (data.cardData) {
                        handleCardData(data.cardData);
                    }
                    if (exchangeCount >= 3 && flowState !== 'ask_phone') {
                        flowState = 'ask_phone';
                        localStorage.setItem('kurukoo_flow_state', flowState);
                        setTimeout(() => {
                            addBubble('assistant', 'Need to save this order and earn Points? Enter your phone number to create your Kurukoo profile.', false);
                        }, 500);
                    } else if (flowState === 'ask_phone') {
                        const cleaned = text.replace(/[\s-]/g, '');
                        if (cleaned.length >= 10 && /^[0-9+]+$/.test(cleaned)) {
                            pendingPhone = cleaned;
                            awaitingConfirmation = true;
                            addBubble('assistant', `I sent you a confirmation to ${pendingPhone}. Reply CONFIRM to activate your account.`, false);
                        }
                    }
                } else {
                    addBubble('assistant', 'I received your request. How else can I help?', false);
                }
            } catch (e) {
                removeTypingIndicator();
                console.error('Failed sending anonymous message', e);
                addBubble('assistant', 'Sorry, having trouble connecting.', false);
            }
        }

        async function handleAuthenticated(text) {
            showTypingIndicator();
            try {
                const preferredAIProvider = localStorage.getItem('kurukoo_preferred_ai_provider') || 'auto';
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: userPhone, message: text, provider: preferredAIProvider })
                });
                const data = await res.json();
                removeTypingIndicator();
                if (data.reply) {
                    addBubble('assistant', data.reply, false);
                    if (data.cardData) {
                        handleCardData(data.cardData);
                    }
                }
            } catch (e) {
                removeTypingIndicator();
                console.error('Failed sending auth message', e);
                addBubble('assistant', 'Sorry, having trouble connecting.', false);
            }
        }

        function handleCardData(cardData) {
            if (!cardData) return;
            
            if (cardData.type === 'autonomous_agent_state') {
                const thoughts = cardData.thoughts;
                const category = cardData.category;
                const selectedType = cardData.selectedType;
                const hasAllDetails = cardData.hasAllDetails;
                
                if (thoughts) {
                    const thoughtBubble = document.createElement('div');
                    thoughtBubble.className = 'message-bubble bot';
                    thoughtBubble.style.cssText = 'background: #f1f5f9; border-left: 3px solid #64748b; color: #475569; font-size: 0.78rem; font-style: italic; font-family: "Space Grotesk", sans-serif; padding: 10px 14px; margin: 8px 0; border-radius: 8px; max-width: 85%; box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);';
                    thoughtBubble.innerHTML = `🧠 <strong>Autonomous Thinking Monologue...</strong><br>${thoughts}`;
                    chatMessages.appendChild(thoughtBubble);
                    scrollToBottom();
                }
                
                if (hasAllDetails && selectedType) {
                    runAgenticExecution(category, selectedType);
                } else {
                    if (category === 'ride') {
                        activeState = 'awaiting_ride_type';
                        showQuickReplies(['🏍️ Okada', '🛺 Keke', '🚗 Taxi / Car']);
                    } else if (category === 'food') {
                        activeState = 'awaiting_food_type';
                        showQuickReplies(['🍲 Suya & Masa', '🍚 Rice & Yam Bundle', '🍢 Caterer Platter']);
                    } else if (category === 'artisan') {
                        activeState = 'awaiting_artisan_type';
                        showQuickReplies(['🔧 Mobile Mechanic', '🛡️ Event Security', '⚡ Electricity Bill']);
                    }
                }
            }
        }

        let activeState = 'idle'; // 'idle', 'awaiting_ride_type', 'awaiting_food_type', 'awaiting_artisan_type', 'awaiting_final_confirmation'
        let currentBookingType = '';

        
        async function runAgenticExecution(categoryKey, selectedType, customDetails = {}) {
            currentBookingType = selectedType;
            showTypingIndicator();

            setTimeout(() => {
                removeTypingIndicator();
                addBubble('assistant', `🚀 *Kurukoo Autonomous Engine executing...*

Executing multi-leg matching & escrow lock for **${selectedType}**. Routing across catalog, nearby verified operators, dynamic trust scoring, and Moniepoint escrow vault.`, false);
                
                showTypingIndicator();

                const refId = 'ESC-' + Math.floor(100000 + Math.random() * 900000);
                let rate = customDetails.rate || '₦2,500';
                let operator = customDetails.operator || 'Amos Kolawole';

                if (categoryKey === 'ride') {
                    rate = selectedType === 'Okada' ? '₦500' : selectedType === 'Keke' ? '₦800' : '₦2,000';
                    operator = 'Amos Kolawole (4.9★, 340 trips)';
                } else if (categoryKey === 'food') {
                    rate = selectedType.includes('Suya') ? '₦2,500' : selectedType.includes('Rice') ? '₦12,500' : selectedType.includes('Catfish') ? '₦8,500' : '₦5,000';
                    operator = 'Iya Yusuf Kitchen & Suleiman Delivery';
                } else if (categoryKey === 'finance') {
                    rate = customDetails.rate || '₦50,000';
                    operator = 'Moniepoint MFB Direct Rail';
                } else if (categoryKey === 'courier') {
                    rate = '₦3,500';
                    operator = 'Kazeem Express Courier (4.9★)';
                }
                
                setTimeout(() => {
                    removeTypingIndicator();
                    
                    const actionCardHTML = `
                    <div id="action-card-${refId}" class="action-execution-card" style="background: white; border: 1.5px solid #054c44; border-radius: 12px; padding: 10px 12px; margin: 8px 0; box-shadow: 0 4px 14px rgba(5,76,68,0.08); font-family: 'Space Grotesk', sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
                            <span style="font-size: 0.72rem; font-weight: 700; color: #054c44; display: flex; align-items: center; gap: 4px;">
                                🔒 <span>SMART ESCROW ACTION</span>
                            </span>
                            <span class="action-card-status" style="font-size: 0.62rem; background: #e6f4ea; color: #137333; font-weight: 700; padding: 2px 6px; border-radius: 6px;">HOLD ACTIVE</span>
                        </div>
                        <div style="font-size: 0.8rem; font-weight: 700; color: #1E1E1E;">${rate} held safely in Moniepoint Vault</div>
                        <div style="font-size: 0.68rem; color: #64748b; margin: 2px 0 8px 0;">Ref: #${refId} • Assigned: ${operator}</div>
                        <div class="action-card-buttons" style="display: flex; flex-wrap: wrap; gap: 6px;">
                            <button type="button" class="release-escrow-btn" onclick="window.KurukooChat.releaseEscrow('${refId}', '${rate}', '${operator}')" style="background: #054c44; color: white; border: none; border-radius: 6px; padding: 5px 10px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                                ✅ Release Escrow
                            </button>
                            <button type="button" class="track-telemetry-btn" onclick="window.KurukooChat.trackTelemetry('${refId}', '${operator}')" style="background: #FFF8F0; color: #D97A5C; border: 1px solid #D97A5C; border-radius: 6px; padding: 5px 10px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                                📍 Live Telemetry
                            </button>
                            <button type="button" class="receipt-btn" onclick="window.KurukooChat.showReceipt('${refId}', '${rate}', '${selectedType}')" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; padding: 5px 10px; font-size: 0.7rem; font-weight: 600; cursor: pointer;">
                                📄 Receipt
                            </button>
                            <button type="button" class="dispute-btn" onclick="window.KurukooChat.refundEscrow('${refId}', '${rate}')" style="background: transparent; color: #ef4444; border: 1px solid #fca5a5; border-radius: 6px; padding: 5px 8px; font-size: 0.68rem; font-weight: 600; cursor: pointer;">
                                🛡️ Refund / Cancel
                            </button>
                        </div>
                    </div>
                    `;
                    addBubble('assistant', actionCardHTML, false);
                }, 1200);

            }, 800);
        }

        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;
            chatInput.value = '';
            
            if (exchangeCount === 0) {
                 clearTimeout(demoTimer);
                 chatMessages.innerHTML = '';
                 localStorage.setItem('kurukoo_temp_msgs', '[]');
                 if (flowState === 'demo') { flowState = 'name'; localStorage.setItem('kurukoo_flow_state', flowState); }
            }

            addBubble('user', text);
            quickRepliesContainer.style.display = 'none';

            const intercepted = await interceptAndProcess(text);
            if (intercepted) return;

            if (awaitingConfirmation) {
                showTypingIndicator();
                if (text.toUpperCase().trim() === 'CONFIRM') {
                    setTimeout(async () => {
                        removeTypingIndicator();
                        try {
                            await fetch('/api/temp/merge', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sessionId: tempSessionId, phone: pendingPhone })
                            });
                        } catch(e) {}

                        userPhone = pendingPhone;
                        isAnonymous = false;
                        localStorage.setItem('kurukoo_user_phone', userPhone);
                        
                        awaitingConfirmation = false;
                        flowState = 'normal';
                        localStorage.setItem('kurukoo_flow_state', 'normal');
                        
                        // Handled by persistent icons now
                        addBubble('assistant', 'Confirmation received! Your account is activated and your preferences are saved.', false);
                    }, 800);
                } else {
                    setTimeout(() => {
                        removeTypingIndicator();
                        addBubble('assistant', 'Please reply CONFIRM to complete your verification, or enter a different number.');
                    }, 600);
                }
                return;
            }

            if (isAnonymous) {
                exchangeCount++;
                localStorage.setItem('kurukoo_exchange_count', exchangeCount);
                handlePhase2(text);
            } else {
                handleAuthenticated(text);
            }
        };

        // Execution Start
        if (isAnonymous) {
            if (mode === 'homepage_simulation') {
                runDemo();
            } else {
                if (exchangeCount > 0) {
                    restoreTempSession();
                } else if (initialMessage) {
                    addBubble('assistant', initialMessage, false);
                }
                chatInput.disabled = false;
                chatInput.placeholder = "Type a request...";
            }
        } else {
            loadAuthMessages();
            chatInput.disabled = false;
            chatInput.placeholder = "Type a request...";
        }

        // Process any queued clicks and scenarios
        if (window.KurukooChat._queue && window.KurukooChat._queue.length > 0) {
            const nextScenario = window.KurukooChat._queue.shift();
            setTimeout(() => {
                window.KurukooChat.runScenario(nextScenario);
            }, 800);
        }
        if (window.KurukooChat._cardQueue && window.KurukooChat._cardQueue.length > 0) {
            const nextCard = window.KurukooChat._cardQueue.shift();
            setTimeout(() => {
                window.KurukooChat.handleCardClick(nextCard);
            }, 800);
        }
    }
});
