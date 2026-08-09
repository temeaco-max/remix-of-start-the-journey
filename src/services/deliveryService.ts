import { getDb, saveDb } from '../database.js';

// Order delivery status flow:
// escrow_held -> driver_assigned -> picked_up -> in_transit -> delivered -> completed

export async function startDeliveryStatusService() {
    console.log('[Delivery Service] Initialized background delivery status simulation...');
    
    // Scan for active orders every 25 seconds to progress status
    setInterval(async () => {
        try {
            await progressActiveOrders();
        } catch (err) {
            console.error('[Delivery Service] Error in periodic progress active orders:', err);
        }
    }, 25000);
}

export async function progressActiveOrders() {
    const db = await getDb();
    
    // Fetch orders that are in a transitional delivery status
    const stmt = db.prepare(`SELECT * FROM orders WHERE status IN ('escrow_held', 'driver_assigned', 'picked_up', 'in_transit')`);
    const ordersToProgress: any[] = [];
    
    while (stmt.step()) {
        ordersToProgress.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (ordersToProgress.length === 0) {
        return;
    }
    
    console.log(`[Delivery Service] Scanning ${ordersToProgress.length} active orders for delivery updates.`);
    
    for (const order of ordersToProgress) {
        let nextStatus = '';
        let updateMsg = '';
        
        switch (order.status) {
            case 'escrow_held':
                nextStatus = 'driver_assigned';
                updateMsg = `🏍️ *Delivery Update (Order #${order.id}):* A dispatcher has been matched! Rider *Suleiman Okada* (4.8★) is heading to the merchant.`;
                break;
            case 'driver_assigned':
                nextStatus = 'picked_up';
                updateMsg = `📦 *Delivery Update (Order #${order.id}):* Your package has been picked up by *Suleiman Okada* from the merchant and is being prepared for dispatch.`;
                break;
            case 'picked_up':
                nextStatus = 'in_transit';
                updateMsg = `📍 *Delivery Update (Order #${order.id}):* Suleiman is in transit! Current ETA: 12 minutes. Track live updates right here.`;
                break;
            case 'in_transit':
                nextStatus = 'delivered';
                updateMsg = `✅ *Delivery Update (Order #${order.id}):* Suleiman has arrived and successfully delivered your package! Please type CONFIRM to finalize and release the escrow funds.`;
                break;
        }
        
        if (nextStatus) {
            await updateDeliveryStatus(order.id, nextStatus, updateMsg);
        }
    }
}

export async function updateDeliveryStatus(orderId: string, status: string, messageText?: string) {
    const db = await getDb();
    
    // Find the order
    const stmt = db.prepare(`SELECT * FROM orders WHERE id = ?`);
    let order: any = null;
    if (stmt.step()) {
        order = stmt.getAsObject();
    }
    stmt.free();
    
    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }
    
    // Update order status
    db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, orderId]);
    
    // Generate default text if none supplied
    const text = messageText || `🚚 *Delivery Status Update (Order #${orderId}):* Status changed to *${status.replace('_', ' ').toUpperCase()}*`;
    
    // Insert into user's chat thread
    db.run(
        `INSERT INTO messages (phone, sender, content, channel, status) VALUES (?, 'assistant', ?, 'pwa', 'read')`,
        [order.phone, text]
    );
    
    // Audit log
    db.run(`INSERT INTO audit_logs (action, details) VALUES (?, ?)`, [
        'delivery_status_updated',
        JSON.stringify({ orderId, phone: order.phone, oldStatus: order.status, newStatus: status })
    ]);
    
    saveDb();
    
    // Send simulated or real WhatsApp message if token/phone is present
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    if (whatsappToken && order.phone) {
        try {
            const recipient = order.phone.replace(/^\+/, '');
            const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1000000000000';
            await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${whatsappToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: recipient,
                    type: 'text',
                    text: { body: text }
                })
            });
            console.log(`[Delivery Service] Sent WhatsApp notification to ${order.phone} for order status ${status}`);
        } catch (err) {
            console.warn('[Delivery Service] Failed to send WhatsApp delivery status notification:', err);
        }
    }
    
    console.log(`[Delivery Service] Order ${orderId} progressed to ${status}. Notification added to chat.`);
}
