// サイト共通の設定。値はすべて公開情報のみ（秘密情報は入れない）。
// GA4 測定 ID はユーザー提供待ち。空の間は GA スクリプトを出力しない（ブログ側と同じ方式）。

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  GA_MEASUREMENT_ID?: string;
  IP_HASH_SALT?: string;
}

export const SITE = {
  name: "みんなの紹介コード掲示板",
  brand: "メアのポイ活メディア",
  operator: "メア",
  description:
    "ポイ活の紹介コード・招待コードをみんなで投稿し合える掲示板。Freecash・ワラウ・ハピタス・モッピー・TikTokなど14サービス対応。使いたいコードを探したり、自分のコードを載せたりできます。",
  // ブログ（ポイ活ブログ）の公開 URL。紹介カードの「くわしい紹介」リンク先。
  blogBaseUrl: "https://mea-poikatsu-blog.pages.dev",
  // ハブ「メアのポイ活メディア」（現行の muse.ai URL。移行完了後に差し替える）
  hubUrl:
    "https://muse.ai/s/musezong-he-medeia-pr6xcxtfrplwxt/NPnupwzcqqtYUBN_-w0KoHvF5cDIBSAOBo4Nt8ve-5o",
  xAccount: "https://x.com/pppppuririn",
  dateModified: "2026-11-21",
} as const;

export const PAGE_SIZE = 20;

// 忍者AdMaxの同期タグ（SP用 ID 1239768・PC用 ID 1239769）。ブログ側と同じ2タグ。
// 同一タグの複数箇所流用は公式未確認（表示されない場合は箇所ごとに枠を作り直す）。
export const ADMAX = {
  spScript: "https://adm.shinobi.jp/s/2bf66d3fa0f7b313d221ccbe4ad2aaad",
  pcScript: "https://adm.shinobi.jp/s/36245df0112ed5538fc93ea44079ca30",
} as const;

// 投稿まわりの制限値（設計書 §5.2 / §5.5）
export const LIMITS = {
  codeMaxLength: 64,
  displayNameMaxLength: 30,
  commentMaxLength: 200,
  reportDetailMaxLength: 500,
  bodyMaxBytes: 10 * 1024,
  duplicateCodeWindowSec: 600, // 同一コードの再投稿ブロック（10分）
  minPostIntervalSec: 60, // 同一IPの連続投稿ブロック（1分）
  postsPerHourPerIp: 5, // 同一IPは1時間に5件まで
  reportsPerHourPerIp: 10, // 同一IPの通報は1時間に10件まで
} as const;

export const REPORT_REASONS = [
  { value: "spam", label: "スパム・宣伝" },
  { value: "false_info", label: "うその情報・使えないコード" },
  { value: "personal_info", label: "個人情報が含まれている" },
  { value: "abuse", label: "誹謗中傷・不快な内容" },
  { value: "other", label: "その他" },
] as const;
