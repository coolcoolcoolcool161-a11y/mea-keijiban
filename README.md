# みんなの紹介コード掲示板（GitHub Pages ＋ Supabase 版）

ポイ活の紹介コード・招待コードを投稿し合える訪問者掲示板。
旧計画（Cloudflare Workers＋D1）は2026-11-21のユーザー指示で廃止し、他の8サイトと同じ
**GitHub Pages（Astro 静的サイト）＋ Supabase 無料プラン（Postgres＋REST API）** で構築する。

- 公開URL：https://coolcoolcoolcool161-a11y.github.io/mea-keijiban/
- 仕様：`~/workspace/board-build-decisions-2026-11-21.md` の決定12件を踏襲
  （対象14サービス／即時公開＋自動ブロック／GA4共通／画像なし／コメント機能なし／
  投稿者の編集・削除なし＝削除依頼は通報経由／サービス別一覧のみ）

## 構成

| 部分 | 実装 |
|---|---|
| 静的ページ（SEO） | Astro。トップ＋サービス別14ページ＋ルール/プライバシー/規約/広告表記をプリレンダリング |
| 投稿データ | Supabase（Postgres）。ブラウザから REST API（anon キー）で読み書き |
| 自動ブロック | クライアント側チェック（`src/lib/validate.js`）＋ DB の CHECK 制約＋重複トリガー（`supabase/schema.sql`） |
| モデレーション | 管理者が Supabase ダッシュボードで `posts.status` を hidden/deleted に変更（v1） |
| 計測 | GA4 `G-8BB8V3DRW8`（他サイトと同一プロパティ） |

## セットアップ手順（Supabase）

1. https://supabase.com で GitHub アカウント（coolcoolcoolcool161-a11y）でサインアップ（無料）。
2. New Project を作成（Free プラン。リージョンは Tokyo / ap-northeast-1 推奨）。課金登録はしない。
3. ダッシュボード「SQL Editor」で `supabase/schema.sql` の内容を実行する。
4. （任意）初期投稿として運営者のコードを並べる場合は `supabase/seed-operator-posts.sql` を実行する。
5. 「Project Settings → API」で **Project URL** と **anon public キー** を確認する。
6. `src/data/supabase.ts` の `SUPABASE_URL` / `SUPABASE_ANON_KEY` にその2つを入れて push する
   （**service_role キーは絶対に入れない**。anon キーは公開前提のキーのため埋め込み可）。
7. サイトでテスト投稿を1件行い、一覧に表示されることを確認したら、
   Table Editor からそのテスト行を削除する。

## デプロイ

`main` への push で GitHub Actions（`.github/workflows/deploy.yml`）が Astro をビルドして
GitHub Pages へ公開する。他8サイトと同じ方式。

## リポジトリ内の旧ファイルについて

このリポジトリには旧 Workers 版のファイル（`wrangler.toml`、`src/*.ts`、`migrations/`、
`seeds/`、`.dev.vars.example`、`tsconfig.json`）が残っている。コネクタの push では削除が
できないため残置しているが、現在のビルド（Astro）はそれらを参照しない。
不要であれば GitHub 上で手動削除してよい。
