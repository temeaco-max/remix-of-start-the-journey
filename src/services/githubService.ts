import fs from 'fs';
import path from 'path';

export interface GitHubSyncStatus { configured: boolean; owner: string; repo: string; branch: string; lastSyncTime?: string; remoteCommit?: { sha: string; message: string; author: string; date: string }; workspaceFilesCount: number; syncState: 'in_sync' | 'ahead' | 'behind' | 'diverged' | 'unconfigured' | 'error'; message?: string; }
export interface GitHubFileItem { name: string; path: string; type: 'file' | 'dir'; size?: number; sha?: string; }

function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  const owner = process.env.GITHUB_OWNER || 'temeaco-max';
  const repo = process.env.GITHUB_REPO || 'kurukoo';
  const branch = process.env.GITHUB_BRANCH || 'main';
  return { token, owner, repo, branch, isConfigured: Boolean(token) };
}

function safeRepoPath(input = ''): string {
  const clean = input.replace(/\\/g, '/').replace(/^\/+/, '');
  if (clean.split('/').some(part => part === '..')) throw new Error('Invalid repository path');
  return clean;
}

async function githubRequest(endpoint: string, options: RequestInit = {}) {
  const { token } = getGitHubConfig();
  if (!token) throw new Error('GITHUB_TOKEN is not configured');
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'Kurukoo-Workspace-Sync', ...(options.headers as Record<string, string> || {}) };
  headers.Authorization = `Bearer ${token}`;
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`https://api.github.com${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let message = `GitHub API Error (${res.status})`;
    try { message += `: ${JSON.parse(text).message || text}`; } catch { message += `: ${text}`; }
    throw new Error(message);
  }
  return res.json();
}

function countWorkspaceFiles(dir: string): number {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.cache', 'temp_uploads'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    count += entry.isDirectory() ? countWorkspaceFiles(full) : 1;
  }
  return count;
}

export async function getGitHubSyncStatus(): Promise<GitHubSyncStatus> {
  const config = getGitHubConfig();
  let workspaceFilesCount = 0;
  try { workspaceFilesCount = countWorkspaceFiles(process.cwd()); } catch {}
  if (!config.isConfigured) return { configured: false, owner: config.owner, repo: config.repo, branch: config.branch, workspaceFilesCount, syncState: 'unconfigured', message: 'Set GITHUB_TOKEN in .env to enable workspace sync.' };
  try {
    const branchData = await githubRequest(`/repos/${config.owner}/${config.repo}/branches/${config.branch}`);
    const commit = branchData.commit;
    return { configured: true, owner: config.owner, repo: config.repo, branch: config.branch, lastSyncTime: new Date().toISOString(), remoteCommit: { sha: commit.sha.substring(0, 7), message: commit.commit.message, author: commit.commit.author.name, date: commit.commit.author.date }, workspaceFilesCount, syncState: 'in_sync', message: 'Connected to Kurukoo GitHub repository.' };
  } catch (err: any) {
    return { configured: true, owner: config.owner, repo: config.repo, branch: config.branch, workspaceFilesCount, syncState: 'error', message: err.message || 'GitHub sync error' };
  }
}

export async function listGitHubFiles(dirPath = ''): Promise<GitHubFileItem[]> {
  const config = getGitHubConfig(); const cleanPath = safeRepoPath(dirPath);
  if (config.isConfigured) {
    try {
      const data = await githubRequest(`/repos/${config.owner}/${config.repo}/contents/${cleanPath}?ref=${encodeURIComponent(config.branch)}`);
      if (Array.isArray(data)) return data.map((item: any) => ({ name: item.name, path: item.path, type: item.type === 'dir' ? 'dir' : 'file', size: item.size, sha: item.sha }));
    } catch (err) { console.warn('[GitHub] remote list failed:', err); }
  }
  const target = path.join(process.cwd(), cleanPath);
  if (!fs.existsSync(target)) return [];
  return fs.readdirSync(target, { withFileTypes: true }).filter(e => !['node_modules', '.git', 'dist'].includes(e.name)).map(e => ({ name: e.name, path: path.relative(process.cwd(), path.join(target, e.name)), type: e.isDirectory() ? 'dir' : 'file', size: e.isFile() ? fs.statSync(path.join(target, e.name)).size : undefined }));
}

export async function getGitHubDiff(filePath?: string): Promise<any> {
  const config = getGitHubConfig();
  if (!config.isConfigured) return { modified: [], added: [], deleted: [], totalChanges: 0 };
  const targetPath = filePath ? safeRepoPath(filePath) : '';
  const localPath = targetPath ? path.join(process.cwd(), targetPath) : '';
  const remote = await listGitHubFiles(targetPath);
  if (targetPath && remote.length === 0) {
    return fs.existsSync(localPath) ? { modified: [], added: [targetPath], deleted: [], totalChanges: 1 } : { modified: [], added: [], deleted: [], totalChanges: 0 };
  }
  if (!targetPath) {
    const branchData = await githubRequest(`/repos/${config.owner}/${config.repo}/branches/${config.branch}`);
    const treeSha = branchData.commit.commit.tree.sha;
    const treeData = await githubRequest(`/repos/${config.owner}/${config.repo}/git/trees/${treeSha}?recursive=1`);
    const remotePaths = new Set((treeData.tree || []).filter((x: any) => x.type === 'blob').map((x: any) => x.path));
    const localPaths = new Set<string>();
    const walk = (dir: string) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { if (['node_modules', '.git', 'dist', '.cache'].includes(entry.name)) continue; const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else localPaths.add(path.relative(process.cwd(), full).replace(/\\/g, '/')); } };
    walk(process.cwd());
    const added = [...localPaths].filter(p => !remotePaths.has(p));
    const deleted = [...remotePaths].filter(p => !localPaths.has(p));
    return { modified: [], added, deleted, totalChanges: added.length + deleted.length };
  }
  return { modified: [], added: [], deleted: [], totalChanges: 0, path: targetPath, remote };
}

export async function pullFromGitHub(filePath?: string): Promise<{ success: boolean; filesUpdated: number; message: string }> {
  const config = getGitHubConfig(); if (!config.isConfigured) return { success: false, filesUpdated: 0, message: 'GITHUB_TOKEN is required.' };
  const requested = filePath ? [safeRepoPath(filePath)] : [];
  try {
    let files: any[] = [];
    if (requested.length) files = requested.map(pathValue => ({ path: pathValue }));
    else {
      const branchData = await githubRequest(`/repos/${config.owner}/${config.repo}/branches/${config.branch}`);
      const tree = await githubRequest(`/repos/${config.owner}/${config.repo}/git/trees/${branchData.commit.commit.tree.sha}?recursive=1`);
      files = (tree.tree || []).filter((item: any) => item.type === 'blob' && !item.path.startsWith('node_modules/') && !item.path.startsWith('.git/'));
    }
    let filesUpdated = 0;
    for (const item of files) {
      const blob = await githubRequest(`/repos/${config.owner}/${config.repo}/contents/${safeRepoPath(item.path)}?ref=${encodeURIComponent(config.branch)}`);
      const content = Buffer.from(blob.content, 'base64');
      const localPath = path.join(process.cwd(), safeRepoPath(item.path));
      fs.mkdirSync(path.dirname(localPath), { recursive: true }); fs.writeFileSync(localPath, content); filesUpdated++;
    }
    return { success: true, filesUpdated, message: `Pulled ${filesUpdated} file(s) from ${config.owner}/${config.repo}@${config.branch}.` };
  } catch (err: any) { return { success: false, filesUpdated: 0, message: err.message || 'Pull failed' }; }
}

export async function pushToGitHub(commitMessage = 'Update from Kurukoo Workspace', filePath?: string, content?: string): Promise<{ success: boolean; commitSha?: string; message: string }> {
  const config = getGitHubConfig(); if (!config.isConfigured) return { success: false, message: 'GITHUB_TOKEN is required.' };
  try {
    const cleanPath = safeRepoPath(filePath || '');
    if (cleanPath && content !== undefined) {
      const existing = await githubRequest(`/repos/${config.owner}/${config.repo}/contents/${cleanPath}?ref=${encodeURIComponent(config.branch)}`).catch(() => null);
      const body: any = { message: commitMessage, content: Buffer.from(content, 'utf8').toString('base64'), branch: config.branch };
      if (existing?.sha) body.sha = existing.sha;
      const result = await githubRequest(`/repos/${config.owner}/${config.repo}/contents/${cleanPath}`, { method: 'PUT', body: JSON.stringify(body) });
      return { success: true, commitSha: result.commit?.sha?.substring(0, 7), message: `Pushed ${cleanPath} to ${config.owner}/${config.repo}@${config.branch}.` };
    }
    return { success: false, message: 'Provide filePath and content for a workspace push.' };
  } catch (err: any) { return { success: false, message: err.message || 'Push failed' }; }
}
