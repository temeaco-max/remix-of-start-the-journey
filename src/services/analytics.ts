import { getDb, saveDb } from '../database.js';

export interface KeepAliveEvent {
    id?: number;
    phone: string;
    event_type: 'session_start' | 'push_sent' | 'push_opened' | 'session_expired';
    cost_impact: number; // Cost in NGN (e.g. 9.28 for standard Meta session fee, or savings)
    metadata?: string;
    timestamp?: string;
}

/**
 * Record a keep-alive or conversation session event for analytics.
 */
export async function recordKeepAliveEvent(
    phone: string,
    eventType: 'session_start' | 'push_sent' | 'push_opened' | 'session_expired',
    costImpact: number = 0,
    metadata: any = null
): Promise<boolean> {
    try {
        const db = await getDb();
        const metaStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : '';
        
        db.run(
            `INSERT INTO keep_alive_analytics (phone, event_type, cost_impact, metadata) VALUES (?, ?, ?, ?)`,
            [phone, eventType, costImpact, metaStr]
        );
        saveDb();
        return true;
    } catch (err) {
        console.error('Failed to record keep-alive event in analytics:', err);
        return false;
    }
}

/**
 * Aggregate stats tracking WhatsApp session durations, FCM push open rates, and messaging costs.
 */
export async function getKeepAliveAnalyticsStats() {
    try {
        const db = await getDb();

        // 1. Total events of each type
        const eventsRes = db.exec(`
            SELECT event_type, COUNT(*) as count, SUM(cost_impact) as total_impact 
            FROM keep_alive_analytics 
            GROUP BY event_type
        `);

        const statsMap: Record<string, { count: number; total_impact: number }> = {
            session_start: { count: 0, total_impact: 0 },
            push_sent: { count: 0, total_impact: 0 },
            push_opened: { count: 0, total_impact: 0 },
            session_expired: { count: 0, total_impact: 0 }
        };

        if (eventsRes && eventsRes.length > 0 && eventsRes[0].values) {
            eventsRes[0].values.forEach((row: any) => {
                const type = row[0];
                const count = row[1];
                const total_impact = row[2] || 0;
                if (statsMap[type]) {
                    statsMap[type] = { count, total_impact };
                }
            });
        }

        // 2. Open Rate: push_opened / push_sent
        const sentCount = statsMap.push_sent.count;
        const openedCount = statsMap.push_opened.count;
        const openRate = sentCount > 0 ? parseFloat(((openedCount / sentCount) * 100).toFixed(1)) : 0.0;

        // 3. Costs calculation
        // Meta charges NGN 9.28 per conversation session.
        // Savings = openedCount * 9.28 NGN
        const totalSavings = parseFloat((openedCount * 9.28).toFixed(2));
        const simulatedCostWithoutLoophole = parseFloat(((statsMap.session_start.count + openedCount) * 9.28).toFixed(2));
        const actualCostWithLoophole = parseFloat((statsMap.session_start.count * 9.28).toFixed(2));

        // 4. Session duration analysis
        // Since we simulate hours in our dashboard keep-alive resets, we can calculate active session duration per user.
        // Let's grab user conversation stats
        const usersRes = db.exec(`
            SELECT phone, COUNT(*) as events_count 
            FROM keep_alive_analytics 
            GROUP BY phone
        `);
        const totalUsersTracked = usersRes && usersRes.length > 0 ? usersRes[0].values.length : 0;

        // Estimate average active session duration (e.g. 24 hours baseline + 24 hours per reset/opened push)
        const totalExtendedHours = openedCount * 24; // Each keep-alive opens another 24 hour window
        const totalBaseHours = statsMap.session_start.count * 24;
        const totalSessionHours = totalBaseHours + totalExtendedHours;
        const averageSessionDurationHours = statsMap.session_start.count > 0 
            ? parseFloat((totalSessionHours / statsMap.session_start.count).toFixed(1))
            : 24.0;

        // 5. Recent timeline events for charts
        const recentEventsRes = db.exec(`
            SELECT event_type, timestamp, phone
            FROM keep_alive_analytics
            ORDER BY id DESC
            LIMIT 15
        `);

        const recentEvents = recentEventsRes && recentEventsRes.length > 0 && recentEventsRes[0].values
            ? recentEventsRes[0].values.map((row: any) => ({
                event_type: row[0],
                timestamp: row[1],
                phone: row[2]
              }))
            : [];

        return {
            sentCount,
            openedCount,
            openRate,
            totalSavings,
            simulatedCostWithoutLoophole,
            actualCostWithLoophole,
            totalUsersTracked,
            averageSessionDurationHours,
            recentEvents,
            detailedStats: statsMap
        };
    } catch (err) {
        console.error('Error calculating keep-alive analytics stats:', err);
        return {
            sentCount: 0,
            openedCount: 0,
            openRate: 0,
            totalSavings: 0,
            simulatedCostWithoutLoophole: 0,
            actualCostWithLoophole: 0,
            totalUsersTracked: 0,
            averageSessionDurationHours: 24.0,
            recentEvents: [],
            detailedStats: {}
        };
    }
}
