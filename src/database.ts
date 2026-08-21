import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { seedDemoWorkspaceState } from './services/demoWorkspaceSeed.js';

let db: any = null;
let dbInitialization: Promise<any> | null = null;
const dbFilePath = process.env.DB_PATH || path.join(process.cwd(), 'kurukoo.sqlite');

export async function getDb() {
  if (db) return db;
  if (dbInitialization) return dbInitialization;
  dbInitialization = (async () => {
    const SQL = await initSqlJs();
    if (db) return db;
    if (fs.existsSync(dbFilePath)) {
      db = new SQL.Database(fs.readFileSync(dbFilePath));
      initTables(db);
      initEconomicParticipantTables(db);
      initExecutionTables(db);
      seedCanonicalOperatorState(db);
      if (process.env.NODE_ENV !== 'production') seedDemoWorkspaceState(db, CANONICAL_OPERATOR_PHONE);
      auditAppointmentSkillFlows(db);
      saveDb();
    } else {
      db = new SQL.Database();
      initTables(db);
      initEconomicParticipantTables(db);
      initExecutionTables(db);
      seedCanonicalOperatorState(db);
      seedSkillFlows(db);
      if (process.env.NODE_ENV !== 'production') {
        seedDemoProviders(db);
        seedDemoWorkspaceState(db, CANONICAL_OPERATOR_PHONE);
      }
      auditAppointmentSkillFlows(db);
      saveDb();
      console.log(`Kurukoo database initialized${process.env.NODE_ENV === 'production' ? '' : ' with development seed data'}.`);
    }
    return db;
  })();
  try {
    return await dbInitialization;
  } finally {
    dbInitialization = null;
  }
}
