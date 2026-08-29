/* Copyright (c) 2026 temeaco-max. All rights reserved. Proprietary and confidential. */
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

async function run() {
    const dbFilePath = path.join(process.cwd(), 'kurukoo.sqlite');
    if (!fs.existsSync(dbFilePath)) {
        console.error('Database file kurukoo.sqlite not found. Please start server or generate it first.');
        return;
    }

    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(dbFilePath);
    const db = new SQL.Database(fileBuffer);

    // Count providers per country
    const countsQuery = db.exec(`
        SELECT country, COUNT(*) as count 
        FROM memory_profiles 
        GROUP BY country
    `);
    
    console.log('----------------------------------------------------');
    console.log('Count of Registered Profiles per Country:');
    console.log('----------------------------------------------------');
    if (countsQuery[0]) {
        const columns = countsQuery[0].columns;
        const values = countsQuery[0].values;
        for (const row of values) {
            console.log(`Country: ${row[0].toUpperCase()} - Profiles Count: ${row[1]}`);
        }
    } else {
        console.log('No profiles found.');
    }

    // Fetch 3 random providers from each region (ng, gb, gh)
    const countries = ['ng', 'gb', 'gh'];
    console.log('\n----------------------------------------------------');
    console.log('3 Random Provider Rows per Region:');
    console.log('----------------------------------------------------');

    for (const country of countries) {
        console.log(`\nRegion: ${country.toUpperCase()}`);
        const rowsQuery = db.exec(`
            SELECT phone, name, location, country, subscription_tier, wallet_balance_minor
            FROM memory_profiles
            WHERE country = '${country}'
            ORDER BY RANDOM()
            LIMIT 3
        `);

        if (rowsQuery[0]) {
            const values = rowsQuery[0].values;
            values.forEach((row, idx) => {
                console.log(`  [${idx + 1}] Phone: ${row[0]} | Name: ${row[1]} | Location: ${row[2]} | Tier: ${row[4]} | Wallet Balance: ${row[5]} Credits`);
            });
        } else {
            console.log('  No rows found for this region.');
        }
    }
    console.log('----------------------------------------------------');
}

run().catch(console.error);
