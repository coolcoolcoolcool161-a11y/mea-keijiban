// ページ描画とAPIのハンドラ（設計書 §3.2 のルーティング）。

import { LIMITS, PAGE_SIZE, REPORT_REASONS, SITE, type Env} from "./config";
import { SERVICE_CARDS} from "./data";
import {
countPosts,
countReportsInLastHourByIp,
createPost,
createReport,
findRecentPostByCode,
getPost,
getServiceBySlug,
lastPostAtByIp,
listEnabledServices,
listPosts,
listPostsForSitemap,
postsInLastHourByIp,
recordRateLimitHit,
searchPosts,
type PostRow,
type ServiceRow,
} from "./db";
import { ipHashOf, spamProblem, validatePostInput, esc} from "./security";
import { verifyTurnstile} from "./turnstile";
import {
adSlot,
breadcrumbJsonLd,
breadcrumbs,
layout,
operatorCards,
pagination,
postCard,
postForm,
} from "./render";
import { FAQS, PRIVACY_HTML, RULES_HTML, TERMS_HTML, faqHtml} from "./content";

// ---------- レスポンス補助 ----------
export function htmlResponse(html: string, status = 200, cache = "public, max-age=60"): Response {
return new Response(html, {
status,
headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": cache},
});
}

function jsonResponse(data: unknown, status = 200): Response {
return new Response(JSON.stringify(data), {
status,
headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"},
});
}

function pageParam(url: URL): number {
const p = Number.parseInt(url.searchParams.get("page")?? "1", 10);
return Number.isFinite(p) && p > 0? p: 1;
}

function postToJson(post: PostRow) {
return {
id: post.id,
service: post.service_name,
service_slug: post.service_slug,
display_name: post.display_name,
invite_code: post.invite_code,
comment: post.comment?? "",
created_at: new Date(post.created_at * 1000).toISOString(),
};
}

// ---------- トップ ----------
export async function homePage(env: Env, request: Request): Promise<Response> {
const url = new URL(request.url);
const origin = url.origin;
const page = pageParam(url);
const [services, total] = await Promise.all([listEnabledServices(env.DB), countPosts(env.DB)]);
const posts = await listPosts(env.DB, { page});
const chips = [
`<a class="chip chip-active" href="/">すべて</a>`,
...services.map(
(s) => `<a class="chip" href="/service/${esc(s.slug)}/">${esc(s.name)}</a>`,
),
].join("");
const body = `
${breadcrumbs(origin, [{ name: SITE.name, path: "/"}])}
<section class="hero">
<h1>${esc(SITE.name)} 💌</h1>
<p>ポイ活の紹介コードを、みんなで投稿し合える掲示板だよ💕 使いたいコードを探したり、自分のコードを載せて使ってもらったりできるの✨ 投稿はずっと残るから、後から見に来てくれた人にも届くよ♪</p>
<p class="pr-note">このページには紹介プログラム（広告）が含まれます。くわしくは各ページ下部の表記を見てね。</p>
</section>
${adSlot()}
${operatorCards(services)}
<section class="panel rules-summary">
<h2>掲示板のお約束 📝</h2>
<ul class="rule-list">
<li>投稿できるのは、この掲示板で紹介している14サービスの紹介コードだけだよ。</li>
<li>URLの投稿は禁止だよ（URLスパム防止のため）。紹介コードだけを載せてね。</li>
<li>メールアドレス・電話番号などの個人情報は絶対に載せないでね。</li>
<li>みんなが気持ちよく使えるように、同じコードの連続投稿は控えてね♪</li>
</ul>
<p><a href="/rules">ルール・FAQをくわしく見る</a></p>
</section>
${postForm(env, services, {
error: url.searchParams.get("error"),
posted: url.searchParams.get("posted") === "1",
})}
<section class="list-section">
<h2>投稿一覧（新しい順）✨</h2>
<div class="chips">${chips}</div>
<div class="post-list">
${posts.length? posts.map(postCard).join(""): '<p class="empty">まだ投稿がないよ。最初の投稿をしてみない？💕</p>'}
</div>
${pagination("/", page, total, PAGE_SIZE)}
</section>
${adSlot()}
${faqHtml()}
`;
const jsonLd = [
{
"@context": "https://schema.org",
"@type": "WebSite",
name: SITE.name,
url: `${origin}/`,
potentialAction: {
"@type": "SearchAction",
target: `${origin}/search?q={query}`,
"query-input": "required name=query",
},
},
{
"@context": "https://schema.org",
"@type": "ItemList",
itemListElement: posts.map((p, i) => ({
"@type": "ListItem",
position: i + 1,
url: `${origin}/post/${p.id}/`,
name: `${p.service_name}の紹介コード`,
})),
},
];
return htmlResponse(
layout(env, origin, {
title: `${SITE.name}｜${SITE.brand}`,
description: SITE.description,
canonicalPath: "/",
jsonLd,
showTurnstile: true,
}, body),
);
}

// ---------- サービス別一覧 ----------
export async function servicePage(env: Env, request: Request, slug: string): Promise<Response> {
const url = new URL(request.url);
const origin = url.origin;
const service = await getServiceBySlug(env.DB, slug);
if (!service || service.board_enabled!== 1) return notFoundPage(env, request);
const page = pageParam(url);
const [services, total, posts] = await Promise.all([
listEnabledServices(env.DB),
countPosts(env.DB, service.id),
listPosts(env.DB, { serviceId: service.id, page}),
]);
const card = SERVICE_CARDS[slug];
const cardInfo = card
? `<section class="panel service-info">
<p class="benefit">メアのコード特典：${esc(card.benefit)}</p>
<p>${esc(card.blurb)}</p>
<p><a href="${esc(SITE.blogBaseUrl)}/articles/${esc(card.blogSlug)}/" target="_blank" rel="noopener">${esc(service.name)}のくわしい紹介（ブログ）を見る</a></p>
</section>`
: "";
const crumbs = [
{ name: SITE.name, path: "/"},
{ name: `${service.name}の投稿`, path: `/service/${slug}/`},
];
const body = `
${breadcrumbs(origin, crumbs)}
<h1>${esc(service.name)}の紹介コード掲示板</h1>
${cardInfo}
${postForm(env, services, {
selectedSlug: slug,
error: url.searchParams.get("error"),
posted: url.searchParams.get("posted") === "1",
})}
<section class="list-section">
<h2>${esc(service.name)}の投稿一覧（新しい順）</h2>
<div class="post-list">
${posts.length? posts.map(postCard).join(""): `<p class="empty">${esc(service.name)}の投稿はまだないよ。最初の投稿をしてみない？💕</p>`}
</div>
${pagination(`/service/${slug}/`, page, total, PAGE_SIZE)}
</section>
${adSlot()}
`;
return htmlResponse(
layout(env, origin, {
title: `${service.name}の紹介コード掲示板｜${SITE.name}`,
description: `${service.name}の紹介コード・招待コードの投稿一覧。みんなのコードを探したり、自分のコードを投稿したりできます。`,
canonicalPath: `/service/${slug}/`,
jsonLd: [
breadcrumbJsonLd(origin, crumbs),
{
"@context": "https://schema.org",
"@type": "ItemList",
itemListElement: posts.map((p, i) => ({
"@type": "ListItem",
position: i + 1,
url: `${origin}/post/${p.id}/`,
name: `${p.service_name}の紹介コード`,
})),
},
],
showTurnstile: true,
}, body),
);
}

// ---------- 投稿詳細 ----------
export async function postPage(env: Env, request: Request, id: number): Promise<Response> {
const url = new URL(request.url);
const origin = url.origin;
const post = await getPost(env.DB, id);
if (!post) return notFoundPage(env, request);
const crumbs = [
{ name: SITE.name, path: "/"},
{ name: `${post.service_name}の投稿`, path: `/service/${post.service_slug}/`},
{ name: "投稿の詳細", path: `/post/${post.id}/`},
];
const reported = url.searchParams.get("reported") === "1";
const reportError = url.searchParams.get("error");
const reasonOptions = REPORT_REASONS.map(
(r) => `<option value="${esc(r.value)}">${esc(r.label)}</option>`,
).join("");
const body = `
${breadcrumbs(origin, crumbs)}
<h1>${esc(post.service_name)}の紹介コード</h1>
<div class="post-list">
${postCard(post)}
</div>
<section class="panel">
<h2>このコードの使い方</h2>
<p>${esc(post.service_name)}の登録画面やアプリ内のコード入力欄で、上記の紹介コードを入力してください。くわしい手順と特典の条件は、ブログの紹介文で確認できます。</p>
<p><a href="${esc(SITE.blogBaseUrl)}/articles/${esc(SERVICE_CARDS[post.service_slug]?.blogSlug?? post.service_slug)}/" target="_blank" rel="noopener">${esc(post.service_name)}のくわしい紹介（ブログ）を見る</a></p>
<p><a href="/service/${esc(post.service_slug)}/">${esc(post.service_name)}の投稿一覧へ戻る</a></p>
</section>
<section class="panel" id="report">
<h2>この投稿を通報する</h2>
<p>ルールに反する投稿を見つけたら、こちらから教えてください。運営が確認して対応します。</p>
${reported? '<p class="form-ok" role="status">通報を受け付けました。確認ありがとうございます。</p>': ""}
${reportError? `<p class="form-error" role="alert">${esc(reportError)}</p>`: ""}
<form id="report-form" action="/api/report" method="post">
<input type="hidden" name="post_id" value="${post.id}">
<div class="field">
<label for="r-reason">理由 <span class="req">必須</span></label>
<select id="r-reason" name="reason" required>
<option value="">選んでください</option>
${reasonOptions}
</select>
</div>
<div class="field">
<label for="r-detail">詳細（任意）</label>
<textarea id="r-detail" name="detail" rows="3" maxlength="${LIMITS.reportDetailMaxLength}" placeholder="気づいた点を短く書いてください"></textarea>
</div>
<p class="form-error" role="alert" id="report-error" hidden></p>
<button type="submit" class="submit-btn sub">通報する</button>
</form>
</section>
`;
return htmlResponse(
layout(env, origin, {
title: `${post.service_name}の紹介コード「${post.invite_code}」｜${SITE.name}`,
description: `${post.service_name}の紹介コードの投稿詳細。コードのコピーと、ブログのくわしい紹介へのリンクがあります。`,
canonicalPath: `/post/${post.id}/`,
jsonLd: [breadcrumbJsonLd(origin, crumbs)],
}, body),
);
}

// ---------- 検索 ----------
export async function searchPage(env: Env, request: Request): Promise<Response> {
const url = new URL(request.url);
const origin = url.origin;
const q = (url.searchParams.get("q")?? "").trim().slice(0, 100);
const page = pageParam(url);
let resultsHtml = '<p class="empty">検索ワードを入力してね。</p>';
let paging = "";
if (q) {
const { posts, total} = await searchPosts(env.DB, q, page);
resultsHtml = posts.length
? posts.map(postCard).join("")
: '<p class="empty">見つからなかったよ💦 ワードを変えて試してみてね。</p>';
paging = pagination(`/search?q=${encodeURIComponent(q)}`, page, total, PAGE_SIZE);
}
const body = `
${breadcrumbs(origin, [
{ name: SITE.name, path: "/"},
{ name: "検索結果", path: "/search"},
])}
<h1>掲示板内検索</h1>
<form class="search-form big" action="/search" method="get" role="search">
<input type="search" name="q" value="${esc(q)}" placeholder="コード・コメント・表示名で検索" aria-label="掲示板内検索">
<button type="submit">検索</button>
</form>
<section class="list-section">
<div class="post-list">${resultsHtml}</div>
${paging}
</section>
`;
return htmlResponse(
layout(env, origin, {
title: `検索結果｜${SITE.name}`,
description: "掲示板内の紹介コード・コメント・表示名を検索できます。",
canonicalPath: "/search",
noindex: true,
}, body),
200,
"no-store",
);
}

// ---------- 固定ページ ----------
export function rulesPage(env: Env, request: Request): Response {
const url = new URL(request.url);
const body = `
${breadcrumbs(url.origin, [
{ name: SITE.name, path: "/"},
{ name: "ルール・FAQ", path: "/rules"},
])}
<h1>ルール・FAQ</h1>
${RULES_HTML}
${faqHtml()}
`;
return htmlResponse(
layout(env, url.origin, {
title: `ルール・FAQ｜${SITE.name}`,
description: "掲示板の投稿ルールとよくある質問。URL・個人情報の投稿禁止、連続投稿の制限など。",
canonicalPath: "/rules",
jsonLd: [
{
"@context": "https://schema.org",
"@type": "FAQPage",
mainEntity: FAQS.map((f) => ({
"@type": "Question",
name: f.q,
acceptedAnswer: { "@type": "Answer", text: f.a},
})),
},
],
}, body),
);
}

export function privacyPage(env: Env, request: Request): Response {
const url = new URL(request.url);
return htmlResponse(
layout(env, url.origin, {
title: `プライバシーポリシー｜${SITE.name}`,
description: "本サイトが個人情報をどのように扱うかを定めたものです。",
canonicalPath: "/privacy",
}, `${breadcrumbs(url.origin, [
{ name: SITE.name, path: "/"},
{ name: "プライバシーポリシー", path: "/privacy"},
])}${PRIVACY_HTML}`),
);
}

export function termsPage(env: Env, request: Request): Response {
const url = new URL(request.url);
return htmlResponse(
layout(env, url.origin, {
title: `利用規約・免責事項｜${SITE.name}`,
description: "本サイトを利用する際のルールと、情報の取り扱いに関する免責事項です。",
canonicalPath: "/terms",
}, `${breadcrumbs(url.origin, [
{ name: SITE.name, path: "/"},
{ name: "利用規約・免責事項", path: "/terms"},
])}${TERMS_HTML}`),
);
}

export function notFoundPage(env: Env, request: Request): Response {
const url = new URL(request.url);
const body = `
<h1>ページが見つかりませんでした</h1>
<p>お探しのページは、移動したか、まだ公開されていない可能性があります。</p>
<p><a href="/">掲示板トップへ戻る</a></p>`;
return htmlResponse(
layout(env, url.origin, {
title: `ページが見つかりません｜${SITE.name}`,
description: "お探しのページは見つかりませんでした。",
canonicalPath: "/404",
noindex: true,
}, body),
404,
"no-store",
);
}

// ---------- サイトマップ / robots ----------
export async function sitemapXml(env: Env, request: Request): Promise<Response> {
const origin = new URL(request.url).origin;
const [services, posts] = await Promise.all([
listEnabledServices(env.DB),
listPostsForSitemap(env.DB, 500),
]);
const entry = (path: string, lastmod?: number) =>
` <url><loc>${esc(origin)}${esc(path)}</loc>${lastmod? `<lastmod>${new Date(lastmod * 1000).toISOString().slice(0, 10)}</lastmod>`: ""}</url>`;
const lines = [
entry("/"),
entry("/rules"),
entry("/privacy"),
entry("/terms"),
...services.map((s) => entry(`/service/${s.slug}/`)),
...posts.map((p) => entry(`/post/${p.id}/`, p.created_at)),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>`;
return new Response(xml, {
headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300"},
});
}

export function robotsTxt(request: Request): Response {
const origin = new URL(request.url).origin;
return new Response(
`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`,
{ headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600"}},
);
}

// ---------- API: 一覧 ----------
export async function apiListPosts(env: Env, request: Request): Promise<Response> {
const url = new URL(request.url);
const page = pageParam(url);
const slug = url.searchParams.get("service");
let service: ServiceRow | null = null;
if (slug) {
service = await getServiceBySlug(env.DB, slug);
if (!service || service.board_enabled!== 1) {
return jsonResponse({ error: "対象のサービスが見つかりません。"}, 404);
}
}
const [total, posts] = await Promise.all([
countPosts(env.DB, service?.id),
listPosts(env.DB, { serviceId: service?.id, page}),
]);
return jsonResponse({ posts: posts.map(postToJson), total, page, pageSize: PAGE_SIZE});
}

// ---------- API: 投稿作成 ----------
interface ParsedBody {
fields: Record<string, string>;
isJson: boolean;
}

async function parseBody(request: Request): Promise<ParsedBody> {
const contentType = request.headers.get("Content-Type")?? "";
if (contentType.includes("application/json")) {
const data = (await request.json().catch(() => ({}))) as Record<string, unknown>;
const fields: Record<string, string> = {};
for (const [k, v] of Object.entries(data)) {
fields[k] =
typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : "";
}
return { fields, isJson: true};
}
const form = await request.formData();
const fields: Record<string, string> = {};
for (const [k, v] of form.entries()) fields[k] = typeof v === "string"? v: "";
return { fields, isJson: false};
}

function fail(
parsed: ParsedBody,
backTo: string,
message: string,
status: number,
): Response {
if (parsed.isJson) return jsonResponse({ ok: false, error: message}, status);
// フラグメント（#board-form 等）がある場合は、その前にクエリを差し込む
const hashIdx = backTo.indexOf("#");
const base = hashIdx >= 0 ? backTo.slice(0, hashIdx) : backTo;
const fragment = hashIdx >= 0 ? backTo.slice(hashIdx) : "";
const sep = base.includes("?") ? "&" : "?";
return new Response(null, {
status: 303,
headers: { Location: `${base}${sep}error=${encodeURIComponent(message)}${fragment}`},
});
}

export async function apiCreatePost(env: Env, request: Request): Promise<Response> {
const contentLength = Number(request.headers.get("Content-Length")?? "0");
if (contentLength > LIMITS.bodyMaxBytes) {
return jsonResponse({ ok: false, error: "投稿サイズが大きすぎます。"}, 413);
}
const parsed = await parseBody(request);
const f = parsed.fields;
const serviceSlug = (f.service?? "").trim();
const backTo = serviceSlug? `/service/${serviceSlug}/`: "/";
const backWithForm = `${backTo}#board-form`;

// Origin チェック（CSRF対策の補助）
const origin = request.headers.get("Origin");
if (origin) {
try {
if (new URL(origin).host!== new URL(request.url).host) {
return fail(parsed, backWithForm, "送信元が確認できませんでした。", 403);
}
} catch {
return fail(parsed, backWithForm, "送信元が確認できませんでした。", 403);
}
}
// ハニーポット（人間には見えない欄。入力されていたら bot とみなす）
if ((f.website?? "").trim()!== "") {
return fail(parsed, backWithForm, "投稿できませんでした。", 400);
}

const validated = validatePostInput({
serviceSlug,
displayName: f.display_name?? "",
inviteCode: f.invite_code?? "",
comment: f.comment?? "",
});
if ("error" in validated) return fail(parsed, backWithForm, validated.error, 400);
const input = validated.input;

const service = await getServiceBySlug(env.DB, input.serviceSlug);
if (!service || service.board_enabled!== 1) {
return fail(parsed, backWithForm, "対象のサービスを選んでください。", 400);
}

// Turnstile 検証（キー未設定の環境ではスキップ）
const remoteIp = request.headers.get("CF-Connecting-IP");
const turnstile = await verifyTurnstile(
f["cf-turnstile-response"]?? null,
remoteIp,
env.TURNSTILE_SECRET_KEY,
);
if (!turnstile.ok) return fail(parsed, backWithForm, turnstile.error, 400);

const now = Math.floor(Date.now() / 1000);
const ipHash = await ipHashOf(request, env.IP_HASH_SALT?? "");

// レート制限: 1分以内の連続投稿
const lastAt = await lastPostAtByIp(env.DB, ipHash);
if (lastAt!== null && now - lastAt < LIMITS.minPostIntervalSec) {
return fail(parsed, backWithForm, "連続投稿は控えて、少し時間をおいてください。", 429);
}
// レート制限: 1時間に5件まで
const hourCount = await postsInLastHourByIp(env.DB, ipHash, now);
if (hourCount >= LIMITS.postsPerHourPerIp) {
return fail(parsed, backWithForm, "1時間あたりの投稿上限に達しました。時間をおいてください。", 429);
}
// 同一コードの10分以内再投稿ブロック
const dup = await findRecentPostByCode(env.DB, input.inviteCode, now - LIMITS.duplicateCodeWindowSec);
if (dup) {
return fail(
parsed,
backWithForm,
"同じコードが投稿されたばかりです。連続投稿は控えて、しばらく時間をおいてください。",
400,
);
}

const id = await createPost(env.DB, {
serviceId: service.id,
displayName: input.displayName || "某関西人",
inviteCode: input.inviteCode,
comment: input.comment,
ipHash,
userAgent: request.headers.get("User-Agent"),
turnstileOk: turnstile.skipped? 0: 1,
nowUnix: now,
});
await recordRateLimitHit(env.DB, ipHash, now);

if (parsed.isJson) return jsonResponse({ ok: true, id});
const sep = backTo.includes("?")? "&": "?";
return new Response(null, {
status: 303,
headers: { Location: `${backTo}${sep}posted=1#board-form`},
});
}

// ---------- API: 通報 ----------
export async function apiReport(env: Env, request: Request): Promise<Response> {
const parsed = await parseBody(request);
const f = parsed.fields;
const postId = Number.parseInt(f.post_id?? "", 10);
const backTo = Number.isFinite(postId)? `/post/${postId}/`: "/";
const backWithForm = `${backTo}#report`;

const origin = request.headers.get("Origin");
if (origin) {
try {
if (new URL(origin).host!== new URL(request.url).host) {
return fail(parsed, backWithForm, "送信元が確認できませんでした。", 403);
}
} catch {
return fail(parsed, backWithForm, "送信元が確認できませんでした。", 403);
}
}
if (!Number.isFinite(postId) || postId <= 0) {
return fail(parsed, backWithForm, "通報対象の投稿が見つかりません。", 400);
}
const reason = (f.reason?? "").trim();
if (!REPORT_REASONS.some((r) => r.value === reason)) {
return fail(parsed, backWithForm, "通報の理由を選んでください。", 400);
}
const detail = (f.detail?? "").trim();
if (detail.length > LIMITS.reportDetailMaxLength) {
return fail(parsed, backWithForm, `詳細は${LIMITS.reportDetailMaxLength}文字以内で入力してください。`, 400);
}
const problem = spamProblem([detail]);
if (problem) return fail(parsed, backWithForm, problem, 400);

const post = await getPost(env.DB, postId);
if (!post) return fail(parsed, backWithForm, "通報対象の投稿が見つかりません。", 404);

const now = Math.floor(Date.now() / 1000);
const ipHash = await ipHashOf(request, env.IP_HASH_SALT?? "");
const reportCount = await countReportsInLastHourByIp(env.DB, ipHash, now);
if (reportCount >= LIMITS.reportsPerHourPerIp) {
return fail(parsed, backWithForm, "通報の上限に達しました。時間をおいてください。", 429);
}
await createReport(env.DB, { postId, reason, detail, ipHash, nowUnix: now});

if (parsed.isJson) return jsonResponse({ ok: true});
const sep = backTo.includes("?")? "&": "?";
return new Response(null, {
status: 303,
headers: { Location: `${backTo}${sep}reported=1#report`},
});
}
