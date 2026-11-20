# みんなの紹介コード掲示板（mea-keijiban）

来訪者が紹介コードを投稿し合える掲示板。Cloudflare Workers（Static Assets＋SSR/API）＋D1 で構築し、完全無料の範囲だけで運用する（R2 不使用・画像アップロードなし・有料プランなし）。

設計：`~/workspace/board-new-build-design-20261120.md`
決定事項：`~/workspace/board-build-decisions-2026-11-21.md`（§10 の12件すべて推奨案で確定）

## 構成

| パス | 内容 |
|---|---|
| `src/index.ts` | ルーティング＋セキュリティヘッダー |
| `src/pages.ts` | ページ描画・API（投稿作成／一覧／通報） |
| `src/render.ts` | レイアウト・投稿カード・投稿フォーム・紹介カード |
| `src/content.ts` | ルール・FAQ・プライバシーポリシー・利用規約の本文 |
| `src/db.ts` | D1 アクセス（全てプリペアドステートメント） |
| `src/security.ts` | バリデーション・自動ブロック（URL/メール/電話）・IP ハッシュ |
| `src/turnstile.ts` | Turnstile サーバー側検証（キー未設定ならスキップ） |
| `src/data.ts` | 紹介カード（運営者のコード・特典・ブログ記事リンク） |
| `src/config.ts` | サイト設定・制限値（GA4 ID はここではなく vars で管理） |
| `public/assets/` | CSS・JS（静的アセットとして配信） |
| `migrations/` | D1 スキーマ |
| `seeds/services.sql` | サービスマスタ19件（掲示板に出すのは board_enabled=1 の14件） |

## 主な仕様（決定事項どおり）

- 投稿は即時公開＋自動ブロック＋事後モデレーション（通報フォーム→運営が Wrangler で対応）
- 自動ブロック：URL・メールアドレス・電話番号／同一コードの10分以内再投稿／同一IPの連続投稿（1分）・1時間5件まで
- 表示名の未入力時は「某関西人」（設計書 §4.2・§5.2 の既定値どおり）
- Turnstile はキーの差し込み口のみ用意。`TURNSTILE_SITE_KEY`（vars）と `TURNSTILE_SECRET_KEY`（secret）の両方を設定すると有効化される。未設定の環境では無効（投稿は `turnstile_ok=0` で記録される。有効化後に検証を通過した投稿は `1`）
- GA4 はブログと同一プロパティ。`GA_MEASUREMENT_ID`（vars）に測定 ID を入れると全ページへ出力される（空なら何も出ない）
- AdMax 同期タグ（SP/PC）はレイアウトに組み込み済み（ブログと同じ2タグ。同一タグ流用の表示可否は公式未確認）

## ローカル開発

```bash
npm install
npm run db:setup:local   # ローカル D1 にスキーマ適用＋サービスマスタ投入
npm run dev              # http://localhost:8787
```

Turnstile をローカルで試す場合は `.dev.vars.example` を `.dev.vars` にコピーしてキーを入れ、`wrangler.toml` の `TURNSTILE_SITE_KEY` にサイトキーを設定する。

## デプロイ時に必要なもの（チェックリスト）

1. **Cloudflare アカウント**（作成済み・2026-11-21 ログイン確認済み）
2. **D1 データベース作成**：`npx wrangler d1 create mea-keijiban-db` → 発行された `database_id` を `wrangler.toml` に記入
3. **スキーマ＋マスタ投入（本番）**：
   - `npx wrangler d1 migrations apply mea-keijiban-db --remote`
   - `npx wrangler d1 execute mea-keijiban-db --remote --file=seeds/services.sql`
4. **Turnstile ウィジェット作成**（Cloudflare ダッシュボード → Turnstile）：対象ホスト名を登録し、サイトキー／シークレットキーを取得
   - `wrangler.toml` の `TURNSTILE_SITE_KEY` にサイトキーを記入
   - `npx wrangler secret put TURNSTILE_SECRET_KEY` でシークレットキーを登録
   - （任意）`npx wrangler secret put IP_HASH_SALT` で IP ハッシュ用ソルトを設定
5. **GA4 測定 ID**（ユーザー提供待ち）：`wrangler.toml` の `GA_MEASUREMENT_ID` に記入
6. **デプロイ**：`npm run deploy` → `https://mea-keijiban.<アカウントのサブドメイン>.workers.dev` で公開
7. **公開後の確認**：表示・投稿・自動ブロック・Turnstile の動作確認、Search Console 登録とサイトマップ送信、ハブ／ブログからのリンク設置、旧掲示板への移転案内（旧掲示板は削除しない）
8. （任意）**Workers Spending Limit** の設定：誤って有料プランへ移行した場合の安全弁

## 運用（モデレーション v1：Wrangler 操作のみ）

```bash
# 通報の確認
npx wrangler d1 execute mea-keijiban-db --remote --command="SELECT * FROM reports WHERE status='open' ORDER BY created_at DESC"
# 投稿を非表示にする
npx wrangler d1 execute mea-keijiban-db --remote --command="UPDATE posts SET status='hidden' WHERE id=<ID>"
# バックアップ（月1回＋大きな変更前）
npx wrangler d1 export mea-keijiban-db --remote --output=backup-YYYYMMDD.sql
```
