/**
 * Idempotent wiring: mount extracted security routers + neutralize legacy handlers.
 * Run: node scripts/wire-security-routes.mjs (also prebuild)
 */
import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.join(process.cwd(), 'src', 'index.ts');
let src = fs.readFileSync(indexPath, 'utf8');

const securityImportBlock = `import trustRoutes from './routes/trustRoutes.js';
import circleRoutes from './routes/circleRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
`;

if (!src.includes("from './routes/trustRoutes.js'")) {
  if (src.includes("from './routes/chatRouter.js'")) {
    src = src.replace(
      "import chatRouter from './routes/chatRouter.js';",
      `import chatRouter from './routes/chatRouter.js';\n${securityImportBlock}`
    );
  } else {
    src = securityImportBlock + src;
  }
} else {
  for (const line of [
    "import taskRoutes from './routes/taskRoutes.js';",
    "import userRoutes from './routes/userRoutes.js';",
    "import circleRoutes from './routes/circleRoutes.js';",
    "import orderRoutes from './routes/orderRoutes.js';",
  ]) {
    if (!src.includes(line) && src.includes("from './routes/trustRoutes.js'")) {
      src = src.replace(
        "import trustRoutes from './routes/trustRoutes.js';",
        `import trustRoutes from './routes/trustRoutes.js';\n${line}`
      );
    }
  }
}

if (!src.includes("app.use('/api', trustRoutes)")) {
  if (src.includes("app.use('/api/chat', chatRouter)")) {
    src = src.replace(
      "app.use('/api/chat', chatRouter);",
      `app.use('/api/chat', chatRouter);
app.use('/api', trustRoutes);
app.use('/api', circleRoutes);
app.use('/api', orderRoutes);
app.use('/api', taskRoutes);
app.use('/api', userRoutes);`
    );
  }
} else {
  if (!src.includes("app.use('/api', taskRoutes)")) {
    const anchor = src.includes("app.use('/api', orderRoutes)")
      ? "app.use('/api', orderRoutes);"
      : "app.use('/api', trustRoutes);";
    src = src.replace(
      anchor,
      `${anchor}
app.use('/api', taskRoutes);
app.use('/api', userRoutes);`
    );
  }
}

const renames = [
  ["app.post('/api/referral/code'", "app.post('/api/referral/code-legacy'"],
  ["app.post('/api/referral/claim'", "app.post('/api/referral/claim-legacy'"],
  ["app.post('/api/referral/share-reward'", "app.post('/api/referral/share-reward-legacy'"],
  ["app.get('/api/referral/stats/:phone'", "app.get('/api/referral/stats-legacy/:phone'"],
  ["app.post('/api/ratings'", "app.post('/api/ratings-legacy'"],
  ["app.post('/api/appointments/book'", "app.post('/api/appointments/book-legacy'"],
  ["app.get('/api/tasks'", "app.get('/api/tasks-legacy'"],
  ["app.post('/api/tasks/accept'", "app.post('/api/tasks/accept-legacy'"],
  ["app.post('/api/tasks/complete'", "app.post('/api/tasks/complete-legacy'"],
  ["app.post('/api/circle/create'", "app.post('/api/circle/create-legacy'"],
  ["app.post('/api/circle/join'", "app.post('/api/circle/join-legacy'"],
  ["app.post('/api/circle/contribute'", "app.post('/api/circle/contribute-legacy'"],
  ["app.get('/api/orders'", "app.get('/api/orders-legacy'"],
  ["app.post('/api/orders/:id/delivery-status'", "app.post('/api/orders/:id/delivery-status-legacy'"],
  ["app.post('/api/dispute/create'", "app.post('/api/dispute/create-legacy'"],
  ["app.post('/api/disputes'", "app.post('/api/disputes-legacy'"],
  ["app.post('/api/scam_reports'", "app.post('/api/scam_reports-legacy'"],
  ["app.post('/api/escrow/create'", "app.post('/api/escrow/create-legacy'"],
];

for (const [from, to] of renames) {
  if (src.includes(from) && !src.includes(to)) src = src.replace(from, to);
}

src = src.split('+2348030000000').join('');

fs.writeFileSync(indexPath, src);
console.log('Wired trust/circle/order/task/user routers; neutralized legacy identity handlers.');
