// Worker エントリ: ルーティングとセキュリティヘッダー。
// 静的アセット（/assets/*）は wrangler.toml の [assets] により Worker を介さず配信される。

import type { Env } from "./config";
import {
  apiCreatePost,
  apiListPosts,
  apiReport,
  homePage,
  notFoundPage,
  postPage,
  privacyPage,
  robotsTxt,
  rulesPage,
  searchPage,
  servicePage,
  sitemapXml,
  termsPage,
} from "./pages";

function withSecurityHeaders(res: Response): Response {
  const next = new Response(res.body, res);
  next.headers.set("X-Content-Type-Options", "nosniff");
  next.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  next.headers.set("X-Frame-Options", "DENY");
  next.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' https://adm.shinobi.jp https://challenges.cloudflare.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "frame-src https://challenges.cloudflare.com",
      "connect-src 'self' https://challenges.cloudflare.com https://www.google-analytics.com",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  return next;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // 末尾スラッシュを正規化（ルート以外）
    let path = url.pathname;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

    let res: Response;
    try {
      if (request.method === "GET" || request.method === "HEAD") {
        if (path === "/") res = await homePage(env, request);
        else if (path === "/rules") res = rulesPage(env, request);
        else if (path === "/privacy") res = privacyPage(env, request);
        else if (path === "/terms") res = termsPage(env, request);
        else if (path === "/search") res = await searchPage(env, request);
        else if (path === "/sitemap.xml") res = await sitemapXml(env, request);
        else if (path === "/robots.txt") res = robotsTxt(request);
        else if (path === "/api/posts") res = await apiListPosts(env, request);
        else if (path.startsWith("/service/"))
          res = await servicePage(env, request, decodeURIComponent(path.slice("/service/".length)));
        else if (path.startsWith("/post/")) {
          const id = Number.parseInt(path.slice("/post/".length), 10);
          res = Number.isFinite(id) ? await postPage(env, request, id) : notFoundPage(env, request);
        } else res = notFoundPage(env, request);
      } else if (request.method === "POST") {
        if (path === "/api/posts") res = await apiCreatePost(env, request);
        else if (path === "/api/report") res = await apiReport(env, request);
        else res = notFoundPage(env, request);
      } else {
        res = new Response("Method Not Allowed", { status: 405 });
      }
    } catch (err) {
      console.error("unhandled error", err);
      res = new Response("サーバーエラーが発生しました。時間をおいてもう一度お試しください。", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return withSecurityHeaders(res);
  },
} satisfies ExportedHandler<Env>;
