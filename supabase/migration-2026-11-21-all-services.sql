-- ============================================================
-- みんなの紹介コード掲示板 — 移行SQL（2026-11-21）
-- 全19サービス＋「その他」対応／名無しは「無名」
-- ============================================================
-- 実行方法：Supabase ダッシュボードの「SQL Editor」にこのファイルの内容を
-- 貼り付けて Run する（1回だけ。schema.sql 実行済みのプロジェクト向け）。
--
-- 内容：
--   1. posts.service の CHECK 制約を拡張（＋楽天モバイル／メルカリ／PayPay／
--      エアウォレット／SMBC Olive／その他 'other'）
--   2. リンク型サービス（楽天モバイル）のコード欄URLを許可するため、
--      posts_code_format と posts_code_no_spam をサービス別条件に変更
--   3. 「その他」用に service_name カラムを追加（自由記入のサービス名）
--   4. nickname のデフォルトを '無名' に変更（既存データは変更しない）
--   5. 運営者コード5件の seed を追加
-- 既存の投稿データは変更・削除しません。
-- ============================================================

-- ---------- 1. 対象サービスの拡張 ----------
alter table public.posts drop constraint if exists posts_service_check;
alter table public.posts add constraint posts_service_check check (service in (
  'freecash','warau','hapitas','moppy','tiktok','tiktok-lite','orikuji',
  'pokekatsu','muse','sampo','butamaru','mirapoi','tokueru','dips',
  'rakuten-mobile','mercari','paypay','airwallet','smbc-olive','other'
));

-- ---------- 2. リンク型（楽天モバイル）のコード形式・スパム制約 ----------
-- 通常サービス：1〜64文字、英数字・ハイフン・アンダースコアのみ（従来どおり）
-- 楽天モバイル：紹介リンク（http/https のURL）をそのまま許可（200文字まで）
alter table public.posts drop constraint if exists posts_code_format;
alter table public.posts add constraint posts_code_format check (
  (service = 'rakuten-mobile'
    and char_length(code) between 1 and 200
    and code ~* '^https?://')
  or
  (service <> 'rakuten-mobile'
    and char_length(code) between 1 and 64
    and code ~ '^[A-Za-z0-9_-]+$')
);

-- コード欄の自動ブロック：楽天モバイルのコード（＝紹介リンク）だけURL判定を外す。
-- メールアドレス・電話番号の判定はリンク型でも維持する。
-- それ以外のサービスは従来どおり全面ブロック。
alter table public.posts drop constraint if exists posts_code_no_spam;
alter table public.posts add constraint posts_code_no_spam check (
  (service = 'rakuten-mobile'
    and code !~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
    and code !~ '0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}')
  or
  (service <> 'rakuten-mobile'
    and code !~* '(https?://|www\.)'
    and code !~* '[a-z0-9-]+\.(com|net|org|jp|io|to|ly|me|app|site|online|xyz|info|biz|click|link)([^a-z0-9]|$)'
    and code !~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
    and code !~ '0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}')
);

-- ---------- 3. 「その他」用のサービス名カラム ----------
alter table public.posts add column if not exists service_name text;

alter table public.posts drop constraint if exists posts_service_name_length;
alter table public.posts add constraint posts_service_name_length check (
  service_name is null or char_length(service_name) <= 50
);

-- 「その他」の投稿にはサービス名が必須。それ以外では service_name は null のみ許可はしない
-- （サイト側は「その他」以外では送らないが、DB側では必須性だけを担保する）。
alter table public.posts drop constraint if exists posts_service_name_required;
alter table public.posts add constraint posts_service_name_required check (
  service <> 'other' or (service_name is not null and char_length(trim(service_name)) >= 1)
);

alter table public.posts drop constraint if exists posts_service_name_no_spam;
alter table public.posts add constraint posts_service_name_no_spam check (
  service_name is null or (
    service_name !~* '(https?://|www\.)'
    and service_name !~* '[a-z0-9-]+\.(com|net|org|jp|io|to|ly|me|app|site|online|xyz|info|biz|click|link)([^a-z0-9]|$)'
    and service_name !~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
    and service_name !~ '0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}'
    and not (
      char_length(regexp_replace(service_name, '[^0-9]', '', 'g')) between 10 and 11
      and regexp_replace(service_name, '[^0-9]', '', 'g') like '0%'
    )
  )
);

-- ---------- 4. 名無しのデフォルトを「無名」に（既存データは変更しない） ----------
alter table public.posts alter column nickname set default '無名';

-- ---------- 5. 運営者コード5件の seed ----------
-- ※ 同一コードの10分ブロック（トリガー）は INSERT 時にも効くため、実行は1回だけにすること。
insert into public.posts (service, code, nickname, comment) values
  ('rakuten-mobile', 'https://r10.to/hgZk3d', '某関西人', '初めての申込で、MNPなら13,000ポイント、それ以外でも12,000ポイントもらえるチャンス♪'),
  ('mercari',        'HKRDNM',                '某関西人', '新規登録で500円分お得にお買い物できるよ♪'),
  ('paypay',         '02-49XLFP8',            '某関西人', 'コード入力＋1,000円以上の決済で300pt。どちらも新規登録から60日以内に！'),
  ('airwallet',      'qpgtg29',               '某関西人', '銀行口座間の送金が手数料無料。新規登録でPontaポイント300ポイント♪'),
  ('smbc-olive',     'FF89103-3439377',       '某関西人', 'エントリー＋Olive契約＋翌月末時点で残高1万円以上でVポイント1,000円相当♪');
