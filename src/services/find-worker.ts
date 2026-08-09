import { getDb } from '../database.js';

export interface ProviderMatch {
    phone: string;
    name: string;
    business_name?: string;
    skill: string;
    rating: number;
    jobs_completed: number;
    hourly_rate: number;
    operation_mode: string;
    service_radius_km: number;
    distance_km?: number;
}

export interface FindWorkerResult {
    providers: ProviderMatch[];
    count: number;
}

/**
 * Generic worker / provider matching engine (§4 "find_worker").
 * Queries the `skills` table for providers who hold the requested skill and are
 * currently available, backfilled with their memory-profile display name.
 */
export async function find_worker(options: {
    skill: string;
    location?: string;
    max?: number;
}): Promise<FindWorkerResult> {
    const db = await getDb();
    const max = options.max ?? 5;

    const stmt = db.prepare(`
        SELECT s.phone, s.skill, s.rating, s.jobs_completed, s.hourly_rate,
               s.operation_mode, s.service_radius_km,
               p.name, p.location
        FROM skills s
        LEFT JOIN memory_profiles p ON p.phone = s.phone
        WHERE lower(s.skill) = lower(?)
          AND s.is_available = 1
        ORDER BY s.rating DESC, s.jobs_completed DESC
        LIMIT ?
    `);
    stmt.bind([options.skill.toLowerCase(), max]);

    const providers: ProviderMatch[] = [];
    while (stmt.step()) {
        const r = stmt.getAsObject() as Record<string, unknown>;
        providers.push({
            phone: String(r.phone ?? ''),
            name: String(r.name ?? 'Provider'),
            business_name: undefined,
            skill: String(r.skill ?? options.skill),
            rating: Number(r.rating ?? 5.0),
            jobs_completed: Number(r.jobs_completed ?? 0),
            hourly_rate: Number(r.hourly_rate ?? 0),
            operation_mode: String(r.operation_mode ?? 'stationary'),
            service_radius_km: Number(r.service_radius_km ?? 10),
        });
    }
    stmt.free();

    return { providers, count: providers.length };
}
