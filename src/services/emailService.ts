export async function sendEmail(to: string, subject: string, body: string) {
    // Phase 2 - requires SendGrid/Mailgun API keys
    console.log(`[Email Stub] To: ${to}, Subject: ${subject}`);
    const { getDb, saveDb } = await import('../database.js');
    const db = await getDb();
    db.run(`INSERT INTO email_log (recipient, subject, body, status) VALUES (?, ?, ?, ?)`, [to, subject, body, 'sent_stub']);
    saveDb();
}
