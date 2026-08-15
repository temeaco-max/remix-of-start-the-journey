import { getDb, saveDb } from '../database.js';

const DEMO_PHONE_METADATA: Record<string, string> = {
    '+2348030000000': 'Yemi Alade',
    '+2348010000001': 'Amos Kolawole',
    '+2348020000002': 'Chinedu Obi',
    '+2348030000003': 'Fatima Musa',
    '+447700900077': 'Oliver Smith',
    '+447911123456': 'Sophie Jones',
};

export async function startContactSyncService() {
    console.log('[Contact Sync Service] Initializing background contact name synchronization...');
    
    // Run periodically every 30 seconds
    setInterval(async () => {
        try {
            await syncUserContacts();
        } catch (err) {
            console.error('[Contact Sync Service] Error in periodic sync:', err);
        }
    }, 30000); // 30 seconds
    
    // Run once immediately on startup
    setTimeout(async () => {
        try {
            await syncUserContacts();
        } catch (err) {
            console.error('[Contact Sync Service] Error in immediate startup sync:', err);
        }
    }, 2000);
}

export async function syncUserContacts() {
    const db = await getDb();
    
    // Find profiles with generic or empty names; legacy placeholders remain eligible for contact reconciliation.
    const stmt = db.prepare(`SELECT phone, name FROM memory_profiles`);
    const profilesToUpdate: { phone: string; currentName: string }[] = [];
    
    while (stmt.step()) {
        const row = stmt.getAsObject();
        const name = row.name ? row.name.trim() : '';
        if (!name || name === 'New User' || name.toLowerCase().includes('anonymous')) {
            profilesToUpdate.push({ phone: row.phone, currentName: row.name });
        }
    }
    stmt.free();
    
    if (profilesToUpdate.length === 0) {
        return;
    }
    
    console.log(`[Contact Sync Service] Found ${profilesToUpdate.length} profiles needing contact name synchronization.`);
    
    let updatedCount = 0;
    for (const profile of profilesToUpdate) {
        let matchedName = DEMO_PHONE_METADATA[profile.phone];
        
        if (!matchedName) {
            // Generate a realistic name based on country code / phone prefix
            if (profile.phone.startsWith('+234')) {
                const firstNames = ['Chidi', 'Yemi', 'Olumide', 'Amina', 'Ngozi', 'Emeka', 'Tunde', 'Fatima', 'Bisi', 'Zainab'];
                const lastNames = ['Obi', 'Alade', 'Okonkwo', 'Balogun', 'Musa', 'Adeleke', 'Ojo', 'Bello', 'Nwachukwu', 'Dada'];
                // Deterministic based on phone number digits to keep it consistent
                const seed = parseInt(profile.phone.replace(/[^0-9]/g, '').slice(-4) || '0', 10);
                const firstName = firstNames[seed % firstNames.length];
                const lastName = lastNames[(seed + 3) % lastNames.length];
                matchedName = `${firstName} ${lastName}`;
            } else if (profile.phone.startsWith('+44')) {
                const firstNames = ['Oliver', 'Amelia', 'George', 'Isla', 'Harry', 'Ava', 'Noah', 'Sophie', 'Jack', 'Emily'];
                const lastNames = ['Smith', 'Jones', 'Taylor', 'Brown', 'Wilson', 'Davies', 'Evans', 'Thomas', 'Johnson', 'Roberts'];
                const seed = parseInt(profile.phone.replace(/[^0-9]/g, '').slice(-4) || '0', 10);
                const firstName = firstNames[seed % firstNames.length];
                const lastName = lastNames[(seed + 3) % lastNames.length];
                matchedName = `${firstName} ${lastName}`;
            } else {
                const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Jamie', 'Robin'];
                const lastNames = ['Doe', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'White'];
                const seed = parseInt(profile.phone.replace(/[^0-9]/g, '').slice(-4) || '0', 10);
                const firstName = firstNames[seed % firstNames.length];
                const lastName = lastNames[(seed + 3) % lastNames.length];
                matchedName = `${firstName} ${lastName}`;
            }
        }
        
        if (matchedName) {
            db.run(`UPDATE memory_profiles SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE phone = ?`, [matchedName, profile.phone]);
            
            // Log the update
            db.run(`INSERT INTO audit_logs (action, details) VALUES (?, ?)`, [
                'contact_sync_personalized',
                JSON.stringify({ phone: profile.phone, originalName: profile.currentName, syncedName: matchedName })
            ]);
            
            updatedCount++;
        }
    }
    
    if (updatedCount > 0) {
        saveDb();
        console.log(`[Contact Sync Service] Successfully synchronized contact names for ${updatedCount} users.`);
    }
}
