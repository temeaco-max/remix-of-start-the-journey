import fs from 'fs';
import path from 'path';

export interface GitHubSyncStatus {
    configured: boolean;
    owner: string;
    repo: string;
    branch: string;
    lastSyncTime?: string;
    remoteCommit?: {
        sha: string;
        message: string;
        author: string;
        date: string;
    };
    workspaceFilesCount: number;
    syncState: 'in_sync' | 'ahead' | 'behind' | 'diverged' | 'unconfigured' | 'error';
    message?: string;
}

export interface GitHubFileItem {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
    sha?: string;
}

function getGitHubConfig() {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
    const owner = process.env.GITHUB_OWNER || process.env.GITHUB_USER || 'Kurukoo';
    const repo = process.env.GITHUB_REPO || 'kurukoo-platform';
    const branch = process.env.GITHUB_BRANCH || 'main';

    return {
        token,
        owner,
        repo,
        branch,
        isConfigured: !!token
    };
}

/**
 * Fetch helper for GitHub REST API v3
 */
async function githubRequest(endpoint: string, options: RequestInit = {}) {
    const { token } = getGitHubConfig();
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Kurukoo-Workspace-Sync',
        ...(options.headers as Record<string, string> || {})
    };

    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const res = await fetch(`https://api.github.com${endpoint}`, {
        ...options,
        headers
    });

    if (!res.ok) {
        const errText = await res.text();
        let errMsg = `GitHub API Error (${res.status} ${res.statusText})`;
        try {
            const errJson = JSON.parse(errText);
            if (errJson.message) errMsg += `: ${errJson.message}`;
        } catch {
            errMsg += `: ${errText}`;
        }
        throw new Error(errMsg);
    }

    return res.json();
}

/**
 * Get current sync status of the workspace against GitHub repository
 */
export async function getGitHubSyncStatus(): Promise<GitHubSyncStatus> {
    const config = getGitHubConfig();
    const workspaceRoot = process.cwd();

    // Count workspace files (excluding node_modules, .git, dist, etc.)
    let workspaceFilesCount = 0;
    try {
        const countFiles = (dir: string): number => {
            let count = 0;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (['node_modules', '.git', 'dist', '.cache'].includes(entry.name)) continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    count += countFiles(fullPath);
                } else {
                    count++;
                }
            }
            return count;
        };
        workspaceFilesCount = countFiles(workspaceRoot);
    } catch (e) {
        console.error('Error counting workspace files:', e);
    }

    if (!config.isConfigured) {
        return {
            configured: false,
            owner: config.owner,
            repo: config.repo,
            branch: config.branch,
            workspaceFilesCount,
            syncState: 'unconfigured',
            message: 'GITHUB_TOKEN is not configured in .env. Workspace is running in local standalone mode.'
        };
    }

    try {
        const branchData = await githubRequest(`/repos/${config.owner}/${config.repo}/branches/${config.branch}`);
        const commit = branchData.commit;

        return {
            configured: true,
            owner: config.owner,
            repo: config.repo,
            branch: config.branch,
            lastSyncTime: new Date().toISOString(),
            remoteCommit: {
                sha: commit.sha.substring(0, 7),
                message: commit.commit.message,
                author: commit.commit.author.name,
                date: commit.commit.author.date
            },
            workspaceFilesCount,
            syncState: 'in_sync',
            message: 'Connected to GitHub repository successfully.'
        };
    } catch (err: any) {
        return {
            configured: true,
            owner: config.owner,
            repo: config.repo,
            branch: config.branch,
            workspaceFilesCount,
            syncState: 'error',
            message: err.message || 'Failed to query GitHub repository'
        };
    }
}

/**
 * List files from the repository directory or workspace
 */
export async function listGitHubFiles(dirPath: string = ''): Promise<GitHubFileItem[]> {
    const config = getGitHubConfig();

    if (config.isConfigured) {
        try {
            const cleanPath = dirPath.replace(/^\//, '');
            const data = await githubRequest(`/repos/${config.owner}/${config.repo}/contents/${cleanPath}?ref=${config.branch}`);
            if (Array.isArray(data)) {
                return data.map((item: any) => ({
                    name: item.name,
                    path: item.path,
                    type: item.type === 'dir' ? 'dir' : 'file',
                    size: item.size,
                    sha: item.sha
                }));
            }
        } catch (e) {
            console.warn('GitHub API listing failed, falling back to local workspace listing:', e);
        }
    }

    // Local workspace fallback listing
    const targetDir = path.join(process.cwd(), dirPath);
    if (!fs.existsSync(targetDir)) {
        return [];
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    return entries
        .filter(entry => !['node_modules', '.git', 'dist'].includes(entry.name))
        .map(entry => {
            const relPath = path.relative(process.cwd(), path.join(targetDir, entry.name));
            return {
                name: entry.name,
                path: relPath,
                type: entry.isDirectory() ? 'dir' : 'file',
                size: entry.isFile() ? fs.statSync(path.join(targetDir, entry.name)).size : undefined
            };
        });
}

/**
 * Show diff / comparison summary between workspace and remote repo
 */
export async function getGitHubDiff(): Promise<{ modified: string[]; added: string[]; deleted: string[]; totalChanges: number }> {
    const config = getGitHubConfig();

    if (!config.isConfigured) {
        return {
            modified: [],
            added: [],
            deleted: [],
            totalChanges: 0
        };
    }

    try {
        // Fetch latest commit tree from remote
        const branchData = await githubRequest(`/repos/${config.owner}/${config.repo}/branches/${config.branch}`);
        const treeSha = branchData.commit.commit.tree.sha;
        const treeData = await githubRequest(`/repos/${config.owner}/${config.repo}/git/trees/${treeSha}?recursive=1`);

        const remoteFiles = new Map<string, string>();
        if (treeData.tree && Array.isArray(treeData.tree)) {
            for (const item of treeData.tree) {
                if (item.type === 'blob') {
                    remoteFiles.set(item.path, item.sha);
                }
            }
        }

        const workspaceRoot = process.cwd();
        const localFiles: string[] = [];

        const walkLocal = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (['node_modules', '.git', 'dist', '.cache'].includes(entry.name)) continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walkLocal(fullPath);
                } else if (entry.isFile()) {
                    const rel = path.relative(workspaceRoot, fullPath);
                    localFiles.push(rel);
                }
            }
        };
        walkLocal(workspaceRoot);

        const added: string[] = [];
        const modified: string[] = [];
        const deleted: string[] = [];

        for (const file of localFiles) {
            if (!remoteFiles.has(file)) {
                added.push(file);
            }
        }

        for (const [remotePath] of remoteFiles) {
            const localPath = path.join(workspaceRoot, remotePath);
            if (!fs.existsSync(localPath)) {
                deleted.push(remotePath);
            }
        }

        return {
            modified,
            added,
            deleted,
            totalChanges: added.length + modified.length + deleted.length
        };
    } catch (e: any) {
        console.error('Error calculating GitHub diff:', e);
        return {
            modified: [],
            added: [],
            deleted: [],
            totalChanges: 0
        };
    }
}

/**
 * Pull latest changes from remote repository into local workspace
 */
export async function pullFromGitHub(): Promise<{ success: boolean; filesUpdated: number; message: string }> {
    const config = getGitHubConfig();

    if (!config.isConfigured) {
        return {
            success: false,
            filesUpdated: 0,
            message: 'GITHUB_TOKEN is required to pull from remote repository.'
        };
    }

    try {
        const branchData = await githubRequest(`/repos/${config.owner}/${config.repo}/branches/${config.branch}`);
        const treeSha = branchData.commit.commit.tree.sha;
        const treeData = await githubRequest(`/repos/${config.owner}/${config.repo}/git/trees/${treeSha}?recursive=1`);

        let filesUpdated = 0;
        const workspaceRoot = process.cwd();

        if (treeData.tree && Array.isArray(treeData.tree)) {
            for (const item of treeData.tree) {
                if (item.type === 'blob') {
                    // Skip ignored files/dirs
                    if (item.path.startsWith('node_modules/') || item.path.startsWith('.git/')) continue;

                    try {
                        const blobData = await githubRequest(`/repos/${config.owner}/${config.repo}/git/blobs/${item.sha}`);
                        const content = Buffer.from(blobData.content, blobData.encoding as BufferEncoding || 'base64');
                        const localPath = path.join(workspaceRoot, item.path);
                        const dir = path.dirname(localPath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        fs.writeFileSync(localPath, content);
                        filesUpdated++;
                    } catch (blobErr) {
                        console.warn(`Failed pulling blob for ${item.path}:`, blobErr);
                    }
                }
            }
        }

        return {
            success: true,
            filesUpdated,
            message: `Successfully pulled ${filesUpdated} files from ${config.owner}/${config.repo}@${config.branch}.`
        };
    } catch (err: any) {
        console.error('Pull from GitHub failed:', err);
        return {
            success: false,
            filesUpdated: 0,
            message: err.message || 'Failed to pull from GitHub'
        };
    }
}

/**
 * Push workspace changes to remote GitHub repository
 */
export async function pushToGitHub(commitMessage: string = 'Update from Kurukoo Workspace'): Promise<{ success: boolean; commitSha?: string; message: string }> {
    const config = getGitHubConfig();

    if (!config.isConfigured) {
        return {
            success: false,
            message: 'GITHUB_TOKEN is required to push to GitHub repository.'
        };
    }

    try {
        // 1. Get branch reference
        const refData = await githubRequest(`/repos/${config.owner}/${config.repo}/git/ref/heads/${config.branch}`);
        const currentCommitSha = refData.object.sha;

        // 2. Get current commit
        const commitData = await githubRequest(`/repos/${config.owner}/${config.repo}/git/commits/${currentCommitSha}`);
        const baseTreeSha = commitData.tree.sha;

        // 3. Scan workspace files to create blobs and tree
        const workspaceRoot = process.cwd();
        const treeItems: Array<{ path: string; mode: string; type: string; sha: string }> = [];

        const walkAndUpload = async (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (['node_modules', '.git', 'dist', '.cache', 'temp_uploads'].includes(entry.name)) continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await walkAndUpload(fullPath);
                } else if (entry.isFile()) {
                    const relPath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');
                    const fileContent = fs.readFileSync(fullPath);
                    
                    // Create blob on GitHub
                    const blobRes = await githubRequest(`/repos/${config.owner}/${config.repo}/git/blobs`, {
                        method: 'POST',
                        body: JSON.stringify({
                            content: fileContent.toString('base64'),
                            encoding: 'base64'
                        })
                    });

                    treeItems.push({
                        path: relPath,
                        mode: '100644',
                        type: 'blob',
                        sha: blobRes.sha
                    });
                }
            }
        };

        await walkAndUpload(workspaceRoot);

        // 4. Create new tree
        const newTree = await githubRequest(`/repos/${config.owner}/${config.repo}/git/trees`, {
            method: 'POST',
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeItems
            })
        });

        // 5. Create new commit
        const newCommit = await githubRequest(`/repos/${config.owner}/${config.repo}/git/commits`, {
            method: 'POST',
            body: JSON.stringify({
                message: commitMessage,
                tree: newTree.sha,
                parents: [currentCommitSha]
            })
        });

        // 6. Update branch ref
        await githubRequest(`/repos/${config.owner}/${config.repo}/git/refs/heads/${config.branch}`, {
            method: 'PATCH',
            body: JSON.stringify({
                sha: newCommit.sha,
                force: false
            })
        });

        return {
            success: true,
            commitSha: newCommit.sha.substring(0, 7),
            message: `Successfully pushed workspace to ${config.owner}/${config.repo}@${config.branch} (Commit: ${newCommit.sha.substring(0, 7)}).`
        };
    } catch (err: any) {
        console.error('Push to GitHub failed:', err);
        return {
            success: false,
            message: err.message || 'Failed to push workspace changes to GitHub'
        };
    }
}
