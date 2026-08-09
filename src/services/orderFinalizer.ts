import { getDb, saveDb } from '../database.js';
import { deductCredits, addCredits, deductPoints, addPoints } from './pointsEngine.js';
import { getCommission } from './commissionService.js';
import { processDirectPayment } from './directWallet.js';

export async function getLeadCharge(orderType: string): Promise<number> {
    const ot = orderType.toLowerCase();
    if (ot.includes('okada') || ot.includes('keke') || ot.includes('car') || ot.includes('taxi') || ot.includes('ride')) {
        return await getCommission('provider_lead_ride');
    } else if (ot.includes('bicycle') || ot.includes('delivery')) {
        return await getCommission('provider_lead_delivery');
    } else if (ot.includes('hawker') || ot.includes('food')) {
        return await getCommission('provider_lead_food');
    } else if (ot.includes('barrow') || ot.includes('truck')) {
        return await getCommission('provider_lead_truck');
    }
    return await getCommission('provider_lead_professional');
}

export async function finalizeOrder(
    buyerPhone: string,
    arg2: string = '',
    arg3: any = {},
    arg4?: any
): Promise<{ success: boolean; message: string; orderId?: string }> {
    let providerPhone = '';
    let orderType = '';
    let details: {
        skill?: string;
        amount?: number;
        bookingMode?: string; // 'instant' vs 'appointment' / 'escrow'
        idempotencyKey?: string;
    } = {};

    const db = await getDb();
    const creditEconomyEnabled = process.env.CREDIT_ECONOMY_ENABLED !== 'false';

    // Check call pattern
    if (arg4 !== undefined) {
        // Explicit 4 arguments pattern: (buyerPhone, providerPhone, orderType, details)
        providerPhone = arg2;
        orderType = arg3;
        details = arg4 || {};
    } else {
        // Compatibility 3 arguments pattern: (phone, actionType, details)
        details = arg3 || {};
        orderType = details.skill || arg2 || 'general_service';

        // Auto-match an available provider from the database for this skill
        // Now also checking subscription
        const stmt = db.prepare(`
            SELECT s.phone, ps.status, ps.leads_this_month, ps.tier 
            FROM skills s
            JOIN memory_profiles m ON s.phone = m.phone
            LEFT JOIN provider_subscriptions ps ON s.phone = ps.phone
            WHERE s.skill = ? AND s.is_available = 1 
            AND ps.status = 'active'
            LIMIT 1
        `);
        stmt.bind([orderType]);
        
        let found = false;
        if (stmt.step()) {
            const row = stmt.getAsObject();
            // Assuming 30 leads per month for Base, 100 for Plus, etc.
            // A simple exhaustion check:
            const limit = row.tier === 'Plus' ? 100 : (row.tier === 'Business' ? 1000 : 30);
            if ((row.leads_this_month as number) < limit) {
                providerPhone = row.phone as string;
                found = true;
            }
        }
        stmt.free();
        
        if (!found) {
            // Grab any available fallback provider with active sub
            const fallbackStmt = db.prepare(`
                SELECT s.phone FROM skills s 
                LEFT JOIN provider_subscriptions ps ON s.phone = ps.phone
                WHERE s.is_available = 1 AND ps.status = 'active' 
                LIMIT 1
            `);
            if (fallbackStmt.step()) {
                providerPhone = fallbackStmt.getAsObject().phone as string;
            } else {
                providerPhone = '+2348010000001'; // Default mockup provider
            }
            fallbackStmt.free();
        }
    }

    const idempotencyKey = details.idempotencyKey || null;

    // 1. Idempotency Key check
    if (idempotencyKey) {
        const checkStmt = db.prepare(`SELECT id, status FROM orders WHERE idempotency_key = ?`);
        checkStmt.bind([idempotencyKey]);
        if (checkStmt.step()) {
            const existing = checkStmt.getAsObject();
            checkStmt.free();
            return {
                success: true,
                message: `Order retrieved from cache (idempotent). Status: ${existing.status}`,
                orderId: existing.id as string
            };
        }
        checkStmt.free();
    }

    // 2. Subscription Check for the client (buyer)
    const clientStmt = db.prepare(`SELECT subscription_tier FROM memory_profiles WHERE phone = ?`);
    clientStmt.bind([buyerPhone]);
    let clientTier = 'Base';
    if (clientStmt.step()) {
        clientTier = clientStmt.getAsObject().subscription_tier as string;
    }
    clientStmt.free();

    // 3. Check Provider Subscription for directly requested providers
    if (arg4 !== undefined) {
        const provSubStmt = db.prepare(`SELECT tier, status, leads_this_month FROM provider_subscriptions WHERE phone = ?`);
        provSubStmt.bind([providerPhone]);
        if (provSubStmt.step()) {
            const row = provSubStmt.getAsObject();
            const limit = row.tier === 'Plus' ? 100 : (row.tier === 'Business' ? 1000 : 30);
            if (row.status !== 'active' || (row.leads_this_month as number) >= limit) {
                provSubStmt.free();
                return { success: false, message: 'Provider subscription inactive or leads exhausted.' };
            }
        } else {
            // If they don't even have a row, they are not active
            if (providerPhone !== '+2348010000001') {
                provSubStmt.free();
                return { success: false, message: 'Provider subscription inactive.' };
            }
        }
        provSubStmt.free();
    }

    const isInstant = details.bookingMode === 'instant' || !details.bookingMode;
    const orderId = `ord_${Math.floor(Math.random() * 1000000)}`;
    const jobAmount = details.amount || 0;

    // 4. Update provider leads used
    if (providerPhone !== '+2348010000001') {
        db.run(`UPDATE provider_subscriptions SET leads_this_month = leads_this_month + 1 WHERE phone = ?`, [providerPhone]);
    }

    // 5. Direct Wallet Payments (Lead Charge replaced with Subscription; Escrow/Job amounts via Direct Payment)
    if (!creditEconomyEnabled) {
        if (jobAmount > 0) {
            const paid = await processDirectPayment(buyerPhone, providerPhone, jobAmount);
            if (!paid) {
                // Rollback lead count if payment fails
                if (providerPhone !== '+2348010000001') {
                    db.run(`UPDATE provider_subscriptions SET leads_this_month = leads_this_month - 1 WHERE phone = ?`, [providerPhone]);
                }
                return { success: false, message: 'Fulfillment failed due to direct payment error.' };
            }
        }
    } else {
        if (!isInstant && jobAmount > 0) {
            // Deduct from buyer and put into escrow
            const escrowDeducted = await processDirectPayment(buyerPhone, "ESCROW", jobAmount);
            if (!escrowDeducted) {
                if (providerPhone !== '+2348010000001') {
                    db.run(`UPDATE provider_subscriptions SET leads_this_month = leads_this_month - 1 WHERE phone = ?`, [providerPhone]);
                }
                saveDb();
                return { success: false, message: `Failed to secure job funds in Escrow. Required: ₦${jobAmount}.` };
            }
            
            // Insert escrow record
            db.run(`INSERT INTO escrow (buyer_phone, provider_phone, amount_minor, description, status) VALUES (?, ?, ?, ?, 'held')`, [
                buyerPhone,
                providerPhone,
                jobAmount,
                `Escrow for ${orderType} job (${orderId})`,
            ]);
        }
    }

    // 7. Persist to orders table
    db.run(
        `INSERT INTO orders (id, phone, order_type, provider_phone, amount, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, buyerPhone, orderType, providerPhone, jobAmount, isInstant ? 'completed' : 'escrow_held', idempotencyKey]
    );

    // Save logs
    db.run(`INSERT INTO audit_logs (action, details) VALUES (?, ?)`, [
        'order_finalized',
        JSON.stringify({ orderId, buyerPhone, providerPhone, orderType, isInstant })
    ]);

    saveDb();

    return {
        success: true,
        message: `Matched successfully with verified provider.${isInstant ? ' Match complete.' : ' Escrow payment secured.'}`,
        orderId
    };
}
