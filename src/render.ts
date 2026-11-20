// HTML描画（SSR）。ユーザー入力は必ず esc() を通してから埋め込む（設計書 §5.1 層8）。

import { ADMAX, LIMITS, SITE, type Env} from "./config";
import { SERVICE_CARDS} from "./data";
import type { PostRow, ServiceRow} from "./db";
import { esc, formatDateTime, isoOf} from "./security";

export interface PageMeta {
title: string;
description: string;
canonicalPath: string; // 例: "/" "/service/freecash/"
noindex?: boolean;
jsonLd?: unknown[];
showTurnstile?: boolean;
}

function gaScript(env: Env): string {
const id = env.GA_MEASUREMENT_ID;
if (!id) return "";
return `
<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(id)}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${esc(id)}');
</script>`;
}

export function adSlot(): string {
return `
<div class="ad-slot" aria-label="広告">
<div class="ad-label">広告</div>
<div class="ad-sp"><script src="${ADMAX.spScript}"></script></div>
<div class="ad-pc"><script src="${ADMAX.pcScript}"></script></div>
</div>`;
}

export function layout(env: Env, origin: string, meta: PageMeta, bodyHtml: string): string {
const canonical = `${origin}${meta.canonicalPath}`;
const jsonLd = meta.jsonLd?? [];
const turnstileScript =
meta.showTurnstile && env.TURNSTILE_SITE_KEY
? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`
: "";
return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${esc(canonical)}">
${meta.noindex? '<meta name="robots" content="noindex,follow">': ""}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.brand)}">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/assets/style.css">
<link rel="sitemap" type="application/xml" href="/sitemap.xml">
${jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
${gaScript(env)}
${turnstileScript}
</head>
<body>
<header class="site-header">
<div class="wrap header-inner">
<a class="brand" href="/">${esc(SITE.name)}</a>
<nav class="header-nav" aria-label="メインメニュー">
<a href="${esc(SITE.blogBaseUrl)}/" target="_blank" rel="noopener">ポイ活ブログ</a>
<a href="${esc(SITE.hubUrl)}" target="_blank" rel="noopener">メアのポイ活メディア</a>
<a href="/rules">ルール・FAQ</a>
</nav>
</div>
<div class="wrap">
<form class="search-form" action="/search" method="get" role="search">
<input type="search" name="q" placeholder="コード・コメント・表示名で検索" aria-label="掲示板内検索">
<button type="submit">検索</button>
</form>
</div>
</header>
<main class="wrap">
${bodyHtml}
</main>
<footer class="site-footer">
<div class="wrap">
<p class="pr-note">このページには紹介プログラム（広告）が含まれます。掲載している紹介コード・リンクから登録すると、紹介した方に紹介報酬が入る場合があります。利用する方の特典が減ることはありません。</p>
<nav class="footer-nav" aria-label="フッターメニュー">
<a href="/">掲示板トップ</a>
<a href="/rules">ルール・FAQ</a>
<a href="/privacy">プライバシーポリシー</a>
<a href="/terms">利用規約・免責事項</a>
<a href="${esc(SITE.blogBaseUrl)}/" target="_blank" rel="noopener">ポイ活ブログ</a>
<a href="${esc(SITE.xAccount)}" target="_blank" rel="noopener">X（メア）</a>
</nav>
<p class="updated">最終更新日：${esc(SITE.dateModified)}</p>
<p class="copyright">${esc(SITE.name)} by ${esc(SITE.operator)}（${esc(SITE.brand)}）</p>
</div>
</footer>
<script src="/assets/app.js" defer></script>
</body>
</html>`;
}

export function breadcrumbs(origin: string, items: { name: string; path: string}[]): string {
const html = items
.map((item, i) =>
i === items.length - 1
? `<span aria-current="page">${esc(item.name)}</span>`
: `<a href="${esc(item.path)}">${esc(item.name)}</a>`,
)
.join(' <span aria-hidden="true">›</span> ');
return `<nav class="breadcrumbs" aria-label="パンくずリスト">${html}</nav>`;
}

export function breadcrumbJsonLd(
origin: string,
items: { name: string; path: string}[],
): unknown {
return {
"@context": "https://schema.org",
"@type": "BreadcrumbList",
itemListElement: items.map((item, i) => ({
"@type": "ListItem",
position: i + 1,
name: item.name,
item: `${origin}${item.path}`,
})),
};
}

// ---------- 投稿カード ----------
export function postCard(post: PostRow): string {
const comment = post.comment
? `<p class="post-comment">${esc(post.comment)}</p>`
: "";
return `
<article class="post-card">
<div class="post-head">
<a class="service-badge" href="/service/${esc(post.service_slug)}/">${esc(post.service_name)}</a>
<span class="post-name">${esc(post.display_name)}</span>
<time class="post-time" datetime="${esc(isoOf(post.created_at))}">${esc(formatDateTime(post.created_at))}</time>
</div>
<div class="code-row">
<code class="invite-code">${esc(post.invite_code)}</code>
<button type="button" class="copy-btn" data-copy="${esc(post.invite_code)}">コピー</button>
<a class="detail-link" href="/post/${post.id}/">詳細・通報</a>
</div>
${comment}
</article>`;
}

// ---------- ページネーション ----------
export function pagination(basePath: string, page: number, total: number, pageSize: number): string {
const totalPages = Math.max(1, Math.ceil(total / pageSize));
if (totalPages <= 1) return "";
const sep = basePath.includes("?")? "&": "?";
const link = (p: number, label: string, cls = "") =>
`<a class="page-link ${cls}" href="${esc(basePath)}${sep}page=${p}">${label}</a>`;
let html = '<nav class="pagination" aria-label="ページ送り">';
if (page > 1) html += link(page - 1, "← 前へ");
html += `<span class="page-now">${page} / ${totalPages} ページ</span>`;
if (page < totalPages) html += link(page + 1, "次へ →");
html += "</nav>";
return html;
}

// ---------- 投稿フォーム ----------
export function postForm(
env: Env,
services: ServiceRow[],
opts: { selectedSlug?: string; error?: string | null; posted?: boolean} = {},
): string {
const options = services
.map(
(s) =>
`<option value="${esc(s.slug)}"${opts.selectedSlug === s.slug? " selected": ""}>${esc(s.name)}</option>`,
)
.join("");
const turnstile = env.TURNSTILE_SITE_KEY
? `<div class="cf-turnstile" data-sitekey="${esc(env.TURNSTILE_SITE_KEY)}"></div>`
: "";
const error = opts.error
? `<p class="form-error" role="alert">${esc(opts.error)}</p>`
: "";
const ok = opts.posted
? `<p class="form-ok" role="status">投稿できたよ！ありがとう💕 下の一覧に表示されているよ♪</p>`
: "";
return `
<section id="board-form" class="panel form-panel">
<h2>コードを投稿する ✏️</h2>
<form id="post-form" action="/api/posts" method="post">
<div class="field">
<label for="f-service">サービス <span class="req">必須</span></label>
<select id="f-service" name="service" required>
<option value="">選んでください</option>
${options}
</select>
</div>
<div class="field">
<label for="f-name">表示名（任意・未入力なら「某関西人」）</label>
<input id="f-name" type="text" name="display_name" maxlength="${LIMITS.displayNameMaxLength}" placeholder="某関西人">
</div>
<div class="field">
<label for="f-code">紹介コード <span class="req">必須</span></label>
<input id="f-code" type="text" name="invite_code" required maxlength="${LIMITS.codeMaxLength}" placeholder="例：AbC123" autocapitalize="off" autocorrect="off" autocomplete="off">
</div>
<div class="field">
<label for="f-comment">一言コメント（任意・短めに）</label>
<input id="f-comment" type="text" name="comment" maxlength="${LIMITS.commentMaxLength}" placeholder="例：よかったら使ってください">
<p class="char-count"><span id="comment-count">0</span>/${LIMITS.commentMaxLength}</p>
</div>
<div class="hp-field" aria-hidden="true">
<label>この欄は入力しないでください<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
</div>
${turnstile}
${error}
${ok}
<p class="form-error" role="alert" id="form-error" hidden></p>
<button type="submit" class="submit-btn" id="submit-btn">投稿する 💌</button>
<p class="form-note">URL・メールアドレス・電話番号は投稿できません。同じコードの連続投稿（10分以内）もできません。</p>
</form>
</section>`;
}

// ---------- 紹介カード（運営者） ----------
export function operatorCards(services: ServiceRow[]): string {
const cards = services
.map((s) => {
const card = SERVICE_CARDS[s.slug];
if (!card) return "";
const codeRow = card.operatorCode
? `<div class="code-row">
<code class="invite-code">${esc(card.operatorCode)}</code>
<button type="button" class="copy-btn" data-copy="${esc(card.operatorCode)}">コピー</button>
</div>`
: "";
const register = card.operatorUrl
? `<a class="register-btn" href="${esc(card.operatorUrl)}" target="_blank" rel="sponsored noopener">紹介リンクから登録</a>`
: "";
return `
<article class="service-card" id="service-${esc(s.slug)}">
<h3><a href="/service/${esc(s.slug)}/">${esc(s.name)}</a></h3>
<p class="benefit">特典：${esc(card.benefit)}</p>
<p class="blurb">${esc(card.blurb)}</p>
${codeRow}
<div class="card-links">
${register}
<a class="blog-link" href="${esc(SITE.blogBaseUrl)}/articles/${esc(card.blogSlug)}/" target="_blank" rel="noopener">くわしい紹介（ブログ）</a>
<a class="board-link" href="/service/${esc(s.slug)}/">みんなの投稿を見る</a>
</div>
</article>`;
})
.join("");
return `
<section class="cards-section">
<h2>メアの紹介コード ✨</h2>
<p class="section-note">まずはメアのコードを置いておくね♪ もちろん、下の掲示板でみんなのコードから選んでもOKだよ。</p>
<div class="cards-grid">${cards}</div>
</section>`;
}
