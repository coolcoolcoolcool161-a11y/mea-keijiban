-- ============================================================
-- みんなの紹介コード掲示板 — Supabase（Postgres）スキーマ
-- ============================================================
-- 実行方法：Supabase プロジェクト作成後、ダッシュボードの
-- 「SQL Editor」にこのファイルの内容を貼り付けて Run する（1回だけ）。
--
-- 方針（決定記録 board-build-decisions-2026-11-21.md の12件を踏襲）:
--   - 対象は掲示板OKの14サービスのみ（service の CHECK 制約で固定）
--   - 即時公開（status の初期値 'published'）＋自動ブロック＋事後モデレーション
--   - 自動ブロックは2層：クライアント側チェック（src/lib/validate.js）に加え、
--     このファイルの CHECK 制約＋トリガーで最終防衛する（REST APIを直接叩いても防げる）
--   - 匿名（anon）ロールは「公開済み投稿の読み取り」と「投稿・通報の挿入」だけ可能。
--     更新・削除は不可。非表示化などのモデレーションは管理者（service_role /
--     ダッシュボード）から status を変更して行う。
--   - 画像アップロードなし／コメント・返信機能なし／投稿者の編集・削除なし（v1）
-- ============================================================

-- ---------- 投稿 ----------
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  service    text not null,
  code       text not null,
  nickname   text not null default '某関西人',
  comment    text,
  status     text not null default 'published',
  created_at timestamptz not null default now(),

  -- 対象14サービスのみ
  constraint posts_service_check check (service in (
    'freecash','warau','hapitas','moppy','tiktok','tiktok-lite','orikuji',
    'pokekatsu','muse','sampo','butamaru','mirapoi','tokueru','dips'
  )),
  constraint posts_status_check check (status in ('published','pending','hidden','deleted')),

  -- 紹介コード：1〜64文字、英数字・ハイフン・アンダースコアのみ
  constraint posts_code_format check (
    char_length(code) between 1 and 64 and code ~ '^[A-Za-z0-9_-]+$'
  ),
  -- 表示名：30文字以内
  constraint posts_nickname_length check (char_length(nickname) <= 30),
  -- コメント：200文字以内
  constraint posts_comment_length check (comment is null or char_length(comment) <= 200),

  -- 自動ブロック（URL・ドメイン・メールアドレス・電話番号）— validate.js と同じ条件
  constraint posts_code_no_spam check (
    code !~* '(https?://|www\.)'
    and code !~* '[a-z0-9-]+\.(com|net|org|jp|io|to|ly|me|app|site|online|xyz|info|biz|click|link)([^a-z0-9]|$)'
    and code !~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
    and code !~ '0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}'
  ),
  constraint posts_nickname_no_spam check (
    nickname !~* '(https?://|www\.)'
    and nickname !~* '[a-z0-9-]+\.(com|net|org|jp|io|to|ly|me|app|site|online|xyz|info|biz|click|link)([^a-z0-9]|$)'
    and nickname !~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
    and nickname !~ '0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}'
    and not (
      char_length(regexp_replace(nickname, '[^0-9]', '', 'g')) between 10 and 11
      and regexp_replace(nickname, '[^0-9]', '', 'g') like '0%'
    )
  ),
  constraint posts_comment_no_spam check (
    comment is null or (
      comment !~* '(https?://|www\.)'
      and comment !~* '[a-z0-9-]+\.(com|net|org|jp|io|to|ly|me|app|site|online|xyz|info|biz|click|link)([^a-z0-9]|$)'
      and comment !~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
      and comment !~ '0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}'
      and not (
        char_length(regexp_replace(comment, '[^0-9]', '', 'g')) between 10 and 11
        and regexp_replace(comment, '[^0-9]', '', 'g') like '0%'
      )
    )
  )
);

create index if not exists idx_posts_service_created on public.posts (service, created_at desc);
create index if not exists idx_posts_status_created on public.posts (status, created_at desc);
create index if not exists idx_posts_code_created on public.posts (code, created_at desc);

-- ---------- 同一コードの10分以内再投稿ブロック（トリガー） ----------
create or replace function public.block_duplicate_code()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.posts
    where code = new.code
      and created_at > now() - interval '10 minutes'
  ) then
    raise exception 'duplicate_code_window';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_block_duplicate_code on public.posts;
create trigger trg_block_duplicate_code
  before insert on public.posts
  for each row execute function public.block_duplicate_code();

-- ---------- 通報 ----------
create table if not exists public.reports (
  id         bigint generated always as identity primary key,
  post_id    bigint not null references public.posts(id) on delete cascade,
  reason     text not null,
  detail     text,
  status     text not null default 'open',
  created_at timestamptz not null default now(),

  constraint reports_reason_check check (reason in ('spam','false_info','personal_info','abuse','other')),
  constraint reports_status_check check (status in ('open','resolved','dismissed')),
  constraint reports_detail_length check (detail is null or char_length(detail) <= 500),
  constraint reports_detail_no_spam check (
    detail is null or (
      detail !~* '(https?://|www\.)'
      and detail !~ '[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+'
      and detail !~ '0[0-9]{1,4}-[0-9]{1,4}-[0-9]{4}'
    )
  )
);

create index if not exists idx_reports_post on public.reports (post_id, created_at desc);

-- ---------- RLS（Row Level Security） ----------
alter table public.posts enable row level security;
alter table public.reports enable row level security;

-- 投稿：誰でも「公開済み」だけ読める
drop policy if exists posts_select_published on public.posts;
create policy posts_select_published on public.posts
  for select to anon, authenticated
  using (status = 'published');

-- 投稿：匿名で新規投稿できる（公開ステータスでのみ。形式チェックは CHECK 制約が担保）
drop policy if exists posts_insert_anon on public.posts;
create policy posts_insert_anon on public.posts
  for insert to anon, authenticated
  with check (status = 'published');

-- 投稿：匿名の更新・削除ポリシーは作らない（＝不可）。モデレーションは管理者のみ。

-- 通報：匿名で送れる。読み取りポリシーは作らない（＝管理者だけが読める）
drop policy if exists reports_insert_anon on public.reports;
create policy reports_insert_anon on public.reports
  for insert to anon, authenticated
  with check (status = 'open');

-- ---------- APIロールへの権限付与（PostgREST経由のアクセスに必要） ----------
grant select, insert on public.posts to anon, authenticated;
grant insert on public.reports to anon, authenticated;
grant usage, select on sequence public.posts_id_seq to anon, authenticated;
grant usage, select on sequence public.reports_id_seq to anon, authenticated;

-- ============================================================
-- セットアップ完了後にやること：
-- 1. ダッシュボード「Project Settings → API」で Project URL と anon public キーを確認
-- 2. サイト側 src/data/supabase.ts の SUPABASE_URL / SUPABASE_ANON_KEY にその2つを入れて再push
--    （service_role キーは絶対にサイトへ入れないこと）
-- 3. テスト投稿を1件行い、表示を確認したら Table Editor からその行を削除する
-- ============================================================
