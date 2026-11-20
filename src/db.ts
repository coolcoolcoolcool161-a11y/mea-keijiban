// D1 アクセス層。すべてのクエリはプリペアドステートメント（.bind()）を使う（設計書 §5.4）。

import { LIMITS, PAGE_SIZE } from "./config";

export interface ServiceRow {
  id: number;
  slug: string;
  name: string;
  code_label: string;
  has_url: number;
  board_enabled: number;
  category: string;
  sort_order: number;
}

export interface PostRow {
  id: number;
  service_id: number;
  display_name: string;
  invite_code: string;
  comment: string | null;
  status: string;
  created_at: number;
  service_name: string;
  service_slug: string;
}

const POST_SELECT = `
  SELECT p.id, p.service_id, p.display_name, p.invite_code, p.comment, p.status, p.created_at,
         s.name AS service_name, s.slug AS service_slug
  FROM posts p JOIN services s ON s.id = p.service_id
`;

export async function listEnabledServices(db: D1Database): Promise<ServiceRow[]> {
  const res = await db
    .prepare("SELECT * FROM services WHERE board_enabled = 1 ORDER BY sort_order ASC")
    .all<ServiceRow>();
  return res.results;
}

export async function getServiceBySlug(
  db: D1Database,
  slug: string,
): Promise<ServiceRow | null> {
  return db
    .prepare("SELECT * FROM services WHERE slug = ?")
    .bind(slug)
    .first<ServiceRow>();
}

export async function countPosts(
  db: D1Database,
  serviceId?: number,
): Promise<number> {
  const row = serviceId
    ? await db
        .prepare("SELECT COUNT(*) AS cnt FROM posts WHERE status = 'published' AND service_id = ?")
        .bind(serviceId)
        .first<{ cnt: number }>()
    : await db
        .prepare("SELECT COUNT(*) AS cnt FROM posts WHERE status = 'published'")
        .first<{ cnt: number }>();
  return row?.cnt ?? 0;
}

export async function listPosts(
  db: D1Database,
  opts: { serviceId?: number; page: number },
): Promise<PostRow[]> {
  const offset = (opts.page - 1) * PAGE_SIZE;
  const stmt = opts.serviceId
    ? db
        .prepare(
          `${POST_SELECT} WHERE p.status = 'published' AND p.service_id = ? ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
        )
        .bind(opts.serviceId, PAGE_SIZE, offset)
    : db
        .prepare(
          `${POST_SELECT} WHERE p.status = 'published' ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
        )
        .bind(PAGE_SIZE, offset);
  const res = await stmt.all<PostRow>();
  return res.results;
}

export async function getPost(db: D1Database, id: number): Promise<PostRow | null> {
  return db
    .prepare(`${POST_SELECT} WHERE p.id = ? AND p.status = 'published'`)
    .bind(id)
    .first<PostRow>();
}

export async function searchPosts(
  db: D1Database,
  query: string,
  page: number,
): Promise<{ posts: PostRow[]; total: number }> {
  const like = `%${query}%`;
  const totalRow = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM posts p
       WHERE p.status = 'published'
         AND (p.invite_code LIKE ? OR p.comment LIKE ? OR p.display_name LIKE ?)`,
    )
    .bind(like, like, like)
    .first<{ cnt: number }>();
  const offset = (page - 1) * PAGE_SIZE;
  const res = await db
    .prepare(
      `${POST_SELECT}
       WHERE p.status = 'published'
         AND (p.invite_code LIKE ? OR p.comment LIKE ? OR p.display_name LIKE ?)
       ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    )
    .bind(like, like, like, PAGE_SIZE, offset)
    .all<PostRow>();
  return { posts: res.results, total: totalRow?.cnt ?? 0 };
}

/** 同一コードの直近投稿（10分ブロック判定用）。設計書 §4.4 のとおりコード全体で判定する。 */
export async function findRecentPostByCode(
  db: D1Database,
  inviteCode: string,
  sinceUnix: number,
): Promise<{ id: number } | null> {
  return db
    .prepare("SELECT id FROM posts WHERE invite_code = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 1")
    .bind(inviteCode, sinceUnix)
    .first<{ id: number }>();
}

/** 同一IPの最終投稿時刻（連続投稿ブロック判定用）。 */
export async function lastPostAtByIp(
  db: D1Database,
  ipHash: string,
): Promise<number | null> {
  const row = await db
    .prepare("SELECT MAX(created_at) AS last_at FROM posts WHERE ip_hash = ?")
    .bind(ipHash)
    .first<{ last_at: number | null }>();
  return row?.last_at ?? null;
}

/** 同一IPの直近1時間の投稿数（rate_limits テーブルで計測。設計書 §5.5）。 */
export async function postsInLastHourByIp(
  db: D1Database,
  ipHash: string,
  nowUnix: number,
): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(SUM(count), 0) AS total FROM rate_limits WHERE ip_hash = ? AND window_start >= ?")
    .bind(ipHash, nowUnix - 3600)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

/** レート制限カウンタを1時間バケットで加算する。 */
export async function recordRateLimitHit(
  db: D1Database,
  ipHash: string,
  nowUnix: number,
): Promise<void> {
  const windowStart = Math.floor(nowUnix / 3600) * 3600;
  await db
    .prepare(
      `INSERT INTO rate_limits (ip_hash, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT (ip_hash, window_start) DO UPDATE SET count = count + 1`,
    )
    .bind(ipHash, windowStart)
    .run();
}

export async function createPost(
  db: D1Database,
  args: {
    serviceId: number;
    displayName: string;
    inviteCode: string;
    comment: string;
    ipHash: string;
    userAgent: string | null;
    turnstileOk: number;
    nowUnix: number;
  },
): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO posts (service_id, display_name, invite_code, comment, status, ip_hash, user_agent, turnstile_ok, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      args.serviceId,
      args.displayName,
      args.inviteCode,
      args.comment || null,
      args.ipHash,
      args.userAgent,
      args.turnstileOk,
      args.nowUnix,
      args.nowUnix,
    )
    .first<{ id: number }>();
  if (!res) throw new Error("insert failed");
  return res.id;
}

export async function countReportsInLastHourByIp(
  db: D1Database,
  ipHash: string,
  nowUnix: number,
): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) AS cnt FROM reports WHERE ip_hash = ? AND created_at >= ?")
    .bind(ipHash, nowUnix - 3600)
    .first<{ cnt: number }>();
  return row?.cnt ?? 0;
}

export async function createReport(
  db: D1Database,
  args: { postId: number; reason: string; detail: string; ipHash: string; nowUnix: number },
): Promise<void> {
  await db.batch([
    db
      .prepare("INSERT INTO reports (post_id, reason, detail, ip_hash, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(args.postId, args.reason, args.detail || null, args.ipHash, args.nowUnix),
    db
      .prepare("UPDATE posts SET report_count = report_count + 1, updated_at = ? WHERE id = ?")
      .bind(args.nowUnix, args.postId),
  ]);
}

/** サイトマップ用：公開中の最新投稿（上限つき）。 */
export async function listPostsForSitemap(
  db: D1Database,
  limit: number,
): Promise<{ id: number; created_at: number }[]> {
  const res = await db
    .prepare("SELECT id, created_at FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<{ id: number; created_at: number }>();
  return res.results;
}

export { LIMITS };
