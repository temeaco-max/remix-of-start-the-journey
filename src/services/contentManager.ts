import fs from 'fs';
import path from 'path';
import { getDb, saveDb } from '../database.js';

export interface ContentItem {
    slug: string;
    title: string;
    body: string;
    type: 'blog' | 'help' | 'legal' | 'page';
    author: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BlogArticle {
    slug: string;
    title: string;
    date: string;
    author: string;
    category: string;
    content: string;
}

export interface BlogMetadata {
    slug: string;
    title: string;
    date: string;
    author: string;
    category: string;
}

// Simple manual markdown to html converter
export function convertMarkdownToHtml(markdown: string): string {
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;

    for (let line of lines) {
        line = line.trim();
        if (!line) {
            if (inList) {
                html += '</ul>\n';
                inList = false;
            }
            continue;
        }

        // Headers
        if (line.startsWith('# ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h1>${line.slice(2)}</h1>\n`;
        } else if (line.startsWith('## ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h2>${line.slice(3)}</h2>\n`;
        } else if (line.startsWith('### ')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h3>${line.slice(4)}</h3>\n`;
        }
        // Lists
        else if (line.startsWith('- ')) {
            if (!inList) {
                html += '<ul>\n';
                inList = true;
            }
            const cleanLine = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `  <li>${cleanLine}</li>\n`;
        }
        // Paragraphs
        else {
            if (inList) { html += '</ul>\n'; inList = false; }
            const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `<p>${cleanLine}</p>\n`;
        }
    }

    if (inList) {
        html += '</ul>\n';
    }

    return html;
}

export async function getAllContent(type?: string): Promise<ContentItem[]> {
    const db = await getDb();
    let query = `SELECT slug, title, body, type, author, created_at, updated_at FROM content`;
    let params: any[] = [];
    if (type) {
        query += ` WHERE type = ?`;
        params.push(type);
    }
    const rows = db.exec(query, params);
    if (rows.length === 0) return [];

    const items: ContentItem[] = [];
    const columns = rows[0].columns;
    for (const values of rows[0].values) {
        const item: any = {};
        columns.forEach((col: string, idx: number) => {
            const camelKey = col.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            item[camelKey] = values[idx];
        });
        items.push(item as ContentItem);
    }
    return items;
}

export async function getContentBySlug(slug: string): Promise<ContentItem | null> {
    const db = await getDb();
    const rows = db.exec(`SELECT slug, title, body, type, author, created_at, updated_at FROM content WHERE slug = ?`, [slug]);
    if (rows.length === 0) return null;

    const columns = rows[0].columns;
    const values = rows[0].values[0];
    const item: any = {};
    columns.forEach((col: string, idx: number) => {
        const camelKey = col.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        item[camelKey] = values[idx];
    });
    return item as ContentItem;
}

export async function saveContent(item: ContentItem): Promise<void> {
    const db = await getDb();
    db.run(
        `INSERT INTO content (slug, title, body, type, author) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(slug) DO UPDATE SET title=excluded.title, body=excluded.body, type=excluded.type, author=excluded.author, updated_at=datetime('now')`,
        [item.slug, item.title, item.body, item.type, item.author]
    );
    saveDb();
}

export async function deleteContentBySlug(slug: string): Promise<void> {
    const db = await getDb();
    db.run(`DELETE FROM content WHERE slug = ?`, [slug]);
    saveDb();
}

export async function migrateBlogFilesToDb(): Promise<void> {
    const db = await getDb();
    const blogDir = path.join(process.cwd(), 'content', 'blog');
    if (!fs.existsSync(blogDir)) {
        return;
    }
    const files = fs.readdirSync(blogDir);
    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const slug = file.replace('.md', '');

        const existing = db.exec(`SELECT count(*) FROM content WHERE slug = ?`, [slug]);
        if (existing.length > 0 && existing[0].values[0][0] > 0) {
            continue;
        }

        try {
            const filePath = path.join(blogDir, file);
            const rawContent = fs.readFileSync(filePath, 'utf-8');

            const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            const frontmatter: Record<string, string> = {};
            let bodyContent = rawContent;

            if (match) {
                bodyContent = rawContent.slice(match[0].length);
                const fmLines = match[1].split('\n');
                for (const line of fmLines) {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx !== -1) {
                        const key = line.slice(0, colonIdx).trim().toLowerCase();
                        const val = line.slice(colonIdx + 1).trim();
                        frontmatter[key] = val;
                    }
                }
            }

            const title = frontmatter.title || 'Untitled Post';
            const author = frontmatter.author || 'Kurukoo Team';

            db.run(
                `INSERT INTO content (slug, title, body, type, author) VALUES (?, ?, ?, 'blog', ?)`,
                [slug, title, bodyContent.trim(), author]
            );
            saveDb();
            console.log(`Migrated blog file: ${slug} to database`);
        } catch (err) {
            console.error(`Error migrating blog file ${file}:`, err);
        }
    }
}

// Compatibility legacy blog functions updated to database-backed ESM queries
export async function getAllBlogArticles(): Promise<BlogMetadata[]> {
    const items = await getAllContent('blog');
    return items.map(item => ({
        slug: item.slug,
        title: item.title,
        date: item.createdAt ? item.createdAt.split(' ')[0] : '2026-07-28',
        author: item.author,
        category: 'Blog'
    }));
}

export async function getBlogArticleBySlug(slug: string): Promise<BlogArticle | null> {
    const item = await getContentBySlug(slug);
    if (!item || item.type !== 'blog') return null;
    return {
        slug: item.slug,
        title: item.title,
        date: item.createdAt ? item.createdAt.split(' ')[0] : '2026-07-28',
        author: item.author,
        category: 'Blog',
        content: convertMarkdownToHtml(item.body)
    };
}
