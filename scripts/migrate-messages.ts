import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

/**
 * Kurukoo Database Migration Helper: Messages Table
 * Safely handles schema migrations for the `messages` table without data loss.
 */
export async function migrateMessagesTable(options: { dryRun?: boolean; backup?: boolean } = {}) {
    const { dryRun = false, backup = true } = options;
    const dbFilePath = path.join(process.cwd(), 'kurukoo.sqlite');

    if (!fs.existsSync(dbFilePath)) {
        console.log(`[Migration] Database file not found at ${dbFilePath}. Migration skipped.`);
        return;
    }

    // 1. Create a timestamped backup if requested
    if (backup && !dryRun) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(process.cwd(), `kurukoo.sqlite.backup-${timestamp}`);
        fs.copyFileSync(dbFilePath, backupPath);
        console.log(`[Migration] Created database backup at: ${backupPath}`);
    }

    // 2. Initialize SQL.js and load DB
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(dbFilePath);
    const db = new SQL.Database(fileBuffer);

    console.log(`[Migration] Inspecting 'messages' table schema...`);

    // Ensure table exists
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT,
            sender TEXT,
            content TEXT,
            channel TEXT DEFAULT 'pwa',
            card_data TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Get current column names
    const pragmaRes = db.exec("PRAGMA table_info(messages)");
    const existingColumns = new Set<string>();
    if (pragmaRes.length > 0) {
        pragmaRes[0].values.forEach((col: any) => {
            existingColumns.add(col[1]); // col[1] is column name
        });
    }

    console.log(`[Migration] Existing columns in 'messages':`, Array.from(existingColumns).join(', '));

    // Target columns to ensure
    const columnsToAdd: { name: string; definition: string }[] = [
        { name: 'direction', definition: "TEXT CHECK(direction IN ('inbound','outbound'))" },
        { name: 'content_type', definition: "TEXT DEFAULT 'text'" },
        { name: 'metadata', definition: "TEXT" },
        { name: 'sender', definition: "TEXT" },
        { name: 'card_data', definition: "TEXT" }
    ];

    let changesCount = 0;

    for (const col of columnsToAdd) {
        if (!existingColumns.has(col.name)) {
            console.log(`[Migration] Missing column detected: '${col.name}'`);
            if (!dryRun) {
                try {
                    db.run(`ALTER TABLE messages ADD COLUMN ${col.name} ${col.definition}`);
                    console.log(`[Migration] Successfully added column '${col.name}'`);
                    changesCount++;
                } catch (err: any) {
                    console.error(`[Migration] Failed to add column '${col.name}':`, err.message);
                }
            } else {
                console.log(`[DryRun] Would add column '${col.name}'`);
            }
        }
    }

    // Populate default direction where NULL
    if (existingColumns.has('sender') || !dryRun) {
        if (!dryRun) {
            try {
                db.run(`UPDATE messages SET direction = 'outbound' WHERE direction IS NULL AND sender = 'Kurukoo'`);
                db.run(`UPDATE messages SET direction = 'inbound' WHERE direction IS NULL AND (sender != 'Kurukoo' OR sender IS NULL)`);
            } catch (err) {
                // Ignore if direction column constraint fails
            }
        }
    }

    if (!dryRun && changesCount > 0) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbFilePath, buffer);
        console.log(`[Migration] Migration complete. Updated 'messages' table with ${changesCount} new column(s).`);
    } else if (dryRun) {
        console.log(`[DryRun] Migration check complete. ${columnsToAdd.filter(c => !existingColumns.has(c.name)).length} change(s) needed.`);
    } else {
        console.log(`[Migration] Schema is up to date. No alterations required.`);
    }
}

// Run directly if invoked via CLI
if (process.argv[1]?.endsWith('migrate-messages.ts') || process.argv[1]?.endsWith('migrate-messages.js')) {
    const isDryRun = process.argv.includes('--dry-run');
    const noBackup = process.argv.includes('--no-backup');
    migrateMessagesTable({ dryRun: isDryRun, backup: !noBackup }).catch(console.error);
}
