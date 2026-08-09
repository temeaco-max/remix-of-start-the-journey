import { getDb, saveDb } from '../database.js';
import { addPoints } from './pointsEngine.js';
import { releaseEscrow } from './escrow.js';

export async function runEscrowPass(): Promise<void> {
    console.log('Running Transaction Orchestration Engine pass...');
    const db = await getDb();
    
    // Find orders that are 'delivered' and have held escrow
    const stmt = db.prepare(`
        SELECT o.id as order_id, e.id as escrow_id, e.provider_phone, e.amount_minor 
        FROM orders o
        JOIN escrow e ON o.id = e.order_id 
        WHERE o.status = 'delivered' AND e.status = 'held'
    `);
    
    while (stmt.step()) {
        const row = stmt.getAsObject();
        // Here we would ideally check if user confirmed.
        // For now, assuming delivered + escrow held = ready to release after 24h
        // or immediately if we trust delivery service confirmation.
        // Assuming release for now.
        
        console.log(`[Transaction Engine] Releasing escrow ${row.escrow_id} for order ${row.order_id}`);
        try {
            const released = await releaseEscrow(row.escrow_id as number);
            
            if (released) {
                // Reward provider
                await addPoints(row.provider_phone as string, row.amount_minor as number, `Payment for order ${row.order_id}`);
                
                db.run(`UPDATE orders SET status = 'completed' WHERE id = ?`, [row.order_id]);
                console.log(`[Transaction Engine] Successfully processed escrow ${row.escrow_id} for order ${row.order_id}`);
            } else {
                console.warn(`[Transaction Engine] Failed to release escrow ${row.escrow_id} for order ${row.order_id} - already released or not found.`);
            }
        } catch (error) {
            console.error(`[Transaction Engine] Critical error processing escrow ${row.escrow_id} for order ${row.order_id}:`, error);
        }
    }
    stmt.free();
    saveDb();
}
